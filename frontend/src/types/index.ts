export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution?: string;
  department?: string;
  roll_number?: string;
  created_at: string;
}

export interface RubricCriterion {
  id?: string;
  name: string;
  description?: string;
  expected_concepts: string[];
  max_marks: number;
  scoring_instructions?: string;
  display_order?: number;
}

export interface Question {
  id: string;
  exam_id: string;
  parent_question_id?: string;
  question_number: string;
  text: string;
  question_type: string;
  max_marks: number;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reference_answer: string;
  important_concepts: string[];
  alternative_explanations: string[];
  optional_keywords: string[];
  display_order: number;
  rubric_criteria: RubricCriterion[];
}

export interface Exam {
  id: string;
  teacher_id: string;
  title: string;
  subject: string;
  department?: string;
  class_name?: string;
  section?: string;
  academic_year?: string;
  exam_type?: string;
  exam_date?: string;
  duration_minutes?: number;
  total_marks: number;
  passing_marks?: number;
  instructions?: string;
  status: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  questions_count?: number;
  scripts_count?: number;
  evaluated_count?: number;
  approved_count?: number;
  questions?: Question[];
}

export interface ScriptPage {
  id: string;
  page_number: number;
  original_image_path: string;
  processed_image_path?: string;
  preprocessing_status: string;
}

export interface ExtractedAnswer {
  id: string;
  answer_script_id: string;
  question_id: string;
  question_number?: string;
  question_text?: string;
  max_marks?: number;
  page_references?: string;
  original_ocr_text: string;
  corrected_text?: string;
  final_text: string;
  segmentation_confidence?: number;
  verification_status: string;
}

export interface AnswerScript {
  id: string;
  exam_id: string;
  student_id?: string;
  student_roll_no: string;
  student_name?: string;
  batch_id?: string;
  original_file_name: string;
  stored_file_path: string;
  file_type: string;
  page_count: number;
  upload_status: string;
  processing_status: string;
  total_score?: number;
  is_approved: boolean;
  uploaded_at: string;
  pages?: ScriptPage[];
  extracted_answers?: ExtractedAnswer[];
}

export interface CriterionEvaluation {
  id: string;
  criterion_id: string;
  criterion_name?: string;
  maximum_marks: number;
  awarded_marks: number;
  explanation: string;
  evidence?: string;
  missing_concepts: string[];
  incorrect_concepts: string[];
  confidence?: number;
}

export interface TeacherReview {
  id: string;
  evaluation_id: string;
  teacher_id: string;
  teacher_name?: string;
  original_ai_marks: number;
  final_marks: number;
  override_reason?: string;
  teacher_comments?: string;
  status: string;
  reviewed_at: string;
}

export interface EvaluationDetail {
  id: string;
  submission_id: string;
  question_id: string;
  question_number: string;
  question_text: string;
  max_marks: number;
  student_roll_no: string;
  student_name?: string;
  student_answer: string;
  original_ocr_text?: string;
  corrected_text?: string;
  original_ai_marks: number;
  maximum_marks: number;
  effective_marks: number;
  ai_feedback?: string;
  confidence?: number;
  requires_human_review: boolean;
  review_reason?: string;
  provider: string;
  status: string;
  evaluated_at: string;
  execution_time_ms: number;
  criteria_evaluations: CriterionEvaluation[];
  latest_review?: TeacherReview;
}

export interface ScriptEvaluationSummary {
  script_id: string;
  student_roll_no: string;
  student_name?: string;
  exam_id: string;
  exam_title: string;
  total_score: number;
  max_total_marks: number;
  percentage: number;
  is_approved: boolean;
  status: string;
  pages?: ScriptPage[];
  evaluations: EvaluationDetail[];
}

export interface TeacherDashboardStats {
  total_exams: number;
  total_scripts: number;
  scripts_awaiting_ocr: number;
  scripts_awaiting_eval: number;
  evaluations_requiring_review: number;
  approved_scripts: number;
  published_results: number;
}

export interface QuestionPerformance {
  question_id: string;
  question_number: string;
  topic: string;
  max_marks: number;
  average_marks: number;
  average_percentage: number;
  difficulty: string;
  most_missed_concepts: string[];
}

export interface ExamAnalytics {
  exam_id: string;
  exam_title: string;
  total_students: number;
  evaluated_students: number;
  approved_students: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  median_score: number;
  pass_percentage: number;
  score_distribution: { range_label: string; count: number }[];
  question_performance: QuestionPerformance[];
  topic_performance: { topic: string; average_percentage: number; question_count: number }[];
  top_missed_concepts: string[];
  is_published: boolean;
}

export interface StudentExamResult {
  exam_id: string;
  exam_title: string;
  subject: string;
  exam_date?: string;
  total_marks: number;
  student_score: number;
  percentage: number;
  passed: boolean;
  rank?: number;
  total_students: number;
  published_at?: string;
  question_results: {
    question_id: string;
    question_number: string;
    question_text: string;
    max_marks: number;
    topic: string;
    awarded_marks: number;
    ai_feedback: string;
    teacher_comment?: string;
    missing_concepts: string[];
    student_answer_snippet: string;
  }[];
  teacher_overall_comment?: string;
  strengths: string[];
  weaknesses: string[];
  recommended_topics: string[];
}

export interface SystemStatus {
  app_name: string;
  tagline: string;
  demo_mode: boolean;
  ocr: {
    active_provider: string;
    configured_provider: string;
    is_configured: boolean;
    status_label: string;
  };
  ai: {
    active_provider: string;
    configured_provider: string;
    model: string;
    is_configured: boolean;
    status_label: string;
    base_url: string;
  };
  demo_accounts: {
    role: string;
    email: string;
    password: string;
    name: string;
  }[];
}
