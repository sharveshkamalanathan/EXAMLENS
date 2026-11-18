import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Sliders, 
  Eye, 
  History, 
  ChevronRight, 
  HelpCircle,
  FileText,
  User,
  Sparkles,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { AnswerScript, Exam, ScriptEvaluationSummary, EvaluationDetail } from '../types';

interface ReviewWorkspacePageProps {
  initialScriptId?: string;
  initialExamId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const ReviewWorkspacePage: React.FC<ReviewWorkspacePageProps> = ({ 
  initialScriptId, 
  initialExamId,
  onNavigateTab 
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [scripts, setScripts] = useState<AnswerScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>(initialScriptId || '');
  const [scriptEval, setScriptEval] = useState<ScriptEvaluationSummary | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Left Viewer Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);

  // Teacher Override Form State
  const [overrideMarks, setOverrideMarks] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('Teacher verified alternative valid explanation.');
  const [teacherComments, setTeacherComments] = useState<string>('');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
      loadExamScripts(selectedExamId);
    }
  }, [selectedExamId]);

  const loadExamScripts = async (examId: string) => {
    try {
      const sList = await api.getScripts(examId);
      setScripts(sList);
      if (!selectedScriptId && sList.length > 0) {
        setSelectedScriptId(sList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedScriptId) {
      loadEvaluation(selectedScriptId);
    }
  }, [selectedScriptId]);

  const loadEvaluation = async (scriptId: string) => {
    setLoading(true);
    try {
      const data = await api.getScriptEvaluation(scriptId);
      setScriptEval(data);
      if (data.evaluations.length > 0) {
        const currentEval = data.evaluations[activeQuestionIdx] || data.evaluations[0];
        setOverrideMarks(currentEval.effective_marks);
        setTeacherComments(currentEval.latest_review?.teacher_comments || '');
      }
    } catch (err) {
      console.error("Evaluation load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Switch question
  const currentEval: EvaluationDetail | undefined = scriptEval?.evaluations[activeQuestionIdx];

  useEffect(() => {
    if (currentEval) {
      setOverrideMarks(currentEval.effective_marks);
      setTeacherComments(currentEval.latest_review?.teacher_comments || '');
    }
  }, [activeQuestionIdx, currentEval]);

  const handleSaveOverride = async () => {
    if (!currentEval) return;
    try {
      await api.overrideEvaluation(currentEval.id, {
        final_marks: overrideMarks,
        override_reason: overrideReason,
        teacher_comments: teacherComments,
        status: overrideMarks !== currentEval.original_ai_marks ? 'overridden' : 'approved'
      });
      setActionMessage("Marks updated successfully! Original AI score preserved in audit trail.");
      setTimeout(() => setActionMessage(null), 3000);
      loadEvaluation(selectedScriptId);
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    }
  };

  const handleApproveCurrent = async () => {
    if (!currentEval) return;
    try {
      await api.approveEvaluation(currentEval.id);
      setActionMessage("AI Evaluation approved.");
      setTimeout(() => setActionMessage(null), 3000);
      loadEvaluation(selectedScriptId);
    } catch (err: any) {
      alert(`Approve failed: ${err.message}`);
    }
  };

  const handleApproveEntireScript = async () => {
    try {
      await api.approveEntireScript(selectedScriptId);
      setActionMessage("Entire script approved by teacher!");
      setTimeout(() => setActionMessage(null), 3000);
      loadEvaluation(selectedScriptId);
    } catch (err: any) {
      alert(`Script approval failed: ${err.message}`);
    }
  };

  const handleViewAudit = async () => {
    if (!currentEval) return;
    try {
      const logs = await api.getAuditLog(currentEval.id);
      setAuditLogs(logs);
      setShowAuditModal(true);
    } catch (err: any) {
      alert(`Failed to fetch audit: ${err.message}`);
    }
  };

  // Navigation between students
  const currentScriptIdx = scripts.findIndex(s => s.id === selectedScriptId);
  const handlePrevStudent = () => {
    if (currentScriptIdx > 0) {
      setSelectedScriptId(scripts[currentScriptIdx - 1].id);
      setActiveQuestionIdx(0);
    }
  };
  const handleNextStudent = () => {
    if (currentScriptIdx < scripts.length - 1) {
      setSelectedScriptId(scripts[currentScriptIdx + 1].id);
      setActiveQuestionIdx(0);
    }
  };

  // Image path for script
  const pageImage = `/storage/processed/scan_${scriptEval?.student_roll_no || 'STU-1024'}.jpg`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-50 text-brand-700 rounded-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {scriptEval?.student_name || 'Student'} ({scriptEval?.student_roll_no})
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                scriptEval?.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {scriptEval?.is_approved ? 'Approved' : 'Review Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Exam: {scriptEval?.exam_title || 'Operating Systems'} • Total Score: <span className="font-bold text-brand-600">{scriptEval?.total_score}</span> / {scriptEval?.max_total_marks} Marks ({scriptEval?.percentage}%)
            </p>
          </div>
        </div>

        {/* Student Switcher & Approval Actions */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevStudent}
              disabled={currentScriptIdx <= 0}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Previous Student
            </button>
            <span className="text-slate-500 font-mono text-[11px] px-1">
              {currentScriptIdx + 1} of {scripts.length}
            </span>
            <button
              onClick={handleNextStudent}
              disabled={currentScriptIdx >= scripts.length - 1}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Next Student
            </button>
          </div>

          <button
            onClick={handleApproveEntireScript}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Script</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-brand-600 text-white text-xs px-6 py-1.5 text-center font-medium animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* LEFT PANEL: Original Handwritten Page Viewer */}
        <div className="bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden relative select-none">
          {/* Zoom & Page Floating Controls */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-1.5 rounded-xl flex items-center space-x-3 text-xs shadow-lg">
            <span className="font-semibold text-slate-300">Page {activePage}</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
              className="p-1 hover:text-brand-400 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px]">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(250, prev + 15))}
              className="p-1 hover:text-brand-400 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-700"></div>
            <button 
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1 hover:text-brand-400 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Image Display */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950">
            <div 
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out'
              }}
              className="relative shadow-2xl rounded-sm overflow-hidden"
            >
              <img
                src={pageImage}
                alt="Student Answer Sheet"
                className="max-h-[85vh] object-contain rounded select-none pointer-events-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 text-xs text-slate-400 flex items-center justify-between">
            <span>Original Physical Answer Script Digitize View</span>
            <span className="text-brand-400 font-medium">NIT Examination Cell Archive</span>
          </div>
        </div>

        {/* RIGHT PANEL: Evaluation Review & Teacher Override */}
        <div className="bg-white flex flex-col h-full overflow-hidden">
          {/* Question Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 space-x-2 overflow-x-auto text-xs">
            {scriptEval?.evaluations?.map((ev, idx) => (
              <button
                key={ev.id}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`px-4 py-2 font-bold rounded-t-lg transition-all border-b-2 flex items-center space-x-2 ${
                  activeQuestionIdx === idx
                    ? 'bg-white border-brand-600 text-brand-700 shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{ev.question_number}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">
                  {ev.effective_marks}/{ev.maximum_marks}
                </span>
                {ev.requires_human_review && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>
            ))}
          </div>

          {/* Evaluation Content Body */}
          {currentEval ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Statement */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {currentEval.question_number}. {currentEval.question_text}
                  </span>
                  <span className="font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    Max: {currentEval.maximum_marks} Marks
                  </span>
                </div>

                {/* Student Answer Snippet */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Extracted Student Handwriting Answer:</span>
                  <p className="font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                    {currentEval.student_answer}
                  </p>
                </div>
              </div>

              {/* Review Warning if Flagged */}
              {currentEval.requires_human_review && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Flagged for Mandatory Teacher Verification:</span>
                    <p className="text-[11px] text-rose-700 mt-0.5">{currentEval.review_reason || 'Borderline score evaluation.'}</p>
                  </div>
                </div>
              )}

              {/* Criteria-by-Criteria AI Evaluation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>Rubric Breakdown & Evidence Citing</span>
                  </h4>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500">AI Confidence:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {Math.round((currentEval.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {currentEval.criteria_evaluations?.map((ce, idx) => (
                    <div key={ce.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ce.criterion_name || `Criterion ${idx + 1}`}</span>
                        <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <span className="text-brand-600">{ce.awarded_marks}</span> / {ce.maximum_marks}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{ce.explanation}</p>
                      
                      {ce.evidence && (
                        <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded text-[11px] text-emerald-900 font-mono">
                          <span className="font-bold">Evidence:</span> "{ce.evidence}"
                        </div>
                      )}

                      {ce.missing_concepts?.length > 0 && (
                        <div className="flex items-center space-x-1 text-[10px] text-rose-700 pt-1">
                          <span className="font-semibold">Missing:</span>
                          <span>{ce.missing_concepts.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Overall Feedback & Suggestions */}
              {currentEval.ai_feedback && (
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-indigo-900">AI Pedagogical Feedback:</span>
                  <p className="text-indigo-800 text-[11px] leading-relaxed">{currentEval.ai_feedback}</p>
                </div>
              )}

              {/* TEACHER OVERRIDE PANEL */}
              <div className="p-5 bg-gradient-to-tr from-brand-50 to-indigo-50/50 rounded-2xl border-2 border-brand-300 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-brand-200">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-brand-700" />
                    <span className="font-bold text-brand-950 text-sm">Teacher Final Authority & Overrides</span>
                  </div>
                  <button
                    onClick={handleViewAudit}
                    className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center space-x-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Log</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Final Awarded Marks (Original AI: {currentEval.original_ai_marks})
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={currentEval.maximum_marks}
                      value={overrideMarks}
                      onChange={e => setOverrideMarks(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-brand-300 rounded-lg bg-white font-bold text-base text-slate-900 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Reason for Override / Adjustment</label>
                    <select
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-300 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Teacher verified alternative valid explanation.">Alternative valid conceptual explanation</option>
                      <option value="Student demonstrated formula derivation not strictly in rubric.">Derived formula/diagram accurately</option>
                      <option value="Handwriting nuance clarified upon visual inspection.">Handwriting nuance verified</option>
                      <option value="Partial credit awarded for effort and structure.">Discretionary partial credit</option>
                      <option value="AI marks approved as fair and accurate by teacher.">Approved without changes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Teacher Feedback to Student</label>
                  <textarea
                    rows={2}
                    value={teacherComments}
                    onChange={e => setTeacherComments(e.target.value)}
                    placeholder="Provide constructive feedback for student..."
                    className="w-full px-3 py-2 border border-brand-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-brand-500"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-500">
                    Original AI marks ({currentEval.original_ai_marks}) will be permanently preserved.
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleApproveCurrent}
                      className="px-3.5 py-2 bg-white border border-brand-300 text-brand-800 hover:bg-brand-100 rounded-lg font-semibold shadow-sm transition-all"
                    >
                      Approve AI Score
                    </button>
                    <button
                      onClick={handleSaveOverride}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-sm shadow-brand-500/30 transition-all"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              No evaluation data found for this script. Run AI evaluation first.
            </div>
          )}
        </div>
      </div>

      {/* Audit History Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <History className="w-4 h-4 text-brand-600" />
                <span>Evaluation Audit History</span>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                Close
              </button>
            </div>

            <p className="text-xs text-slate-500">
              ExamLens preserves the original AI evaluation and logs all teacher adjustments for academic integrity.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto text-xs">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No score overrides recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 capitalize">{log.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">Updated by: {log.user_name}</p>
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700">
                      New: {JSON.stringify(log.new_data)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
