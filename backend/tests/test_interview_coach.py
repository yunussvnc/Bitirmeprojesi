from unittest.mock import patch

from tests.conftest import create_test_user, get_auth_headers


CV_TEXT = " " .join([
    "Yazılım geliştirici olarak Python FastAPI React ve PostgreSQL ile dört yıllık deneyim.",
    "Ödeme servisinde gecikmeyi yüzde 35 azalttım ve test kapsamını artırdım.",
    "Çevik ekiplerde teknik liderlik yaptım ve ürün ekipleriyle yakın çalıştım.",
] * 3)

JOB_TEXT = " " .join([
    "Kıdemli Backend Developer arıyoruz. Python, FastAPI, PostgreSQL ve Redis deneyimi gereklidir.",
    "Aday mikroservis mimarisi, ölçeklenebilir sistemler, test otomasyonu ve ekip iletişimi konularında güçlü olmalıdır.",
    "Bulut servisleri ve Docker deneyimi tercih sebebidir.",
] * 3)

ANALYSIS = {
    "executive_summary": "Profil rolün temel ihtiyaçlarıyla güçlü eşleşiyor.",
    "match_score": 82,
    "strengths": [{"title": "Python", "evidence": "Dört yıllık deneyim", "how_to_use": "Başarı örneği ver"}],
    "gaps": [{"skill": "Docker", "priority": "orta", "risk": "CV'de zayıf", "action": "Örnek hazırla"}],
    "keywords": ["python", "fastapi", "postgresql"],
    "company_focus": ["Ürün stratejisi"],
    "likely_interview_stages": ["İK", "Teknik"],
    "elevator_pitch": "Deneyimli ve sonuç odaklı bir geliştiriciyim.",
    "questions_to_ask": ["İlk 90 gün beklentisi nedir?"],
    "study_plan": [{"day": 1, "focus": "Teknik", "tasks": ["FastAPI"], "success_metric": "Prova"}],
    "final_checklist": ["CV hazır"],
}

QUESTIONS = [{
    "category": "technical",
    "difficulty": "orta",
    "question": "FastAPI ile ölçeklenebilir bir servisi nasıl tasarlarsınız?",
    "rationale": "Teknik karar kalitesini ölçer.",
    "answer_framework": ["Bağlam", "Karar", "Sonuç"],
    "evaluation_criteria": ["Somutluk", "Ölçeklenebilirlik"],
}]


def payload():
    return {
        "role_title": "Senior Backend Developer",
        "company_name": "Örnek Teknoloji",
        "job_description": JOB_TEXT,
        "cv_text": CV_TEXT,
        "interview_language": "tr",
        "consent_ai_processing": True,
    }


