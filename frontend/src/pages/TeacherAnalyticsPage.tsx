import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  BarChart3, Download, Award, AlertTriangle, TrendingUp, 
  Layers, BrainCircuit, RefreshCw, ChevronDown, CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { Exam, ExamAnalytics } from '../types';

interface TeacherAnalyticsPageProps {
  initialExamId?: string;
  onNavigateTab?: (tab: string, meta?: any) => void;
}

export const TeacherAnalyticsPage: React.FC<TeacherAnalyticsPageProps> = ({ 
  initialExamId, 
  onNavigateTab 
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadAnalytics(selectedExamId);
    }
  }, [selectedExamId]);

  const loadExams = async () => {
    try {
      const data = await api.getExams();
      setExams(data);
      if (data.length > 0) {
        if (!selectedExamId || !data.some(e => e.id === selectedExamId)) {
          setSelectedExamId(data[0].id);
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load examinations');
      setLoading(false);
    }
  };

  const loadAnalytics = async (examId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExamAnalytics(examId);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load examination analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedExamId) return;
    setIsExporting(true);
    setExportNotice(null);
    try {
      const targetExam = exams.find(e => e.id === selectedExamId);
      const safeTitle = (targetExam?.title || analytics?.exam_title || 'Exam').replace(/[^a-zA-Z0-9_\-]/g, '_');
      await api.downloadExamCSV(selectedExamId, `${safeTitle}_Results.csv`);
      setExportNotice("Results CSV exported and downloaded successfully!");
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const currentExam = exams.find(e => e.id === selectedExamId);

  // Palette colors for charts
  const scoreColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Exam Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" /> Academic Performance Intelligence
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Examination Analytics & Insights</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cognitive rubric diagnostic report and handwritten evaluation metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px]">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-4 py-2.5 pr-10 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.subject})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={() => selectedExamId && loadAnalytics(selectedExamId)}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!selectedExamId || isExporting}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
            title="Download comprehensive examination grade sheet as CSV"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button 
            onClick={() => setExportNotice(null)} 
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Computing Examination Analytics...</h3>
          <p className="text-sm text-slate-500 mt-1">Aggregating handwritten script scores, rubric criteria, and misconception frequencies.</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold">Unable to load analytics</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      ) : !analytics ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          No examination selected or no data available.
        </div>
      ) : (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidates</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-slate-900">{analytics.evaluated_students}</span>
                <span className="text-xs text-slate-500">/ {analytics.total_students} evaluated</span>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {analytics.approved_students} teacher approved
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Average</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-indigo-600">{analytics.average_score}</span>
                <span className="text-xs text-slate-500">/ {currentExam?.total_marks || 50}</span>
              </div>
              <div className="mt-2 text-xs font-medium text-indigo-600">
                {currentExam?.total_marks ? Math.round((analytics.average_score / currentExam.total_marks) * 100) : 0}% mean score
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pass Rate</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={`text-2xl font-bold ${analytics.pass_percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {analytics.pass_percentage}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Passing: {currentExam?.passing_marks ?? Math.round((currentExam?.total_marks || 50) * 0.4)} marks
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Highest Mark</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-emerald-600">{analytics.highest_score}</span>
                <span className="text-xs text-slate-500">pts</span>
              </div>
              <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> Top Performer
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lowest Mark</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-slate-700">{analytics.lowest_score}</span>
                <span className="text-xs text-slate-500">pts</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">Need attention</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Median Score</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-slate-900">{analytics.median_score}</span>
                <span className="text-xs text-slate-500">pts</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">50th percentile</div>
            </div>
          </div>

          {/* Charts Row: Score Distribution & Question Difficulty */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Histogram */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Score Distribution</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Frequency of student marks across percentage brackets</p>
                </div>
                <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                  N = {analytics.evaluated_students}
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range_label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} Students`, 'Count']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {analytics.score_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={scoreColors[index % scoreColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Question-wise Average Marks */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Question Performance vs Max Marks</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Average marks scored per question against total weightage</p>
                </div>
                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                  Rubric Assessment
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.question_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="question_number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(val: any, name: string) => [
                        `${val} Marks`, 
                        name === 'average_marks' ? 'Class Average' : 'Maximum Marks'
                      ]}
                      labelFormatter={(label) => `Question ${label}`}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="max_marks" fill="#e2e8f0" name="Max Marks" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="average_marks" fill="#6366f1" name="Class Average" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Topic Performance & Frequently Missed Concepts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic-wise Mastery */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">Topic-wise Mastery Breakdown</h3>
              <p className="text-xs text-slate-500 mb-4">Average percentage attained by students across curriculum topics</p>

              <div className="space-y-4">
                {analytics.topic_performance.map((tp, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{tp.topic}</span>
                      <span className="font-bold text-slate-900">{tp.average_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          tp.average_percentage >= 75 ? 'bg-emerald-500' :
                          tp.average_percentage >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, tp.average_percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conceptual Gaps & Most Missed Rubric Concepts */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Key Conceptual Gaps Identified by AI</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Concepts frequently missing or misunderstood across handwritten answers
              </p>

              {analytics.top_missed_concepts && analytics.top_missed_concepts.length > 0 ? (
                <div className="space-y-2.5">
                  {analytics.top_missed_concepts.map((concept, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900 text-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{concept}</span>
                        <p className="text-amber-700/80 text-[11px] mt-0.5">
                          Detected in student rubric criteria evaluation discrepancies. Recommend targeted revision.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                  No major concept discrepancies recorded for this examination.
                </div>
              )}
            </div>
          </div>

          {/* Question-Wise Performance Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Question-by-Question Diagnostic</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detailed breakdown of difficulty, average scores, and criteria attainment</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                {analytics.question_performance.length} Questions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Q#</th>
                    <th className="px-5 py-3">Topic</th>
                    <th className="px-5 py-3">Difficulty</th>
                    <th className="px-5 py-3 text-center">Max Marks</th>
                    <th className="px-5 py-3 text-center">Class Avg</th>
                    <th className="px-5 py-3 text-center">Success %</th>
                    <th className="px-5 py-3">Most Missed Concept</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.question_performance.map((qp) => (
                    <tr key={qp.question_id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{qp.question_number}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">{qp.topic}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          qp.difficulty === 'hard' ? 'bg-red-50 text-red-700 border border-red-200' :
                          qp.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {qp.difficulty}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{qp.max_marks}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-indigo-600">{qp.average_marks}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`font-semibold ${
                          qp.average_percentage >= 70 ? 'text-emerald-600' :
                          qp.average_percentage >= 45 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {qp.average_percentage}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {qp.most_missed_concepts && qp.most_missed_concepts.length > 0 ? (
                          <span className="text-red-600 font-medium">{qp.most_missed_concepts[0]}</span>
                        ) : (
                          <span className="text-slate-400 italic">None noted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
