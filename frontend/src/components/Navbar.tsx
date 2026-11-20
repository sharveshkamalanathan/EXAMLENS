import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  Sun, 
  Moon, 
  Mail,
  Menu,
  X,
  Layers,
  Cpu,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateTab?: (tab: string) => void;
  onOpenFeaturesModal?: () => void;
  onOpenWorkflowModal?: () => void;
  onOpenContactModal?: () => void;
  onOpenTrial?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuth, 
  onNavigateTab,
  onOpenFeaturesModal,
  onOpenWorkflowModal,
  onOpenContactModal,
  onOpenTrial
}) => {
  const { user, role, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleNavClick = (sectionId: string, openModalFallback?: () => void) => {
    setMobileMenuOpen(false);
    if (onNavigateTab) {
      onNavigateTab('landing');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (openModalFallback) {
        openModalFallback();
      }
    }, 60);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => {
            if (onNavigateTab) onNavigateTab('landing');
            setMobileMenuOpen(false);
          }}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 group-hover:shadow-brand-500/40 transition-all">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                ExamLens
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-md">
                AI + Human
              </span>
            </div>
            {user?.institution ? (
              <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 -mt-0.5 tracking-tight truncate max-w-[200px]" title={user.institution}>
                {user.institution}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 tracking-tight hidden sm:block">
                See beyond the answer.
              </p>
            )}
          </div>
        </div>

        {/* Desktop Center Links */}
        <div className="hidden md:flex items-center space-x-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button 
            type="button"
            onClick={() => handleNavClick('how-it-works')} 
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer"
          >
            How It Works
          </button>
          <button 
            type="button"
            onClick={() => {
              handleNavClick('features');
              if (onOpenFeaturesModal) onOpenFeaturesModal();
            }} 
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer flex items-center space-x-1"
          >
            <span>Features</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping"></span>
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('ai-evaluation')} 
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer"
          >
            AI Evaluation
          </button>
          <button 
            type="button"
            onClick={() => {
              handleNavClick('workflow');
              if (onOpenWorkflowModal) onOpenWorkflowModal();
            }} 
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer flex items-center space-x-1"
          >
            <span>Workflow</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
              5-step
            </span>
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('contact', onOpenContactModal)} 
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer flex items-center space-x-1 text-slate-700 dark:text-slate-200"
          >
            <Mail className="w-3.5 h-3.5 text-brand-500" />
            <span>Contact Us</span>
          </button>
          <button 
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('mobile-dashboard') : null} 
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Evaluator</span>
          </button>
        </div>

        {/* Right Controls: Dark Mode Toggle, Auth & Mobile Menu Trigger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-90 duration-300" />
            )}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center space-x-2.5">
              <button
                onClick={() => onNavigateTab ? onNavigateTab(role === 'student' ? 'student-dashboard' : (role === 'admin' ? 'admin-dashboard' : 'dashboard')) : null}
                className="px-3 py-1.5 text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors flex items-center space-x-1.5"
              >
                <span>Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={logout}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm shadow-brand-500/30 transition-all flex items-center space-x-1.5 group cursor-pointer"
              >
                <span>Get started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenFeaturesModal) onOpenFeaturesModal();
                else handleNavClick('features');
              }}
              className="text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center space-x-1.5"
            >
              <span>Features</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            </button>
            <button
              onClick={() => handleNavClick('ai-evaluation')}
              className="text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              AI Evaluation
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenWorkflowModal) onOpenWorkflowModal();
                else handleNavClick('workflow');
              }}
              className="text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              5-Step Workflow
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenContactModal) onOpenContactModal();
                else handleNavClick('contact');
              }}
              className="text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors col-span-2 flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-semibold"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Us / Inquiries</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigateTab) onNavigateTab('mobile-dashboard');
              }}
              className="text-left p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 transition-colors col-span-2 flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800"
            >
              <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>AI Advanced Evaluator (Mobile Dashboard)</span>
            </button>
          </div>

          {/* 30-Day Free Trial CTA for Mobile */}
          {onOpenTrial && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrial();
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Activate 30-Day Free Trial</span>
            </button>
          )}

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {user ? (
              <div className="w-full flex items-center justify-between">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateTab) {
                      onNavigateTab(role === 'student' ? 'student-dashboard' : (role === 'admin' ? 'admin-dashboard' : 'dashboard'));
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center space-x-1"
                >
                  <span>Open Portal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-rose-500 font-medium px-2 py-1"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