class TestInterviewCoach:
    def test_authentication_is_required(self, client):
        response = client.get("/interview-coach/plans")
        assert response.status_code == 401

    @patch("app.routers.interview_coach.build_interview_plan", return_value=(ANALYSIS, QUESTIONS, "llm"))
    def test_create_and_get_personalised_plan(self, build_mock, client):
        user_id = create_test_user(email="coach@test.com", username="coach")
        headers = get_auth_headers(user_id)

        response = client.post("/interview-coach/plans", json=payload(), headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["company_name"] == "Örnek Teknoloji"
        assert data["match_score"] == 82
        assert data["question_count"] == 1
        assert data["questions"][0]["category"] == "technical"
        assert data["analysis"]["gaps"][0]["skill"] == "Docker"
        build_mock.assert_called_once()

        plan_id = data["id"]
        get_response = client.get(f"/interview-coach/plans/{plan_id}", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json()["id"] == plan_id

        list_response = client.get("/interview-coach/plans", headers=headers)
        assert list_response.status_code == 200
        assert list_response.json()[0]["answered_count"] == 0

    @patch("app.routers.interview_coach.evaluate_answer")
    @patch("app.routers.interview_coach.build_interview_plan", return_value=(ANALYSIS, QUESTIONS, "llm"))
    def test_answer_evaluation_updates_readiness(self, build_mock, evaluate_mock, client):
        evaluate_mock.return_value = (
            88,
            {
                "score": 88,
                "verdict": "güçlü",
                "strengths": ["Somut"],
                "improvements": ["Metrik ekle"],
                "star_feedback": {"situation": "Net", "task": "Net", "action": "Net", "result": "Net"},
                "improved_answer": "Bağlam, kişisel eylem ve ölçülebilir sonuçla yapılandırılmış cevap.",
                "next_drill": "Cevabı 90 saniyede tekrar ver.",
            },
            "llm",
        )
        user_id = create_test_user(email="answer@test.com", username="answer")
        headers = get_auth_headers(user_id)
        plan = client.post("/interview-coach/plans", json=payload(), headers=headers).json()
        question_id = plan["questions"][0]["id"]

        response = client.post(
            f"/interview-coach/plans/{plan['id']}/questions/{question_id}/evaluate",
            json={"answer_text": "Önce yük profilini çıkardım, asenkron iş kuyruğu kullandım ve gecikmeyi yüzde 35 azalttım."},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 88
        assert data["readiness_score"] == 86
        assert data["feedback"]["verdict"] == "güçlü"

    @patch("app.routers.interview_coach.build_interview_plan", return_value=(ANALYSIS, QUESTIONS, "rule_based"))
    def test_plan_is_private_to_owner_and_can_be_deleted(self, build_mock, client):
        owner_id = create_test_user(email="owner@test.com", username="owner")
        other_id = create_test_user(email="other@test.com", username="other")
        plan = client.post(
            "/interview-coach/plans", json=payload(), headers=get_auth_headers(owner_id)
        ).json()

        forbidden_as_not_found = client.get(
            f"/interview-coach/plans/{plan['id']}", headers=get_auth_headers(other_id)
        )
        assert forbidden_as_not_found.status_code == 404

        deleted = client.delete(
            f"/interview-coach/plans/{plan['id']}", headers=get_auth_headers(owner_id)
        )
        assert deleted.status_code == 204

    def test_txt_cv_extraction(self, client):
        user_id = create_test_user(email="cv@test.com", username="cvuser")
        response = client.post(
            "/interview-coach/cv/extract",
            files={"file": ("cv.txt", CV_TEXT.encode("utf-8"), "text/plain")},
            headers=get_auth_headers(user_id),
        )
        assert response.status_code == 200
        assert response.json()["character_count"] >= 80
        assert "FastAPI" in response.json()["text"]

    def test_rejects_invalid_cv_extension(self, client):
        user_id = create_test_user(email="badcv@test.com", username="badcv")
        response = client.post(
            "/interview-coach/cv/extract",
            files={"file": ("cv.exe", b"x" * 200, "application/octet-stream")},
            headers=get_auth_headers(user_id),
        )
        assert response.status_code == 400


def test_interview_payload_validation(client):
    user_id = create_test_user(email="valid@test.com", username="valid")
    invalid = payload()
    invalid["job_description"] = "çok kısa"
    response = client.post("/interview-coach/plans", json=invalid, headers=get_auth_headers(user_id))
    assert response.status_code == 422


def test_interview_payload_rejects_whitespace_and_missing_consent(client):
    user_id = create_test_user(email="spaces@test.com", username="spaces")
    invalid = payload()
    invalid["job_description"] = " " * 100
    invalid["cv_text"] = " " * 100
    invalid.pop("consent_ai_processing")
    response = client.post("/interview-coach/plans", json=invalid, headers=get_auth_headers(user_id))
    assert response.status_code == 422


def test_answer_evaluator_accepts_valid_zero_score():
    import json
    from app.services.interview_coach import evaluate_answer

    feedback = {
        "score": 0,
        "verdict": "yetersiz",
        "strengths": [],
        "improvements": ["Soruya cevap verin."],
        "star_feedback": {"situation": "", "task": "", "action": "", "result": ""},
        "improved_answer": "Önce ilgili gerçek deneyimi seçin ve STAR yapısıyla anlatın.",
        "next_drill": "Somut bir örnekle yeniden deneyin.",
    }
    with patch("app.services.interview_coach.llm_generate", return_value=json.dumps(feedback)):
        score, result, mode = evaluate_answer(
            {"question": "Bir örnek verin", "rationale": "Kanıt", "evaluation_criteria": ["Somutluk"]},
            "Bu soruya verecek somut bir cevabım şu anda bulunmuyor.",
            {"role_title": "Developer", "company_name": "Örnek"},
        )
    assert score == 0
    assert result["score"] == 0
    assert mode == "llm"


def test_structurally_invalid_llm_plan_falls_back():
    from app.services.interview_coach import build_interview_plan

    hostile = '{"analysis":{"strengths":"not-a-list"},"questions":[{"question":"x","answer_framework":5}]}'
    with patch("app.services.interview_coach.llm_generate", return_value=hostile):
        analysis, questions, mode = build_interview_plan(CV_TEXT, JOB_TEXT, "Developer", "Örnek")
    assert mode == "rule_based"
    assert isinstance(analysis["strengths"], list)
    assert len(questions) >= 6


def test_llm_derived_output_is_redacted_before_persistence():
    import json
    from app.services.interview_coach import _fallback_analysis, _fallback_questions, build_interview_plan

    analysis = _fallback_analysis(CV_TEXT, JOB_TEXT, "Developer", "Örnek")
    analysis["strengths"][0]["evidence"] = "Adayın e-postası aday@example.com ve telefonu 0555 123 45 67"
    questions = _fallback_questions("Developer", "Örnek", analysis)
    with patch(
        "app.services.interview_coach.llm_generate",
        return_value=json.dumps({"analysis": analysis, "questions": questions}, ensure_ascii=False),
    ):
        result, _, mode = build_interview_plan(CV_TEXT, JOB_TEXT, "Developer", "Örnek")
    assert mode == "llm"
    assert "aday@example.com" not in str(result)
    assert "0555 123 45 67" not in str(result)
    assert "[E-POSTA]" in result["strengths"][0]["evidence"]
    assert "[TELEFON]" in result["strengths"][0]["evidence"]


def test_strict_generated_question_rejects_blank_and_coerced_values():
    import pytest
    from pydantic import ValidationError
    from app.interview_schemas import GeneratedQuestion

    with pytest.raises(ValidationError):
        GeneratedQuestion.model_validate({
            "category": "technical",
            "difficulty": "orta",
            "question": "     ",
            "rationale": " ",
            "answer_framework": [5],
            "evaluation_criteria": ["Somutluk"],
        })


def test_pdf_page_limit_is_enforced(client):
    import io
    from pypdf import PdfWriter

    writer = PdfWriter()
    for _ in range(41):
        writer.add_blank_page(width=612, height=792)
    buffer = io.BytesIO()
    writer.write(buffer)

    user_id = create_test_user(email="pdf@test.com", username="pdfuser")
    response = client.post(
        "/interview-coach/cv/extract",
        files={"file": ("cv.pdf", buffer.getvalue(), "application/pdf")},
        headers=get_auth_headers(user_id),
    )
    assert response.status_code == 400
    assert "40 sayfa" in response.json()["detail"]


def test_large_txt_extraction_does_not_deadlock():
    from app.services.document_extract import extract_document_text

    result = extract_document_text("txt", ("A" * 80_000).encode("utf-8"))
    assert len(result) == 80_000


def test_windows_document_limits_fallback_is_noop():
    from app.services import document_extract

    with patch.object(document_extract, "_resource", None):
        document_extract._set_worker_limits()


def test_llm_enabled_false_skips_provider_call():
    from llm_client import llm_generate, settings

    with patch.object(settings, "LLM_ENABLED", False), patch("llm_client.groq_generate") as provider:
        assert llm_generate("test prompt") == ""
    provider.assert_not_called()


@patch("app.routers.interview_coach.build_interview_plan", return_value=(ANALYSIS, QUESTIONS, "rule_based"))
def test_daily_plan_quota_stops_before_extra_generation(build_mock, client):
    user_id = create_test_user(email="quota@test.com", username="quota")
    headers = get_auth_headers(user_id)
    for _ in range(5):
        assert client.post("/interview-coach/plans", json=payload(), headers=headers).status_code == 201

    blocked = client.post("/interview-coach/plans", json=payload(), headers=headers)
    assert blocked.status_code == 429
    assert build_mock.call_count == 5


@patch("app.routers.interview_coach.evaluate_answer")
@patch("app.routers.interview_coach.build_interview_plan", return_value=(ANALYSIS, QUESTIONS, "rule_based"))
def test_question_evaluation_quota_is_reserved_atomically(build_mock, evaluate_mock, client):
    feedback = {
        "score": 70,
        "verdict": "gelişiyor",
        "strengths": ["İlgili"],
        "improvements": ["Metrik ekle"],
        "star_feedback": {"situation": "Net", "task": "Net", "action": "Net", "result": "Net"},
        "improved_answer": "Cevabı ölçülebilir sonuçla tamamlayın.",
        "next_drill": "90 saniyede tekrar verin.",
    }
    evaluate_mock.return_value = (70, feedback, "rule_based")
    user_id = create_test_user(email="evalquota@test.com", username="evalquota")
    headers = get_auth_headers(user_id)
    plan = client.post("/interview-coach/plans", json=payload(), headers=headers).json()
    endpoint = f"/interview-coach/plans/{plan['id']}/questions/{plan['questions'][0]['id']}/evaluate"
    answer_payload = {"answer_text": "Durumu analiz ettim, kişisel aksiyon aldım ve ölçülebilir sonuç elde ettim."}

    for _ in range(5):
        assert client.post(endpoint, json=answer_payload, headers=headers).status_code == 200
    blocked = client.post(endpoint, json=answer_payload, headers=headers)
    assert blocked.status_code == 429
    assert evaluate_mock.call_count == 5
