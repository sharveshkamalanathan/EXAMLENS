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
  exportExamCSV: (examId: string) => {
    const token = localStorage.getItem('examlens_token');
    return `${API_BASE}/analytics/exam/${examId}/export-csv${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  downloadExamCSV: async (examId: string, customFilename?: string) => {
    const token = localStorage.getItem('examlens_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const res = await fetch(`${API_BASE}/analytics/exam/${examId}/export-csv${tokenParam}`, {
      headers
    });
    if (!res.ok) {
      let errDetail = res.statusText;
      try {
        const j = await res.json();
        errDetail = j.detail || j.message || errDetail;
      } catch {
        // fallback
      }
      throw new Error(`Export failed: ${errDetail}`);
    }
    
    // Extract filename from Content-Disposition header if available
    let filename = customFilename;
    const disposition = res.headers.get('content-disposition');
    if (!filename && disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    if (!filename) {
      filename = `Exam_${examId.slice(0, 8)}_Results.csv`;
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
    }, 150);
  },

  // System
  getSystemStatus: () => request<any>('/system/status'),

  // Contact Inquiries & Inbound Messages
  submitContactMessage: (data: { name: string; email: string; subject: string; message: string }) =>
    request<any>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Password Recovery
  resetPassword: (data: { email: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Administrator Dashboard & Analytics
  getAdminAnalytics: () => request<any>('/admin/analytics'),
  getAdminUsers: (role?: string) => request<any[]>(role ? `/admin/users?role=${role}` : '/admin/users'),
  getAdminMessages: (status?: string) => request<any[]>(status ? `/admin/messages?status=${status}` : '/admin/messages'),
  updateAdminMessageStatus: (messageId: string, status: string) =>
    request<any>(`/admin/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteAdminMessage: (messageId: string) =>
    request<any>(`/admin/messages/${messageId}`, {
      method: 'DELETE',
    }),

  // 30-Day Free Trial Email OTP & Workspace Provisioning
  requestTrialOTP: (data: { email: string; full_name?: string; institution?: string; password?: string; mobile_number?: string }) =>
    request<{
      success: boolean;
      message: string;
      demo_otp: string;
      email_sent: boolean;
      sender_email: string;
      expires_in_seconds: number;
    }>('/trial/request-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyTrialOTP: (data: { email: string; otp_code: string; password?: string }) =>
    request<{
      success: boolean;
      message: string;
      trial_status: string;
      trial_days_remaining: number;
      trial_end_date: string;
      institution: string;
      full_name: string;
      email: string;
      access_token?: string;
      token_type?: string;
    }>('/trial/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
