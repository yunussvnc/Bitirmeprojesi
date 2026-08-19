import asyncio
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

import models
from app.dependencies import get_current_user, get_db
from app.interview_schemas import (
    AnswerEvaluationResponse,
    CvExtractResponse,
    InterviewAnswerCreate,
    InterviewPlanCreate,
    InterviewPlanResponse,
    InterviewPlanSummary,
    InterviewQuestionResponse,
)
from app.services.document_extract import DocumentExtractionError, extract_document_text
from app.services.interview_coach import build_interview_plan, evaluate_answer

router = APIRouter(prefix="/interview-coach", tags=["Interview Coach"])

MAX_CV_SIZE = 5 * 1024 * 1024
ALLOWED_CV_EXTENSIONS = {"pdf", "docx", "txt"}
ALLOWED_CV_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/octet-stream",
}
_AI_SEMAPHORE = asyncio.Semaphore(4)
_EXTRACTION_SEMAPHORE = asyncio.Semaphore(2)


def _question_response(question: models.InterviewQuestion) -> InterviewQuestionResponse:
    return InterviewQuestionResponse.model_validate(question)


def _plan_response(plan: models.InterviewPlan) -> InterviewPlanResponse:
    questions = [_question_response(item) for item in sorted(plan.questions, key=lambda q: q.order_index)]
    answered_count = sum(1 for item in questions if item.score is not None)
    return InterviewPlanResponse(
        id=plan.id,
        role_title=plan.role_title,
        company_name=plan.company_name,
        status=plan.status,
        readiness_score=plan.readiness_score,
        match_score=plan.match_score,
        question_count=len(questions),
        answered_count=answered_count,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        interview_language=plan.interview_language,
        analysis=plan.analysis or {},
        questions=questions,
    )


