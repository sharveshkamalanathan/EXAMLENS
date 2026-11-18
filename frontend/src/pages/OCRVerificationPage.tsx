import React, { useState, useEffect } from 'react';
import { 
  ScanText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Sliders,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { AnswerScript, ExtractedAnswer, Exam } from '../types';

interface OCRVerificationPageProps {
  initialScriptId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const OCRVerificationPage: React.FC<OCRVerificationPageProps> = ({ initialScriptId, onNavigateTab }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [scripts, setScripts] = useState<AnswerScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>(initialScriptId || '');
  const [scriptDetail, setScriptDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Viewer Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  // Edit State
  const [editedAnswers, setEditedAnswers] = useState<{ [ansId: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const exList = await api.getExams();
        setExams(exList);
        if (exList.length > 0) {
          setSelectedExamId(exList[0].id);
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
      const data = await api.getScripts(examId);
      setScripts(data);
      if (!selectedScriptId && data.length > 0) {
        setSelectedScriptId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedScriptId) {
      loadScriptDetail(selectedScriptId);
    }
  }, [selectedScriptId]);

  const loadScriptDetail = async (id: string) => {
    setLoading(true);
    try {
      const detail = await api.getScript(id);
      setScriptDetail(detail);
      // Populate edited text buffer
      const initialMap: { [id: string]: string } = {};
      detail.extracted_answers?.forEach((ea: ExtractedAnswer) => {
        initialMap[ea.id] = ea.final_text;
      });
      setEditedAnswers(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (ansId: string, val: string) => {
    setEditedAnswers(prev => ({ ...prev, [ansId]: val }));
  };

  const handleSaveCorrections = async () => {
    setSaveStatus("Saving corrections...");
    try {
      for (const [ansId, text] of Object.entries(editedAnswers)) {
        await api.updateAnswer(ansId, { corrected_text: text, verification_status: 'corrected' });
      }
      setSaveStatus("Corrections saved successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      loadScriptDetail(selectedScriptId);
    } catch (err: any) {
      setSaveStatus(`Failed to save: ${err.message}`);
    }
  };

  const handleVerifyAndProceed = async () => {
    try {
      await handleSaveCorrections();
      await api.verifyOCR(selectedScriptId);
      onNavigateTab('evaluation-queue', { scriptId: selectedScriptId });
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const pageImage = scriptDetail?.pages?.[activePage - 1]?.processed_image_path || 
                    scriptDetail?.pages?.[activePage - 1]?.original_image_path ||
                    '/storage/processed/scan_STU-1024.jpg';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Top Context & Script Switcher Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <ScanText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">OCR Handwriting Verification</h2>
            <p className="text-[11px] text-slate-500">
              Compare extracted handwriting side-by-side with original script scan before AI evaluation
            </p>
          </div>
        </div>

        {/* Script Selector & Navigation */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Student Script:</span>
            <select
              value={selectedScriptId}
              onChange={e => setSelectedScriptId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-brand-500"
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.student_roll_no} — {s.student_name || 'Student'} ({s.processing_status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
            <button
              onClick={handleSaveCorrections}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-sm flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Corrections</span>
            </button>
            <button
              onClick={handleVerifyAndProceed}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-sm shadow-brand-500/20 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm OCR & Send to AI</span>
            </button>
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className="bg-brand-600 text-white text-xs px-6 py-1.5 text-center font-medium animate-in fade-in">
          {saveStatus}
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* LEFT PANEL: Original Handwritten Scan Viewer */}
        <div className="bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden relative select-none">
          {/* Viewer Floating Controls */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-1.5 rounded-xl flex items-center space-x-3 text-xs shadow-lg">
            <span className="font-semibold text-slate-300">Page {activePage} of {scriptDetail?.pages?.length || 1}</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
              className="p-1 hover:text-brand-400 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px]">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(250, prev + 15))}
              className="p-1 hover:text-brand-400 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-700"></div>
            <button 
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1 hover:text-brand-400 transition-colors"
              title="Rotate page 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => { setZoomLevel(100); setRotation(0); }}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>

          {/* Image Canvas Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950">
            <div 
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out'
              }}
              className="relative shadow-2xl rounded-sm overflow-hidden max-w-full"
            >
              <img
                src={pageImage}
                alt="Original Handwritten Answer Sheet"
                className="max-h-[85vh] object-contain rounded select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Bottom Page Navigation */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Physical Scanned Page (Pencil / Ink Preserved)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={activePage <= 1}
                onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-40"
              >
                Previous Page
              </button>
              <button
                disabled={activePage >= (scriptDetail?.pages?.length || 1)}
                onClick={() => setActivePage(prev => prev + 1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Extracted Answers Grouped by Question */}
        <div className="bg-white flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900">Recognized Questions & Text</span>
              <p className="text-[11px] text-slate-500">Edit any unclear words. Teacher corrections are preserved separately.</p>
            </div>
            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-md font-semibold text-[11px]">
              {scriptDetail?.extracted_answers?.length || 0} Segmented Answers
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!scriptDetail?.extracted_answers || scriptDetail.extracted_answers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No OCR answers extracted yet. Click "Run OCR" from the Upload Center.
              </div>
            ) : (
              scriptDetail.extracted_answers.map((ans: ExtractedAnswer, idx: number) => {
                const conf = ans.segmentation_confidence || 0.92;
                const isUncertain = conf < 0.80;

                return (
                  <div 
                    key={ans.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isUncertain 
                        ? 'border-amber-300 bg-amber-50/20 shadow-sm' 
                        : 'border-slate-200 bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-brand-100 text-brand-800 font-bold rounded text-xs">
                          {ans.question_number || `Q${idx + 1}`}
                        </span>
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {ans.question_text || 'Exam Question'}
                        </span>
                      </div>

                      {/* Confidence Badge */}
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          conf >= 0.90 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : conf >= 0.75 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          <span>OCR Conf: {Math.round(conf * 100)}%</span>
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {ans.verification_status}
                        </span>
                      </div>
                    </div>

                    {/* Editable Answer Text Area */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Extracted Student Handwriting Text (Editable):
                      </label>
                      <textarea
                        rows={5}
                        value={editedAnswers[ans.id] !== undefined ? editedAnswers[ans.id] : ans.final_text}
                        onChange={e => handleTextChange(ans.id, e.target.value)}
                        className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50 leading-relaxed text-slate-800"
                        placeholder="Recognized handwritten text..."
                      ></textarea>
                    </div>

                    {/* Quick Toggles */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono text-[10px] text-slate-400">
                        Original OCR preserved in database
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleTextChange(ans.id, "[Blank — No answer attempted]")}
                          className="px-2 py-1 text-[10px] border border-slate-200 rounded hover:bg-slate-100 text-slate-600"
                        >
                          Mark Blank
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTextChange(ans.id, "[Unreadable handwriting]")}
                          className="px-2 py-1 text-[10px] border border-slate-200 rounded hover:bg-slate-100 text-slate-600"
                        >
                          Mark Unreadable
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
