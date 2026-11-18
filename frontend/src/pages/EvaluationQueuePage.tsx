import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  ArrowRight, 
  RefreshCw,
  Sparkles,
  CheckSquare,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Exam, AnswerScript } from '../types';

interface EvaluationQueuePageProps {
  initialExamId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const EvaluationQueuePage: React.FC<EvaluationQueuePageProps> = ({ initialExamId, onNavigateTab }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [scripts, setScripts] = useState<AnswerScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalProgressMessage, setEvalProgressMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await api.getExams();
        setExams(data);
        if (!selectedExamId && data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadScripts(selectedExamId);
    }
  }, [selectedExamId]);

  const loadScripts = async (examId: string) => {
    try {
      const data = await api.getScripts(examId);
      setScripts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluateSingle = async (scriptId: string) => {
    setIsEvaluating(true);
    setEvalProgressMessage(`AI Evaluating script ${scriptId}...`);
    try {
      await api.evaluateScript(scriptId);
      setEvalProgressMessage("Evaluation complete!");
      loadScripts(selectedExamId);
      setTimeout(() => setEvalProgressMessage(null), 3000);
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleBatchEvaluate = async () => {
    if (!selectedExamId) return;
    setIsEvaluating(true);
    setEvalProgressMessage("Batch AI evaluation in progress across all verified answer scripts...");
    try {
      const res = await api.batchEvaluateExam(selectedExamId);
      setEvalProgressMessage(res.message);
      loadScripts(selectedExamId);
    } catch (err: any) {
      alert(`Batch evaluation failed: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const readyCount = scripts.filter(s => ['ready_for_evaluation', 'ocr_completed'].includes(s.processing_status)).length;
  const reviewCount = scripts.filter(s => s.processing_status === 'review_required').length;
  const approvedCount = scripts.filter(s => s.is_approved).length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Evaluation Queue</h2>
          <p className="text-xs text-slate-500">
            Submit verified handwritten answers to the semantic AI engine for rubric grading
          </p>
        </div>

        {/* Exam Picker */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">Select Exam:</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-brand-500"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Banner */}
      <div className="p-6 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold">Semantic Rubric Evaluator Ready</h3>
          </div>
          <p className="text-xs text-indigo-200 max-w-xl">
            {readyCount} answer script(s) are ready for evaluation. AI evaluates meaning against rubrics, extracts evidence, and calculates partial marks.
          </p>
        </div>

        <button
          onClick={handleBatchEvaluate}
          disabled={readyCount === 0 || isEvaluating}
          className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isEvaluating ? 'Evaluating...' : `Evaluate All Ready Scripts (${readyCount})`}</span>
        </button>
      </div>

      {evalProgressMessage && (
        <div className="p-4 bg-violet-50 border border-violet-200 text-violet-900 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
          <span>{evalProgressMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-semibold block mb-1">Total Scripts</span>
          <span className="text-2xl font-extrabold text-slate-900">{scripts.length}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-amber-600 font-semibold block mb-1">Ready for AI Eval</span>
          <span className="text-2xl font-extrabold text-amber-700">{readyCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-rose-600 font-semibold block mb-1">Teacher Review Required</span>
          <span className="text-2xl font-extrabold text-rose-700">{reviewCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-emerald-600 font-semibold block mb-1">Teacher Approved</span>
          <span className="text-2xl font-extrabold text-emerald-700">{approvedCount}</span>
        </div>
      </div>

      {/* Scripts Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Evaluation Queue & Progress</h3>
          <button
            onClick={() => onNavigateTab('review-workspace')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>Open Review Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Student / Roll</th>
                <th className="px-6 py-3.5">Processing State</th>
                <th className="px-6 py-3.5">Evaluated Score</th>
                <th className="px-6 py-3.5">Approval</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scripts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No scripts in queue. Upload scripts to begin.
                  </td>
                </tr>
              ) : (
                scripts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.student_name || 'Student'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{s.student_roll_no}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.processing_status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                        s.processing_status === 'review_required' ? 'bg-rose-100 text-rose-800' :
                        s.processing_status === 'ready_for_evaluation' ? 'bg-violet-100 text-violet-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {s.processing_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {s.total_score !== null && s.total_score !== undefined ? `${s.total_score} Marks` : 'Pending'}
                    </td>
                    <td className="px-6 py-4">
                      {s.is_approved ? (
                        <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Pending Review</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {['ready_for_evaluation', 'ocr_completed'].includes(s.processing_status) ? (
                          <button
                            onClick={() => handleEvaluateSingle(s.id)}
                            className="px-3 py-1 bg-violet-50 hover:bg-violet-100 text-violet-800 rounded-lg font-semibold text-[11px] flex items-center space-x-1"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Run AI</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigateTab('review-workspace', { scriptId: s.id })}
                            className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-semibold text-[11px] flex items-center space-x-1"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Review Marks</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
