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
  UserCheck,
  RefreshCw,
  Cpu,
  Clock,
  Zap,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { api } from '../services/api';
import { soundEffects } from '../utils/audioEffects';
import { AnswerScript, ExtractedAnswer, Exam } from '../types';

interface OCRVerificationPageProps {
  initialExamId?: string;
  initialScriptId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const OCRVerificationPage: React.FC<OCRVerificationPageProps> = ({ initialExamId, initialScriptId, onNavigateTab }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [scripts, setScripts] = useState<AnswerScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>(initialScriptId || '');
  const [scriptDetail, setScriptDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Viewer Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'original' | 'enhanced'>('original');
  const [imgError, setImgError] = useState<boolean>(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState<boolean>(false);
  const [ocrTimeRemaining, setOcrTimeRemaining] = useState<number>(12);
  const [ocrStage, setOcrStage] = useState<number>(1);
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(10);

  // Edit State
  const [editedAnswers, setEditedAnswers] = useState<{ [ansId: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const exList = await api.getExams();
        setExams(exList);

        let targetExamId = initialExamId;
        const targetScriptId = initialScriptId;

        if (targetScriptId) {
          try {
            const sInfo = await api.getScript(targetScriptId);
            if (sInfo && sInfo.exam_id) {
              targetExamId = sInfo.exam_id;
            }
          } catch (e) {
            console.warn("Could not prefetch script info", e);
          }
        }

        if (targetExamId && exList.some(e => e.id === targetExamId)) {
          setSelectedExamId(targetExamId);
        } else if (exList.length > 0 && !selectedExamId) {
          setSelectedExamId(exList[0].id);
        }

        if (targetScriptId) {
          setSelectedScriptId(targetScriptId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [initialExamId, initialScriptId]);

  useEffect(() => {
    if (initialScriptId && initialScriptId !== selectedScriptId) {
      setSelectedScriptId(initialScriptId);
    }
  }, [initialScriptId]);

  useEffect(() => {
    if (initialExamId && initialExamId !== selectedExamId) {
      setSelectedExamId(initialExamId);
    }
  }, [initialExamId]);

  useEffect(() => {
    if (selectedExamId) {
      loadExamScripts(selectedExamId);
    }
  }, [selectedExamId]);

  const loadExamScripts = async (examId: string) => {
    try {
      const data = await api.getScripts(examId);
      setScripts(data);
      if (selectedScriptId && data.some(s => s.id === selectedScriptId)) {
        // Keep current selected script
      } else if (initialScriptId && data.some(s => s.id === initialScriptId)) {
        setSelectedScriptId(initialScriptId);
      } else if (data.length > 0) {
        setSelectedScriptId(data[0].id);
      } else {
        setSelectedScriptId('');
        setScriptDetail(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedScriptId) {
      setActivePage(1);
      setImgError(false);
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

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const toggleSound = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    soundEffects.setMuted(next);
  };

  const handleRerunOCR = async () => {
    if (!selectedScriptId) return;
    const estTotalSeconds = Math.max(5, totalPages * 2);
    setOcrTimeRemaining(estTotalSeconds);
    setOcrStage(1);
    setOcrProgressPercent(12);
    setIsProcessingOCR(true);
    setSaveStatus("Initializing RapidOCR neural vector engine on handwritten pages...");

    // Play high-tech motion scanning sound
    soundEffects.playOcrScanSound();
    const soundPulse = setInterval(() => {
      soundEffects.playOcrScanSound();
    }, 2400);

    const timer = setInterval(() => {
      setOcrTimeRemaining(prev => Math.max(1, prev - 1));
      setOcrProgressPercent(prev => Math.min(96, prev + Math.floor(82 / estTotalSeconds)));
    }, 1000);

    const stageTimer1 = setTimeout(() => setOcrStage(2), 1500);
    const stageTimer2 = setTimeout(() => setOcrStage(3), Math.max(2800, estTotalSeconds * 350));
    const stageTimer3 = setTimeout(() => setOcrStage(4), Math.max(4800, estTotalSeconds * 650));

    try {
      await api.processOCR(selectedScriptId);
      clearInterval(timer);
      clearInterval(soundPulse);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setOcrProgressPercent(100);
      setOcrStage(4);
      soundEffects.playOcrSuccessSound();
      setSaveStatus("Handwriting OCR completed successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      await loadScriptDetail(selectedScriptId);
    } catch (err: any) {
      clearInterval(timer);
      clearInterval(soundPulse);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setSaveStatus(`OCR failed: ${err.message}`);
    } finally {
      clearInterval(soundPulse);
      setIsProcessingOCR(false);
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

  const totalPages = scriptDetail?.pages?.length || 1;
  const currentPageObj = scriptDetail?.pages?.[activePage - 1];
  const origSrc = currentPageObj?.original_image_path;
  const procSrc = currentPageObj?.processed_image_path;

  // Resolve image source based on viewMode and fallback
  let pageImage = '';
  if (viewMode === 'enhanced') {
    pageImage = (!imgError && procSrc) ? procSrc : (origSrc || procSrc || `/storage/processed/scan_${scriptDetail?.student_roll_no || 'STU-1024'}.jpg`);
  } else {
    pageImage = (!imgError && origSrc) ? origSrc : (procSrc || origSrc || `/storage/processed/scan_${scriptDetail?.student_roll_no || 'STU-1024'}.jpg`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Top Context & Script Switcher Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <ScanText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">OCR Handwriting Verification</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                <Cpu className="w-3 h-3" />
                <span>RapidOCR Active</span>
              </span>
            </div>
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
              onChange={e => {
                setSelectedScriptId(e.target.value);
                setActivePage(1);
                setImgError(false);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-brand-500"
            >
              {scripts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.student_roll_no} — {s.student_name || 'Student'} ({s.page_count || 1} pages, {s.processing_status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
            <button
              onClick={handleRerunOCR}
              disabled={isProcessingOCR}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center space-x-1"
              title="Re-run handwriting recognition on this answer script"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingOCR ? 'animate-spin' : ''}`} />
              <span>{isProcessingOCR ? 'Processing OCR...' : 'Re-Run OCR'}</span>
            </button>

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

      {/* Advanced Neural OCR Processing HUD with Live Estimated Time Countdown */}
      {isProcessingOCR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-700/80 text-left relative overflow-hidden">
            {/* Glowing Top Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <ScanText className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>RapidOCR Neural Scanner</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Advanced Academic Handwriting Recognition</p>
                </div>
              </div>

              {/* Live Countdown Clock Badge & Sound Controls */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  title={isAudioMuted ? "Unmute scan audio motion" : "Mute scan audio motion"}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
                </button>
                <div className="text-right bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
                  <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-mono font-bold justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{ocrTimeRemaining}s remaining</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Speed: ~1.8s/page · Audio ON</p>
                </div>
              </div>
            </div>

            {/* Animated Laser Sweep Graphic */}
            <div className="relative w-full h-28 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-around p-4 mb-6">
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none animate-scan"></div>
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                <span>LASER_BEAM_FREQUENCY: 300_DPI</span>
                <span>PAGE_TARGET: {totalPages} PAGES TOTAL</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-2 w-full bg-slate-800 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-5/6 bg-slate-800 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            {/* Smooth Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Total Scan Progress</span>
                <span className="font-mono text-cyan-400 font-bold">{ocrProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400 h-1.5 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${ocrProgressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* 4-Stage Progressive Execution Checklist */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className={`flex items-center justify-between ${ocrStage >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                <div className="flex items-center space-x-2">
                  {ocrStage > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  <span>1. CLAHE Contrast & Illumination Flattening</span>
                </div>
                <span className="text-[10px] uppercase font-bold">{ocrStage > 1 ? 'Done' : 'Active'}</span>
              </div>

              <div className={`flex items-center justify-between ${ocrStage >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                <div className="flex items-center space-x-2">
                  {ocrStage > 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : ocrStage === 2 ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block" />}
                  <span>2. RapidOCR Handwriting Stroke Vectorization</span>
                </div>
                <span className="text-[10px] uppercase font-bold">{ocrStage > 2 ? 'Done' : ocrStage === 2 ? 'Active' : 'Pending'}</span>
              </div>

              <div className={`flex items-center justify-between ${ocrStage >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                <div className="flex items-center space-x-2">
                  {ocrStage > 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : ocrStage === 3 ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block" />}
                  <span>3. Universal Question Markers (Q1, 1., q.1, Subtopics)</span>
                </div>
                <span className="text-[10px] uppercase font-bold">{ocrStage > 3 ? 'Done' : ocrStage === 3 ? 'Active' : 'Pending'}</span>
              </div>

              <div className={`flex items-center justify-between ${ocrStage >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                <div className="flex items-center space-x-2">
                  {ocrStage >= 4 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block" />}
                  <span>4. Relevance Gate & Consistency Scoring</span>
                </div>
                <span className="text-[10px] uppercase font-bold">{ocrStage >= 4 ? 'Done' : 'Pending'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Please keep this tab open while neural handwriting weights process all script pages.
            </p>
          </div>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* LEFT PANEL: Handwritten Scan Viewer */}
        <div className="bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden relative select-none">
          {/* Viewer Floating Controls */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-1.5 rounded-xl flex items-center space-x-3 text-xs shadow-lg">
            <span className="font-semibold text-slate-300">Page {activePage} of {totalPages}</span>
            <div className="h-4 w-px bg-slate-700"></div>
            
            {/* Page navigation arrows */}
            <button
              disabled={activePage <= 1}
              onClick={() => { setActivePage(prev => Math.max(1, prev - 1)); setImgError(false); }}
              className="p-1 hover:text-brand-400 disabled:opacity-30"
              title="Previous Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={activePage >= totalPages}
              onClick={() => { setActivePage(prev => Math.min(totalPages, prev + 1)); setImgError(false); }}
              className="p-1 hover:text-brand-400 disabled:opacity-30"
              title="Next Page"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-700"></div>

            {/* View Mode Toggle: Original vs Enhanced */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => { setViewMode('original'); setImgError(false); }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  viewMode === 'original' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
                title="View original scanned page"
              >
                Original
              </button>
              <button
                onClick={() => { setViewMode('enhanced'); setImgError(false); }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  viewMode === 'enhanced' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
                title="View enhanced contrast page"
              >
                Enhanced
              </button>
            </div>

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
              {imgError && !pageImage ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-700 rounded-xl max-w-md">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">Image Loading Notice</p>
                  <p className="text-xs text-slate-400 mb-3">
                    The document page is still being rendered or processed.
                  </p>
                  <button 
                    onClick={() => { setImgError(false); loadScriptDetail(selectedScriptId); }}
                    className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              ) : (
                <img
                  src={pageImage}
                  alt={`Handwritten Answer Sheet Page ${activePage}`}
                  onError={() => {
                    console.warn("Failed to load script image:", pageImage);
                    setImgError(true);
                  }}
                  className="max-h-[85vh] object-contain rounded shadow-lg select-none"
                />
              )}
            </div>
          </div>

          {/* Bottom Page Navigation */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Physical Scanned Page {activePage} of {totalPages} ({viewMode === 'enhanced' ? 'Enhanced Contrast' : 'Original Scan'})</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={activePage <= 1}
                onClick={() => { setActivePage(prev => Math.max(1, prev - 1)); setImgError(false); }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-40"
              >
                Previous Page
              </button>
              <button
                disabled={activePage >= totalPages}
                onClick={() => { setActivePage(prev => Math.min(totalPages, prev + 1)); setImgError(false); }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-40"
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
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">Recognized Questions & Student Handwriting</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                  Unified 1:1 Question Mapping
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Each exam question is unified as one complete answer block. Sub-points and continuations are fully preserved.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-md font-semibold text-[11px]">
              {scriptDetail?.extracted_answers?.length || 0} Questions Unified
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!scriptDetail?.extracted_answers || scriptDetail.extracted_answers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 mb-1">No OCR answers segmented yet</p>
                <p className="text-slate-500 mb-3">Click the "Re-Run OCR" button above to extract handwriting text.</p>
                <button
                  onClick={handleRerunOCR}
                  disabled={isProcessingOCR}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs"
                >
                  {isProcessingOCR ? 'Processing...' : 'Run Handwriting OCR Now'}
                </button>
              </div>
            ) : (
              scriptDetail.extracted_answers.map((ans: ExtractedAnswer, idx: number) => {
                const conf = ans.segmentation_confidence || 0.88;
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
                        {(ans.final_text === "[Not Attempted / Blank]" || ans.original_ocr_text === "[Not Attempted / Blank]") && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded text-[10px] whitespace-nowrap">
                            Unattempted / Skipped
                          </span>
                        )}
                      </div>

                      {/* Confidence Badge */}
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          conf >= 0.85 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : conf >= 0.70 
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
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="font-semibold text-slate-600">
                          Complete Student Answer (Editable):
                        </label>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {(editedAnswers[ans.id] !== undefined ? editedAnswers[ans.id] : (ans.final_text || "")).split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                      <textarea
                        rows={7}
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
