import React from 'react';
import { Sparkles, Shield, UserCheck, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenSettings }) => {
  const { user, role, loginAsDemo } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Context */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 -mt-0.5">{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Demo Mode Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span className="font-semibold">Demo Mode Active</span>
          <span className="text-[11px] text-amber-600 hidden sm:inline">(Sample NIT Exams Loaded)</span>
        </div>

        {/* Quick Demo Role Switcher Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200">
            <span>Switch Role</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick 1-Click Demo Profiles
            </div>
            <button
              onClick={() => loginAsDemo('teacher')}
              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-medium">Prof. Rajesh Sharma</p>
                <p className="text-[10px] text-slate-400">Teacher / Evaluator</p>
              </div>
              {role === 'teacher' && <span className="text-[10px] text-brand-600 font-bold">Active</span>}
            </button>
            <button
              onClick={() => loginAsDemo('student-1')}
              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-medium">Aarav Sharma</p>
                <p className="text-[10px] text-slate-400">Student (STU-1024)</p>
              </div>
              {user?.roll_number === 'STU-1024' && <span className="text-[10px] text-brand-600 font-bold">Active</span>}
            </button>
            <button
              onClick={() => loginAsDemo('student-2')}
              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-medium">Priya Nair</p>
                <p className="text-[10px] text-slate-400">Student (STU-1025)</p>
              </div>
              {user?.roll_number === 'STU-1025' && <span className="text-[10px] text-brand-600 font-bold">Active</span>}
            </button>
          </div>
        </div>

        {/* Institution Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-600">
          <Shield className="w-3.5 h-3.5 text-brand-600" />
          <span className="truncate max-w-[150px]">{user?.institution || 'NIT Calicut'}</span>
        </div>
      </div>
    </header>
  );
};
