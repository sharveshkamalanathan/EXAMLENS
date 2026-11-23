import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  UploadCloud, 
  ScanText, 
  Cpu, 
  CheckSquare, 
  Share2, 
  BarChart3, 
  Settings, 
  GraduationCap,
  Sparkles,
  FileCheck,
  Award,
  Layers,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, role, logout } = useAuth();

  const adminNav: NavItem[] = [
    { id: 'admin-dashboard', label: 'Admin Command', icon: ShieldCheck, badge: 'Master' },
    { id: 'admin-messages', label: 'Inquiries Inbox', icon: Mail, badge: 'Contact' },
    { id: 'dashboard', label: 'Faculty Overview', icon: LayoutDashboard },
    { id: 'exams', label: 'Examinations', icon: BookOpen },
    { id: 'upload', label: 'Upload Center', icon: UploadCloud, badge: 'Physical' },
    { id: 'ocr-verification', label: 'OCR Verification', icon: ScanText, badge: 'Split-view' },
    { id: 'evaluation-queue', label: 'Evaluation Queue', icon: Cpu },
    { id: 'review-workspace', label: 'Review & Grading', icon: CheckSquare, badge: 'Authority' },
    { id: 'publishing', label: 'Publish Results', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Provider Settings', icon: Settings },
  ];

  const teacherNav: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'exams', label: 'Examinations', icon: BookOpen },
    { id: 'upload', label: 'Upload Center', icon: UploadCloud, badge: 'Physical' },
    { id: 'ocr-verification', label: 'OCR Verification', icon: ScanText, badge: 'Split-view' },
    { id: 'evaluation-queue', label: 'Evaluation Queue', icon: Cpu },
    { id: 'review-workspace', label: 'Review & Grading', icon: CheckSquare, badge: 'Authority' },
    { id: 'publishing', label: 'Publish Results', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Provider Settings', icon: Settings },
  ];

  const studentNav: NavItem[] = [
    { id: 'student-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'student-results', label: 'Published Results', icon: Award },
    { id: 'student-analytics', label: 'My Performance', icon: BarChart3 },
    { id: 'student-feedback', label: 'Learning Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings & Account', icon: Settings },
  ];

  const navItems = role === 'student' ? studentNav : (role === 'admin' ? adminNav : teacherNav);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/40 shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-white tracking-tight text-lg block">ExamLens</span>
          {user?.institution ? (
            <p className="text-[11px] font-semibold text-brand-400 truncate max-w-[170px]" title={user.institution}>
              {user.institution}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 truncate">Academic Assessment</p>
          )}
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {role === 'student' ? 'Student Portal' : (role === 'admin' ? 'Master Admin' : 'Faculty Console')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {role === 'student' ? 'Academic Hub' : (role === 'admin' ? 'Administration & Lifecycle' : 'Examination Lifecycle')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive 
                    ? 'bg-brand-500 text-white' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-inner">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
