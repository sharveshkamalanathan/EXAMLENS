import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Copy, Check, ArrowLeft, Eye, AlertTriangle } from 'lucide-react';

interface MobilePortalNoticeProps {
  onBackToWebsite: () => void;
}

export const MobilePortalNotice: React.FC<MobilePortalNoticeProps> = ({ onBackToWebsite }) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isSessionDismissed = sessionStorage.getItem('examlens_mobile_portal_dismissed') === 'true';
    if (isSessionDismissed) {
      setDismissed(true);
    }

    const checkMobile = () => {
      const isNarrow = window.innerWidth < 1024;
      const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrow || isMobileAgent);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('examlens_mobile_portal_dismissed', 'true');
    setDismissed(true);
  };

  // If not mobile, or dismissed, render banner only if screen is still narrow
  if (!isMobile) {
    return null;
  }

  if (dismissed) {
    return (
      <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-300 dark:border-amber-700/60 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between z-40 sticky top-0 backdrop-blur-sm">
        <div className="flex items-center space-x-2 truncate">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">
            <strong>Mobile Preview:</strong> For handwriting OCR zooming & rubric grading, access this portal on a computer.
          </span>
        </div>
        <button
          onClick={handleCopyLink}
          className="ml-3 shrink-0 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] flex items-center space-x-1"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy Link'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl glass-card gradient-border-glow shadow-2xl border border-white/30 dark:border-slate-800/80 p-6 text-center animate-in zoom-in-95 duration-200">
        {/* Glow ambient decoration */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Dual Icon Display */}
        <div className="relative mx-auto mb-4 flex items-center justify-center space-x-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Monitor className="w-7 h-7" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3 border border-brand-200 dark:border-brand-800">
          <span>💻 Desktop Optimization Notice</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Portal Best Accessed on Computer
        </h3>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-left bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          The <strong>ExamLens Evaluation Portal</strong> includes physical answer-sheet handwriting inspection, bounding-box OCR verification, and side-by-side rubric grading designed for <strong>desktop & laptop displays (1024px+)</strong>.
        </p>

        {/* Feature comparison */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-left">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
            <div className="font-bold flex items-center space-x-1">
              <span>📱 Mobile Phone</span>
            </div>
            <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400">
              Full access to landing website, 30-day trial registration, features, and contact.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300">
            <div className="font-bold flex items-center space-x-1">
              <span>💻 Desktop Computer</span>
            </div>
            <p className="mt-1 text-[10px] text-indigo-700 dark:text-indigo-400">
              Evaluation portal, script OCR canvas, rubric grading & admin console.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Portal Link to Open on Computer'}</span>
          </button>

          <button
            onClick={onBackToWebsite}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Return to Mobile Website</span>
          </button>

          <button
            onClick={handleDismiss}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pt-1 underline cursor-pointer"
          >
            Continue to mobile portal preview anyway
          </button>
        </div>
      </div>
    </div>
  );
};
