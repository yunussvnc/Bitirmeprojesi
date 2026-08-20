import { apiDelete, apiGet, apiPost, apiUploadFile } from "@/src/utils/apiClient";

export type InterviewGap = {
  skill: string;
  priority: string;
  risk: string;
  action: string;
};

export type InterviewStrength = {
  title: string;
  evidence: string;
  how_to_use: string;
};

export type StudyPlanDay = {
  day: number;
  focus: string;
  tasks: string[];
  success_metric: string;
};

export type InterviewAnalysis = {
  executive_summary: string;
  match_score: number;
  strengths: InterviewStrength[];
  gaps: InterviewGap[];
  keywords: string[];
  company_focus: string[];
  likely_interview_stages: string[];
  elevator_pitch: string;
  questions_to_ask: string[];
  study_plan: StudyPlanDay[];
  final_checklist: string[];
};

export type AnswerFeedback = {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  star_feedback?: Record<string, string>;
  improved_answer: string;
  next_drill: string;
};

export type InterviewQuestion = {
  id: number;
  category: string;
  difficulty: string;
  question: string;
  rationale: string;
  answer_framework: string[];
  evaluation_criteria: string[];
  order_index: number;
  feedback?: AnswerFeedback | null;
  score?: number | null;
  answered_at?: string | null;
};

export type InterviewPlanSummary = {
  id: number;
  role_title: string;
  company_name: string;
  status: string;
  readiness_score: number;
  match_score: number;
  question_count: number;
  answered_count: number;
  created_at: string;
  updated_at?: string | null;
};

export type InterviewPlan = InterviewPlanSummary & {
  interview_language: "tr" | "en";
  analysis: InterviewAnalysis;
  questions: InterviewQuestion[];
};

export type CreateInterviewPlanPayload = {
  role_title: string;
  company_name: string;
  job_description: string;
  cv_text: string;
  interview_language: "tr" | "en";
  consent_ai_processing: true;
};

export async function extractCv(file: { uri: string; name: string; type?: string }) {
  return apiUploadFile<{ filename: string; text: string; character_count: number }>(
    "/interview-coach/cv/extract",
    file,
    "file",
  );
}

export async function createInterviewPlan(payload: CreateInterviewPlanPayload) {
  return apiPost<InterviewPlan>("/interview-coach/plans", payload, { timeoutMs: 90000 });
}

export async function getInterviewPlans() {
  return apiGet<InterviewPlanSummary[]>("/interview-coach/plans");
}

export async function getInterviewPlan(id: number) {
  return apiGet<InterviewPlan>(`/interview-coach/plans/${id}`);
}

export async function evaluateInterviewAnswer(planId: number, questionId: number, answerText: string) {
  return apiPost<{ question_id: number; score: number; readiness_score: number; feedback: AnswerFeedback }>(
    `/interview-coach/plans/${planId}/questions/${questionId}/evaluate`,
    { answer_text: answerText },
    { timeoutMs: 60000 },
  );
}

export async function deleteInterviewPlan(id: number) {
  return apiDelete(`/interview-coach/plans/${id}`);
}
