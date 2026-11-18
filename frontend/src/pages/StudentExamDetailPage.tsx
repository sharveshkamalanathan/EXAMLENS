import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Award, CheckCircle2, XCircle, AlertTriangle, 
  Sparkles, UserCheck, BookOpen, Layers, Printer, FileText,
  HelpCircle, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { StudentExamResult } from '../types';

interface StudentExamDetailPageProps {
  examId: string;
  onBack: () => void;
}

export const StudentExamDetailPage: React.FC<StudentExamDetailPageProps> = ({ 
  examId, 
  onBack 
}) => {
  const [detail, setDetail] = useState<StudentExamResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [examId]);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStudentExamDetail(examId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load examination detail');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <h3 className="font-semibold text-slate-800">Loading Examination Scorecard...</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving question-by-question semantic feedback and rubric evaluations.</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Examinations
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          <p className="font-semibold">{error || 'Examination record could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg shadow-sm transition"
        >
          <Printer className="w-3.5 h-3.5" /> Print Scorecard
        </button>
      </div>

      {/* Exam Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {detail.subject}
              </span>
              {detail.passed ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Result: Passed
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Result: Remedial Recommended
                </span>
              )}
              {detail.rank && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Class Rank #{detail.rank} of {detail.total_students}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{detail.exam_title}</h1>
            <p className="text-xs text-slate-500">
              Official Handwritten Physical Examination Assessment • Final Faculty Approved Marks
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-medium">Marks Secured</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-extrabold text-indigo-600">{detail.student_score}</span>
                <span className="text-sm font-semibold text-slate-400">/ {detail.total_marks}</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <span className="text-xs text-slate-500 block uppercase font-medium">Percentage</span>
              <span className="text-2xl font-bold text-slate-800 mt-0.5 block">
                {detail.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Strengths & Revision Highlights */}
        {(detail.strengths?.length > 0 || detail.weaknesses?.length > 0) && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail.strengths?.length > 0 && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths
                </h4>
                <ul className="space-y-1 text-xs text-emerald-800">
                  {detail.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.weaknesses?.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Suggested Focus Areas
                </h4>
                <ul className="space-y-1 text-xs text-amber-800">
                  {detail.weaknesses.map((weak, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question-By-Question Detailed Evaluation */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Question-by-Question Diagnostic
        </h2>

        {detail.question_results.map((qr) => {
          const ratio = qr.max_marks > 0 ? qr.awarded_marks / qr.max_marks : 0;
          return (
            <div 
              key={qr.question_id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Question Header Bar */}
              <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {qr.question_number}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Topic: {qr.topic}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    ratio >= 0.8 ? 'bg-emerald-100 text-emerald-800' :
                    ratio >= 0.5 ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {qr.awarded_marks} / {qr.max_marks} Marks
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-5 space-y-4">
                {/* Prompt */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Question Prompt
                  </h4>
                  <p className="text-sm font-medium text-slate-800">{qr.question_text}</p>
                </div>

                {/* Extracted Handwritten Answer Snippet */}
                {qr.student_answer_snippet && (
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Your Handwritten Answer (OCR Digitized)
                    </span>
                    <p className="text-xs text-slate-700 italic font-mono leading-relaxed">
                      "{qr.student_answer_snippet}"
                    </p>
                  </div>
                )}

                {/* AI Rubric Evaluation Feedback */}
                {qr.ai_feedback && (
                  <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>AI Semantic Evaluation & Concept Mapping</span>
                    </div>
                    <p className="text-xs text-indigo-950 leading-relaxed">
                      {qr.ai_feedback}
                    </p>

                    {qr.missing_concepts && qr.missing_concepts.length > 0 && (
                      <div className="pt-2 border-t border-indigo-200/60 mt-2">
                        <span className="text-[11px] font-semibold text-indigo-900 block mb-1">
                          Missing or Incomplete Rubric Concepts:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {qr.missing_concepts.map((mc, mIdx) => (
                            <span 
                              key={mIdx} 
                              className="text-[11px] bg-white/80 text-amber-800 border border-amber-300 px-2 py-0.5 rounded"
                            >
                              {mc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Faculty Remarks (if any) */}
                {qr.teacher_comment && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-900 block mb-0.5">Faculty Evaluation Note</span>
                      <p className="text-emerald-800">{qr.teacher_comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