def _get_owned_plan(db: Session, plan_id: int, user_id: int) -> models.InterviewPlan:
    plan = db.query(models.InterviewPlan).filter(
        models.InterviewPlan.id == plan_id,
        models.InterviewPlan.user_id == user_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Mülakat hazırlık planı bulunamadı.")
    return plan


@router.post("/cv/extract", response_model=CvExtractResponse)
async def extract_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    del current_user
    filename = (file.filename or "cv").strip()
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_CV_EXTENSIONS:
        raise HTTPException(status_code=400, detail="CV; PDF, DOCX veya TXT formatında olmalıdır.")
    if file.content_type and file.content_type not in ALLOWED_CV_MIMES:
        raise HTTPException(status_code=400, detail="CV dosyasının MIME türü geçersiz.")

    contents = await file.read(MAX_CV_SIZE + 1)
    if len(contents) > MAX_CV_SIZE:
        raise HTTPException(status_code=413, detail="CV dosyası 5MB'dan büyük olamaz.")
    try:
        await asyncio.wait_for(_EXTRACTION_SEMAPHORE.acquire(), timeout=1.0)
    except TimeoutError as exc:
        raise HTTPException(status_code=503, detail="Belge işleme kapasitesi dolu. Lütfen kısa süre sonra tekrar deneyin.") from exc
    try:
        text = (await run_in_threadpool(extract_document_text, extension, contents)).strip()
    except DocumentExtractionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        _EXTRACTION_SEMAPHORE.release()
    if len(text) < 80:
        raise HTTPException(
            status_code=400,
            detail="CV'den yeterli metin çıkarılamadı. Taranmış PDF yerine metin tabanlı PDF/DOCX veya TXT kullanın.",
        )
    text = text[:80_000]
    return CvExtractResponse(filename=filename, text=text, character_count=len(text))


@router.post("/plans", response_model=InterviewPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    payload: InterviewPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Kullanıcı satırı kilidi, çoklu worker süreçlerinde kota kontrolü ve rezervasyonu atomik tutar.
    db.query(models.User).filter(models.User.id == current_user.id).with_for_update().one()
    stale_cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    db.query(models.InterviewPlan).filter(
        models.InterviewPlan.user_id == current_user.id,
        models.InterviewPlan.status == "generating",
        models.InterviewPlan.created_at < stale_cutoff,
    ).delete(synchronize_session=False)
    total_plans = db.query(models.InterviewPlan).filter(models.InterviewPlan.user_id == current_user.id).count()
    if total_plans >= 20:
        raise HTTPException(status_code=429, detail="En fazla 20 hazırlık planı saklayabilirsiniz. Yeni plan için eski bir planı silin.")
    day_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    daily_plans = db.query(models.InterviewPlan).filter(
        models.InterviewPlan.user_id == current_user.id,
        models.InterviewPlan.created_at >= day_start,
    ).count()
    if daily_plans >= 5:
        raise HTTPException(status_code=429, detail="Günlük hazırlık planı sınırına ulaştınız.")
    plan = models.InterviewPlan(
        user_id=current_user.id,
        role_title=payload.role_title,
        company_name=payload.company_name,
        interview_language=payload.interview_language,
        status="generating",
        analysis={},
        match_score=0,
        readiness_score=0,
        generation_mode="pending",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    try:
        async with _AI_SEMAPHORE:
            analysis, questions, generation_mode = await run_in_threadpool(
                build_interview_plan,
                payload.cv_text,
                payload.job_description,
                payload.role_title,
                payload.company_name,
                payload.interview_language,
            )
    except Exception:
        db.delete(plan)
        db.commit()
        raise

    match_score = int(analysis.get("match_score", 0))
    plan.status = "ready"
    plan.analysis = analysis
    plan.match_score = match_score
    plan.readiness_score = round(match_score * 0.6 + 40 * 0.4)
    plan.generation_mode = generation_mode
    for index, item in enumerate(questions):
        db.add(models.InterviewQuestion(
            plan_id=plan.id,
            category=item["category"],
            difficulty=item["difficulty"],
            question=item["question"],
            rationale=item["rationale"],
            answer_framework=item.get("answer_framework") or [],
            evaluation_criteria=item.get("evaluation_criteria") or [],
            order_index=index,
        ))
    db.commit()
    db.refresh(plan)
    return _plan_response(plan)


@router.get("/plans", response_model=list[InterviewPlanSummary])
def list_plans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plans = db.query(models.InterviewPlan).filter(
        models.InterviewPlan.user_id == current_user.id
    ).order_by(models.InterviewPlan.created_at.desc()).limit(30).all()
    return [InterviewPlanSummary(
        id=plan.id,
        role_title=plan.role_title,
        company_name=plan.company_name,
        status=plan.status,
        readiness_score=plan.readiness_score,
        match_score=plan.match_score,
        question_count=len(plan.questions),
        answered_count=sum(1 for question in plan.questions if question.score is not None),
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    ) for plan in plans]


@router.get("/plans/{plan_id}", response_model=InterviewPlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _plan_response(_get_owned_plan(db, plan_id, current_user.id))


@router.post("/plans/{plan_id}/questions/{question_id}/evaluate", response_model=AnswerEvaluationResponse)
async def evaluate_question_answer(
    plan_id: int,
    question_id: int,
    payload: InterviewAnswerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(db, plan_id, current_user.id)
    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == question_id,
        models.InterviewQuestion.plan_id == plan.id,
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Mülakat sorusu bulunamadı.")
    reserved = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == question_id,
        models.InterviewQuestion.plan_id == plan.id,
        models.InterviewQuestion.evaluation_count < 5,
    ).update(
        {models.InterviewQuestion.evaluation_count: models.InterviewQuestion.evaluation_count + 1},
        synchronize_session=False,
    )
    if reserved != 1:
        db.rollback()
        raise HTTPException(status_code=429, detail="Bu soru için değerlendirme sınırına ulaştınız.")
    db.commit()
    db.refresh(question)

    question_context = {
        "question": question.question,
        "rationale": question.rationale,
        "evaluation_criteria": question.evaluation_criteria or [],
    }
    plan_context = {"role_title": plan.role_title, "company_name": plan.company_name}
    async with _AI_SEMAPHORE:
        score, feedback, mode = await run_in_threadpool(
            evaluate_answer,
            question_context,
            payload.answer_text,
            plan_context,
            plan.interview_language,
        )
    question.feedback = feedback
    question.score = score
    question.evaluation_mode = mode
    question.answered_at = datetime.now(timezone.utc)

    scores = [item.score for item in plan.questions if item.score is not None and item.id != question.id]
    scores.append(score)
    answer_average = sum(scores) / len(scores)
    plan.readiness_score = round(plan.match_score * 0.35 + answer_average * 0.65)
    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    return AnswerEvaluationResponse(
        question_id=question.id,
        score=score,
        readiness_score=plan.readiness_score,
        feedback=feedback,
    )


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(db, plan_id, current_user.id)
    db.delete(plan)
    db.commit()
    return None
