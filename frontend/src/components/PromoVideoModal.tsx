import React, { useEffect, useRef } from 'react';
import { X, Play, Sparkles, CheckCircle2, ShieldCheck, ExternalLink, Download } from 'lucide-react';

interface PromoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrial?: () => void;
}

export const PromoVideoModal: React.FC<PromoVideoModalProps> = ({
  isOpen,
  onClose,
  onOpenTrial
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback
        });
      }
    } else {
      document.body.style.overflow = 'unset';
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col z-10 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Play className="w-4 h-4 fill-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  ExamLens – Official Platform Commercial
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  60s 1080p
                </span>
              </div>
              <p className="text-xs text-slate-400">
                See beyond the answer • AI Evaluates, Teacher Verifies
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/examlens_promo_60s.mp4"
              download="ExamLens_Commercial_60s.mp4"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              title="Download 1080p MP4"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src="/examlens_promo_60s.mp4"
            poster="/examlens_promo_poster.jpg"
            preload="auto"
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Storyboard Highlights Bar & CTA */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center space-x-1 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Universal Handwriting OCR</span>
            </span>
            <span className="flex items-center space-x-1 font-medium">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Semantic AI Rubrics</span>
            </span>
            <span className="flex items-center space-x-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>100% Teacher Authority</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {onOpenTrial && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTrial();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Start 30-Day Free Trial</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
