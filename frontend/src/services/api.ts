const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('examlens_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new ApiError(response.status, errorDetail);
  }

  // For CSV or empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Exams
  getExams: (params?: { subject?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/exams${q ? `?${q}` : ''}`);
  },
  getExam: (id: string) => request<any>(`/exams/${id}`),
  createExam: (data: any) => request<any>('/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam: (id: string, data: any) => request<any>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExam: (id: string) => request<any>(`/exams/${id}`, { method: 'DELETE' }),
  getPublishChecklist: (id: string) => request<any>(`/exams/${id}/publish-checklist`),
  publishExam: (id: string) => request<any>(`/exams/${id}/publish`, { method: 'POST' }),
  unpublishExam: (id: string) => request<any>(`/exams/${id}/unpublish`, { method: 'POST' }),

  // Questions
  getQuestions: (examId: string) => request<any[]>(`/exams/${examId}/questions`),
  createQuestion: (examId: string, data: any) => request<any>(`/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (qId: string, data: any) => request<any>(`/questions/${qId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (qId: string) => request<any>(`/questions/${qId}`, { method: 'DELETE' }),
  addRubric: (qId: string, data: any) => request<any>(`/questions/${qId}/rubric`, { method: 'POST', body: JSON.stringify(data) }),
  deleteRubric: (critId: string) => request<any>(`/rubrics/${critId}`, { method: 'DELETE' }),

  // Scripts
  uploadScript: (examId: string, formData: FormData) => request<any>(`/exams/${examId}/scripts/upload`, { method: 'POST', body: formData }),
  uploadBatch: (examId: string, formData: FormData) => request<any>(`/exams/${examId}/scripts/batch-upload`, { method: 'POST', body: formData }),
  getScripts: (examId: string, status?: string) => request<any[]>(`/exams/${examId}/scripts${status ? `?status=${status}` : ''}`),
  getScript: (scriptId: string) => request<any>(`/scripts/${scriptId}`),
  deleteScript: (scriptId: string) => request<any>(`/scripts/${scriptId}`, { method: 'DELETE' }),

  // OCR
  processOCR: (scriptId: string) => request<any>(`/scripts/${scriptId}/process-ocr`, { method: 'POST' }),
  getOCR: (scriptId: string) => request<any[]>(`/scripts/${scriptId}/ocr`),
  updateAnswer: (ansId: string, data: any) => request<any>(`/answers/${ansId}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyOCR: (scriptId: string) => request<any>(`/scripts/${scriptId}/ocr/verify`, { method: 'POST' }),

  // AI Evaluation
  evaluateSubmission: (subId: string) => request<any>(`/submissions/${subId}/evaluate`, { method: 'POST' }),
  evaluateScript: (scriptId: string) => request<any>(`/scripts/${scriptId}/evaluate`, { method: 'POST' }),
  batchEvaluateExam: (examId: string) => request<any>(`/exams/${examId}/batch-evaluate`, { method: 'POST' }),
  getScriptEvaluation: (scriptId: string) => request<any>(`/scripts/${scriptId}/evaluation`),

  // Teacher Review
  overrideEvaluation: (evalId: string, data: any) => request<any>(`/evaluations/${evalId}/override`, { method: 'POST', body: JSON.stringify(data) }),
  approveEvaluation: (evalId: string) => request<any>(`/evaluations/${evalId}/approve`, { method: 'POST' }),
  approveEntireScript: (scriptId: string) => request<any>(`/scripts/${scriptId}/approve-all`, { method: 'POST' }),
  getAuditLog: (evalId: string) => request<any[]>(`/evaluations/${evalId}/audit`),

  // Student Results
  getStudentResults: () => request<any[]>('/student/results'),
  getStudentExamDetail: (examId: string) => request<any>(`/student/results/${examId}`),

  // Analytics
  getTeacherStats: () => request<any>('/analytics/teacher'),
  getExamAnalytics: (examId: string) => request<any>(`/analytics/exam/${examId}`),
  getStudentAnalytics: () => request<any>('/analytics/student'),
  exportExamCSV: (examId: string) => `${API_BASE}/analytics/exam/${examId}/export-csv`,

  // System
  getSystemStatus: () => request<any>('/system/status'),
};
