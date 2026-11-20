import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  UploadCloud, 
  CheckSquare, 
  BarChart3, 
  Trash2, 
  Share2, 
  ExternalLink,
  ChevronRight,
  ListOrdered,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { Exam } from '../types';

interface ExamListPageProps {
  onNavigateTab: (tab: string, meta?: any) => void;
  onOpenCreateExam: () => void;
}

export const ExamListPage: React.FC<ExamListPageProps> = ({ onNavigateTab, onOpenCreateExam }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await api.getExams();
      setExams(data);
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete examination "${title}"? All answer scripts and evaluations will be permanently deleted.`)) {
      try {
        await api.deleteExam(id);
        fetchExams();
      } catch (err: any) {
        alert(err.message || 'Failed to delete exam');
      }
    }
  };

  const filteredExams = exams.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ex.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'published' ? ex.is_published : !ex.is_published);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Examinations</h2>
          <p className="text-xs text-slate-500">Configure questions, marking rubrics, and oversee physical script evaluation</p>
        </div>
        <button
          onClick={onOpenCreateExam}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-brand-500/25 transition-all flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Examination</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search examinations by title or subject..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Review Pending / Draft</option>
          </select>
        </div>
      </div>

      {/* Exams Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading examinations...</div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No examinations found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create your first examination to define questions and upload scripts.</p>
          <button
            onClick={onOpenCreateExam}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold"
          >
            Create Exam
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Examination Title</th>
                  <th className="px-6 py-3.5">Subject & Class</th>
                  <th className="px-6 py-3.5">Total Marks</th>
                  <th className="px-6 py-3.5">Scripts Progress</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => {
                  const total = exam.scripts_count || 0;
                  const evaluated = exam.evaluated_count || 0;
                  const pct = total > 0 ? Math.round((evaluated / total) * 100) : 0;

                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{exam.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">Date: {exam.exam_date || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{exam.subject}</div>
                        <div className="text-[11px] text-slate-500">{exam.class_name} ({exam.section})</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {exam.total_marks} Marks
                        {exam.passing_marks && (
                          <span className="block text-[11px] font-normal text-slate-500">Pass: {exam.passing_marks}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>{evaluated}/{total} scripts</span>
                            <span className="font-bold">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exam.is_published 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {exam.is_published ? 'Published' : 'Review Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onNavigateTab('question-builder', { examId: exam.id })}
                            title="Manage Questions & Rubrics"
                            className="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-600 transition-colors"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigateTab('upload', { examId: exam.id })}
                            title="Upload Scripts"
                            className="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-600 transition-colors"
                          >
                            <UploadCloud className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigateTab('review-workspace', { examId: exam.id })}
                            title="Review Workspace"
                            className="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-600 transition-colors"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigateTab('analytics', { examId: exam.id })}
                            title="Analytics"
                            className="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-600 transition-colors"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const safeTitle = exam.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
                                await api.downloadExamCSV(exam.id, `${safeTitle}_Results.csv`);
                              } catch (err: any) {
                                alert(`Export failed: ${err.message}`);
                              }
                            }}
                            title="Export Results CSV"
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, exam.title)}
                            title="Delete Exam"
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
