import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Eye, 
  Lock, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Exam, AnswerScript } from '../types';

interface PublishResultsPageProps {
  initialExamId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const PublishResultsPage: React.FC<PublishResultsPageProps> = ({ initialExamId, onNavigateTab }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [checklist, setChecklist] = useState<any>(null);
  const [scripts, setScripts] = useState<AnswerScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const exList = await api.getExams();
        setExams(exList);
        if (exList.length > 0) {
          setSelectedExamId(initialExamId || exList[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadExamData(selectedExamId);
    }
  }, [selectedExamId]);

  const loadExamData = async (examId: string) => {
    setLoading(true);
    try {
      const [chk, scs] = await Promise.all([
        api.getPublishChecklist(examId),
        api.getScripts(examId)
      ]);
      setChecklist(chk);
      setScripts(scs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish final results? Enrolled students will immediately gain access to their scores and AI feedback.")) return;

    setPublishing(true);
    try {
      await api.publishExam(selectedExamId);
      setStatusMessage("Results published successfully! Students can now access their reports.");
      loadExamData(selectedExamId);
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm("Unpublish results? Student access will be restricted immediately.")) return;

    try {
      await api.unpublishExam(selectedExamId);
      setStatusMessage("Exam results unpublished.");
      loadExamData(selectedExamId);
    } catch (err: any) {
      alert(`Unpublish error: ${err.message}`);
    }
  };

  const handleDownloadCSV = () => {
    window.open(api.exportExamCSV(selectedExamId), '_blank');
  };

  const activeExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Result Publication Center</h2>
          <p className="text-xs text-slate-500">
            Verify readiness, enforce teacher approval policies, and release final scores to the student portal
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

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Publication Status Card */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        activeExam?.is_published 
          ? 'bg-emerald-50/70 border-emerald-200' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${activeExam?.is_published ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <h3 className="text-lg font-bold text-slate-900">
              {activeExam?.is_published ? 'Results are Currently Published' : 'Results Not Yet Published'}
            </h3>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            {activeExam?.is_published 
              ? 'Students can view their question-wise marks, AI feedback, and learning recommendations on their portal.'
              : 'All evaluated marks remain private until you authorize publication.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {activeExam?.is_published ? (
            <button
              onClick={handleUnpublish}
              className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              Unpublish Results
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || (checklist && checklist.total_students === 0)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{publishing ? 'Publishing...' : 'Publish to Students'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pre-Publication Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Pre-Publication Readiness Checklist</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold block mb-1">Enrolled Scripts</span>
            <span className="text-2xl font-extrabold text-slate-900">{checklist?.total_students || 0}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-brand-600 font-semibold block mb-1">Evaluated</span>
            <span className="text-2xl font-extrabold text-brand-700">{checklist?.evaluated_count || 0}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-emerald-600 font-semibold block mb-1">Teacher Approved</span>
            <span className="text-2xl font-extrabold text-emerald-700">{checklist?.approved_count || 0}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-amber-600 font-semibold block mb-1">Pending Approval</span>
            <span className="text-2xl font-extrabold text-amber-700">{checklist?.pending_review_count || 0}</span>
          </div>
        </div>

        {checklist?.warnings && checklist.warnings.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-800">
            <div className="font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Review Notice</span>
            </div>
            {checklist.warnings.map((w: string, idx: number) => (
              <p key={idx} className="text-[11px] text-amber-700 pl-5">• {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* Student Results Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Student Results Roster ({scripts.length})</h3>
          <span className="text-xs text-slate-500">Max Total Marks: {activeExam?.total_marks}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Score Awarded</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scripts.map((s) => {
                const tot = s.total_score !== null && s.total_score !== undefined ? s.total_score : 0;
                const max = activeExam?.total_marks || 50;
                const pct = max > 0 ? Math.round((tot / max) * 100) : 0;
                const passed = tot >= (activeExam?.passing_marks || 0);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{s.student_roll_no}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{s.student_name || 'Student'}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">{tot} / {max}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {passed ? 'Passed' : 'Needs Improvement'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onNavigateTab('review-workspace', { scriptId: s.id, examId: selectedExamId })}
                        className="px-3 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Inspect Marks
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
