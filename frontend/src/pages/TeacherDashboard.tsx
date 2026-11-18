import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  UploadCloud, 
  ScanText, 
  Cpu, 
  CheckSquare, 
  Share2, 
  BarChart3, 
  Plus, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { api } from '../services/api';
import { TeacherDashboardStats, Exam } from '../types';

interface TeacherDashboardProps {
  onNavigateTab: (tab: string, meta?: any) => void;
  onOpenCreateExam: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab, onOpenCreateExam }) => {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, examsData] = await Promise.all([
          api.getTeacherStats(),
          api.getExams()
        ]);
        setStats(statsData);
        setExams(examsData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Examinations', value: stats?.total_exams || 0, icon: BookOpen, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Scanned Scripts', value: stats?.total_scripts || 0, icon: UploadCloud, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Awaiting OCR', value: stats?.scripts_awaiting_ocr || 0, icon: ScanText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Awaiting AI Eval', value: stats?.scripts_awaiting_eval || 0, icon: Cpu, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Review Pending', value: stats?.evaluations_requiring_review || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Approved Scripts', value: stats?.approved_scripts || 0, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Published Results', value: stats?.published_results || 0, icon: Share2, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  // Chart data for evaluation status
  const chartData = [
    { name: 'Approved', value: stats?.approved_scripts || 0, color: '#10b981' },
    { name: 'Review Pending', value: stats?.evaluations_requiring_review || 0, color: '#f43f5e' },
    { name: 'Awaiting Evaluation', value: stats?.scripts_awaiting_eval || 0, color: '#8b5cf6' },
    { name: 'Awaiting OCR', value: stats?.scripts_awaiting_ocr || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand-300 font-semibold">Teacher Overview</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Examination Operations Command</h2>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            Physical examination evaluation center. Digitize answer scripts, verify OCR recognition, review AI evaluations, and publish final marks.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('upload')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold border border-white/20 transition-all flex items-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Scripts</span>
          </button>
          <button
            onClick={onOpenCreateExam}
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">{c.label}</span>
                <div className={`p-1.5 rounded-lg ${c.bg} ${c.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Active Examinations & Review Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Exams List (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Current Examinations</h3>
              <p className="text-xs text-slate-500">Track digitization and grading status across your subjects</p>
            </div>
            <button
              onClick={() => onNavigateTab('exams')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {exams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No exams created yet. Click "Create Exam" to begin.
              </div>
            ) : (
              exams.map((exam) => {
                const total = exam.scripts_count || 0;
                const evaluated = exam.evaluated_count || 0;
                const progressPct = total > 0 ? Math.round((evaluated / total) * 100) : 0;

                return (
                  <div 
                    key={exam.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{exam.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          exam.is_published 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {exam.is_published ? 'Published' : 'Under Review'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {exam.subject} • {exam.class_name} • Max Marks: {exam.total_marks}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="w-48 sm:w-64 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Evaluation Progress</span>
                          <span className="font-semibold text-slate-700">{evaluated}/{total} scripts ({progressPct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-600 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => onNavigateTab('review-workspace', { examId: exam.id })}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-600 rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        Grading
                      </button>
                      <button
                        onClick={() => onNavigateTab('analytics', { examId: exam.id })}
                        className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-all"
                      >
                        Analytics
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Status Breakdown & Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Examination Tasks
            </h3>
            
            <button
              onClick={() => onNavigateTab('upload')}
              className="w-full p-2.5 text-left rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group"
            >
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="w-4 h-4 text-brand-600" />
                <span>Upload Physical Answer Sheets</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
            </button>

            <button
              onClick={() => onNavigateTab('ocr-verification')}
              className="w-full p-2.5 text-left rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group"
            >
              <div className="flex items-center space-x-2.5">
                <ScanText className="w-4 h-4 text-amber-600" />
                <span>Verify OCR Handwriting</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
            </button>

            <button
              onClick={() => onNavigateTab('evaluation-queue')}
              className="w-full p-2.5 text-left rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group"
            >
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-4 h-4 text-violet-600" />
                <span>AI Batch Evaluation</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
            </button>

            <button
              onClick={() => onNavigateTab('publishing')}
              className="w-full p-2.5 text-left rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group"
            >
              <div className="flex items-center space-x-2.5">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Publish Results to Students</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
            </button>
          </div>

          {/* Pending Alerts Box */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Requires Teacher Action</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              <strong>STU-1027 (Ananya Verma)</strong> has a borderline AI evaluation on Question 2 flagged for teacher review.
            </p>
            <button
              onClick={() => onNavigateTab('review-workspace')}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all text-center block"
            >
              Open Review Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
