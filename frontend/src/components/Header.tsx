import React from 'react';
import { Sparkles, Shield, UserCheck, Bell, ChevronDown, Sun, Moon, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSettings?: () => void;
  onToggleMobileView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenSettings, onToggleMobileView }) => {
  const { user, role, loginAsDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Title & Context */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {user?.institution && (
            <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800 hidden sm:inline-block">
              {user.institution}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-sm"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-90 duration-300" />
          )}
        </button>

        {/* Mobile View Toggle */}
        {onToggleMobileView && (
          <button
            type="button"
            onClick={onToggleMobileView}
            title="Switch to Mobile AI Evaluator View"
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl transition-all border border-indigo-200 dark:border-indigo-800 cursor-pointer shadow-sm touch-press"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Mobile Evaluator</span>
          </button>
        )}

        {/* Demo Mode Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-full text-xs text-amber-800 dark:text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span className="font-semibold">Demo Mode Active</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 hidden lg:inline">(Sample NIT Exams Loaded)</span>
        </div>

        {/* Quick Demo Role Switcher Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
            <span>Switch Role</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Quick 1-Click Demo Profiles
            </div>
            <button
              onClick={() => loginAsDemo('teacher')}
              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center justify-between text-slate-800 dark:text-slate-200"
            >
              <div>
                <p className="font-medium">Prof. Rajesh Sharma</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Teacher / Evaluator</p>
              </div>
              {role === 'teacher' && <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">Active</span>}
            </button>
            <button
              onClick={() => loginAsDemo('student-1')}
              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center justify-between text-slate-800 dark:text-slate-200"
            >
              <div>
                <p className="font-medium">Aarav Sharma</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Student (STU-1024)</p>
              </div>
              {user?.roll_number === 'STU-1024' && <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">Active</span>}
            </button>
            <button
              onClick={() => loginAsDemo('student-2')}
              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center justify-between text-slate-800 dark:text-slate-200"
            >
              <div>
                <p className="font-medium">Priya Nair</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Student (STU-1025)</p>
              </div>
              {user?.roll_number === 'STU-1025' && <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">Active</span>}
            </button>
          </div>
        </div>

        {/* Institution Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span className="truncate max-w-[150px]">{user?.institution || 'NIT Calicut'}</span>
        </div>
      </div>
    </header>
  );
};
