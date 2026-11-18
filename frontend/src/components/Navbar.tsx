import React from 'react';
import { Sparkles, FileText, CheckCircle2, BarChart2, ShieldCheck, ChevronRight, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onNavigateTab }) => {
  const { user, role, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigateTab ? onNavigateTab('landing') : null}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                ExamLens
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200 rounded-md">
                AI + Human
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 tracking-tight hidden sm:block">
              See beyond the answer.
            </p>
          </div>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
          <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
          <a href="#ai-evaluation" className="hover:text-brand-600 transition-colors">AI Evaluation</a>
          <a href="#workflow" className="hover:text-brand-600 transition-colors">Workflow</a>
        </div>

        {/* Right CTA / User Status */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigateTab ? onNavigateTab(role === 'student' ? 'student-dashboard' : 'dashboard') : null}
                className="px-4 py-2 text-sm font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors flex items-center space-x-1.5"
              >
                <span>Go to {role === 'student' ? 'Student Portal' : 'Teacher Dashboard'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm shadow-brand-500/30 transition-all flex items-center space-x-1.5"
              >
                <span>Get started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
