import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Cpu, Scan, CheckCircle2, AlertTriangle, 
  Key, Globe, Shield, UserCheck, RefreshCw, Sparkles, ExternalLink,
  Lock, Save, Trash2, AlertOctagon
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SystemStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, login, logout } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states for testing external keys
  const [azureEndpoint, setAzureEndpoint] = useState<string>('');
  const [azureKey, setAzureKey] = useState<string>('');
  const [llmBaseUrl, setLlmBaseUrl] = useState<string>('https://api.openai.com/v1');
  const [llmKey, setLlmKey] = useState<string>('');
  const [llmModel, setLlmModel] = useState<string>('gpt-4o-mini');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemStatus();
      setStatus(data);
      if (data?.ai?.base_url) setLlmBaseUrl(data.ai.base_url);
      if (data?.ai?.model) setLlmModel(data.ai.model);
    } catch (err) {
      console.error('Failed to load system status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (email: string) => {
    setSwitching(email);
    try {
      await login(email, 'examlens123');
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch user', err);
      setSwitching(null);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Configuration preferences recorded for session.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteMyAccount();
      alert('Your account and personal data have been permanently deleted.');
      logout();
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <SettingsIcon className="w-4 h-4" /> Platform Infrastructure & Integration
          </div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings & Providers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure Handwriting OCR backends, AI LLM provider keys, and evaluate test profiles.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Providers
        </button>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {savedMessage}
        </div>
      )}

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Handwriting OCR Provider */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Handwriting OCR Engine</h3>
                <span className="text-xs text-slate-500">Document Intelligence & Layout Extraction</span>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {status?.ocr.status_label || 'Mock OCR (Active)'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            ExamLens isolates OCR providers through a modular interface. It extracts handwritten line segments, preserves word bounding boxes, and generates confidence scores.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Azure AI Document Intelligence Endpoint
              </label>
              <input
                type="text"
                placeholder="https://your-resource.cognitiveservices.azure.com/"
                value={azureEndpoint}
                onChange={(e) => setAzureEndpoint(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Azure Cognitive Services Key
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={azureKey}
                onChange={(e) => setAzureKey(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Leave blank to utilize ExamLens high-precision simulated handwriting recognition.
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition"
            >
              <Save className="w-3.5 h-3.5" /> Save OCR Configuration
            </button>
          </form>
        </div>

        {/* AI Semantic Evaluator Provider */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">AI Evaluation Engine</h3>
                <span className="text-xs text-slate-500">Structured JSON Semantic Rubric Evaluator</span>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {status?.ai.status_label || 'Mock Evaluator'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluates student answers against question rubrics, extracting evidence quotes and computing partial marks with strict Pydantic validation.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={llmBaseUrl}
                  onChange={(e) => setLlmBaseUrl(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                OpenAI-Compatible API Key
              </label>
              <input
                type="password"
                placeholder="sk-••••••••••••••••••••••••••••••••"
                value={llmKey}
                onChange={(e) => setLlmKey(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Compatible with OpenAI, Gemini OpenAI proxy, Anthropic Claude, or local Ollama/vLLM endpoints.
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition"
            >
              <Save className="w-3.5 h-3.5" /> Save AI Configuration
            </button>
          </form>
        </div>
      </div>

      {/* Demo Switcher & Pre-configured Personas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Quick Persona Switcher</h3>
            <p className="text-xs text-slate-500">
              One-click instant login into pre-seeded roles with real database answer sheets and evaluation trails.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Teacher Profile */}
          <div className="border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Faculty
              </span>
              <span className="text-xs text-slate-400">Evaluator</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Prof. Rajesh Sharma</h4>
              <span className="text-xs text-slate-500 block">teacher@examlens.edu</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Computer Science & Engineering</span>
            </div>
            <button
              onClick={() => handleQuickSwitch('teacher@examlens.edu')}
              disabled={switching !== null}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              {switching === 'teacher@examlens.edu' ? 'Switching...' : 'Switch to Teacher'}
            </button>
          </div>

          {/* Student 1 */}
          <div className="border border-slate-200 hover:border-emerald-300 rounded-xl p-4 transition space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Student
              </span>
              <span className="text-xs font-mono text-slate-400">STU-1024</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Aarav Sharma</h4>
              <span className="text-xs text-slate-500 block">stu101@examlens.edu</span>
              <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Score: 42/50 (84%)</span>
            </div>
            <button
              onClick={() => handleQuickSwitch('stu101@examlens.edu')}
              disabled={switching !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              {switching === 'stu101@examlens.edu' ? 'Switching...' : 'Switch to Student 1'}
            </button>
          </div>

          {/* Student 2 */}
          <div className="border border-slate-200 hover:border-amber-300 rounded-xl p-4 transition space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Student
              </span>
              <span className="text-xs font-mono text-slate-400">STU-1025</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Priya Nair</h4>
              <span className="text-xs text-slate-500 block">stu102@examlens.edu</span>
              <span className="text-[11px] text-amber-600 font-medium block mt-0.5">Score: 38/50 (76%)</span>
            </div>
            <button
              onClick={() => handleQuickSwitch('stu102@examlens.edu')}
              disabled={switching !== null}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              {switching === 'stu102@examlens.edu' ? 'Switching...' : 'Switch to Student 2'}
            </button>
          </div>

          {/* Admin */}
          <div className="border border-slate-200 hover:border-purple-300 rounded-xl p-4 transition space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                Admin
              </span>
              <span className="text-xs text-slate-400">System</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Exam Admin NIT</h4>
              <span className="text-xs text-slate-500 block">admin@examlens.edu</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Examination Cell</span>
            </div>
            <button
              onClick={() => handleQuickSwitch('admin@examlens.edu')}
              disabled={switching !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              {switching === 'admin@examlens.edu' ? 'Switching...' : 'Switch to Admin'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Permanently delete your account (<span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>) and erase all associated personal workspace data, answer papers, and evaluations. This operation is immediate and irreversible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex-shrink-0 inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/70 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Permanent Deletion</h3>
                <p className="text-xs text-slate-500">Account: {user?.email}</p>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-xs text-rose-800 dark:text-rose-300">
              <p className="font-semibold mb-1">Warning: Irreversible action</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>All your created exams, rubrics, and settings will be permanently erased.</li>
                <li>Your student records and session credentials will be cleared.</li>
                <li>You will be immediately logged out.</li>
              </ul>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-100/50 p-2 rounded-lg font-medium">
                {deleteError}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                To confirm deletion, type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || deleting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting Account...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
