import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ScanText, 
  ArrowRight,
  Layers,
  Sparkles,
  Users,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { soundEffects } from '../utils/audioEffects';
import { Exam, AnswerScript } from '../types';

interface UploadCenterPageProps {
  initialExamId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const UploadCenterPage: React.FC<UploadCenterPageProps> = ({ initialExamId, onNavigateTab }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [scripts, setScripts] = useState<AnswerScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Upload Form State
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rollNo, setRollNo] = useState('STU-1028');
  const [studentName, setStudentName] = useState('Vikram Sen');
  const [batchName, setBatchName] = useState('Batch B — Classroom Answer Scripts');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [processingScriptId, setProcessingScriptId] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      if (uploadMode === 'single') {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        formData.append('student_roll_no', rollNo);
        formData.append('student_name', studentName);

        await api.uploadScript(selectedExamId, formData);
        setUploadMessage("Script uploaded successfully! Initializing page conversions...");
      } else {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('batch_name', batchName);

        await api.uploadBatch(selectedExamId, formData);
        setUploadMessage(`Batch uploaded! ${selectedFiles.length} answer scripts registered.`);
      }

      setSelectedFiles([]);
      loadScripts(selectedExamId);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message || 'Error processing document'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerOCR = async (scriptId: string) => {
    setProcessingScriptId(scriptId);
    soundEffects.playOcrScanSound();
    const interval = setInterval(() => soundEffects.playOcrScanSound(), 2600);
    try {
      await api.processOCR(scriptId);
      clearInterval(interval);
      soundEffects.playOcrSuccessSound();
      await loadScripts(selectedExamId);
      onNavigateTab('ocr-verification', { scriptId });
    } catch (err: any) {
      clearInterval(interval);
      alert(`OCR failed: ${err.message}`);
    } finally {
      clearInterval(interval);
      setProcessingScriptId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Answer Script Upload Center</h2>
          <p className="text-xs text-slate-500">
            Digitize physical examination scripts via high-resolution PDF or page image scans
          </p>
        </div>

        {/* Exam Picker */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">Active Examination:</label>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Upload Box (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => { setUploadMode('single'); setSelectedFiles([]); }}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                uploadMode === 'single' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'
              }`}
            >
              Single Script Upload
            </button>
            <button
              onClick={() => { setUploadMode('batch'); setSelectedFiles([]); }}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                uploadMode === 'batch' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'
              }`}
            >
              Bulk Batch Upload
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            {uploadMessage && (
              <div className="p-3 bg-brand-50 text-brand-900 border border-brand-200 rounded-lg text-xs">
                {uploadMessage}
              </div>
            )}

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-xs">
                {uploadMode === 'single' ? 'Drag & drop single answer sheet' : 'Drag & drop multiple student scripts'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PDF, Word (DOCX/DOC), JPG, PNG (Max 25MB, up to 20 pages)
              </p>
              <input
                type="file"
                multiple={uploadMode === 'batch'}
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                onChange={handleFileChange}
                className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-700">
                Selected {selectedFiles.length} file(s): {selectedFiles.map(f => f.name).slice(0, 3).join(', ')}
                {selectedFiles.length > 3 && ` and ${selectedFiles.length - 3} more...`}
              </div>
            )}

            {uploadMode === 'single' ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    placeholder="e.g. STU-1024"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="e.g. Vikram Sen"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Identifier *</label>
                <input
                  type="text"
                  required
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Roll numbers will be automatically extracted from file names (e.g. STU-1024_OS.pdf).</p>
              </div>
            )}

            <button
              type="submit"
              disabled={selectedFiles.length === 0 || isUploading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-sm shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <span>{isUploading ? 'Uploading & Converting...' : 'Upload & Preprocess'}</span>
            </button>
          </form>
        </div>

        {/* Right Table: Digitized Scripts in Exam (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Digitized Scripts in Exam ({scripts.length})</h3>
              <p className="text-xs text-slate-500">Track page conversion, OCR status, and handwriting readiness</p>
            </div>
            <button
              onClick={() => onNavigateTab('ocr-verification')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>Open OCR Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Student / Roll</th>
                  <th className="px-4 py-3">File / Pages</th>
                  <th className="px-4 py-3">OCR Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scripts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No scripts uploaded yet for this exam.
                    </td>
                  </tr>
                ) : (
                  scripts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{s.student_name || 'Student'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{s.student_roll_no}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 truncate max-w-[150px]">{s.original_file_name}</div>
                        <div className="text-[10px] text-slate-400">{s.page_count} Page(s) • Deskewed</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.processing_status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                          s.processing_status === 'review_required' ? 'bg-rose-100 text-rose-800' :
                          s.processing_status === 'ocr_completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {s.processing_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {s.total_score !== null && s.total_score !== undefined ? `${s.total_score} Marks` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleTriggerOCR(s.id)}
                            disabled={processingScriptId === s.id}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-800 rounded font-semibold text-[11px] flex items-center space-x-1 transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 ${processingScriptId === s.id ? 'animate-spin text-amber-600' : ''}`} />
                            <span>{processingScriptId === s.id ? 'Scanning...' : 'Run OCR'}</span>
                          </button>
                          <button
                            onClick={() => onNavigateTab('ocr-verification', { scriptId: s.id })}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                          >
                            Verify
                          </button>
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
    </div>
  );
};
