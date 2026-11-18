import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  ListOrdered, 
  HelpCircle, 
  Save, 
  ArrowLeft,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Exam, Question, RubricCriterion } from '../types';

interface QuestionBuilderPageProps {
  initialExamId?: string;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const QuestionBuilderPage: React.FC<QuestionBuilderPageProps> = ({ initialExamId, onNavigateTab }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form State
  const [qNumber, setQNumber] = useState('Q1');
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('descriptive');
  const [qMaxMarks, setQMaxMarks] = useState(5.0);
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qReferenceAnswer, setQReferenceAnswer] = useState('');
  const [qConcepts, setQConcepts] = useState<string>('');
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([
    { name: 'Core Definition', description: 'Accurate terminology', expected_concepts: ['definition'], max_marks: 2.0, display_order: 1 },
    { name: 'Technical Explanation', description: 'Step-by-step reasoning', expected_concepts: ['mechanism'], max_marks: 3.0, display_order: 2 }
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await api.getExams();
        setExams(data);
        if (!selectedExamId && data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadQuestions(selectedExamId);
    }
  }, [selectedExamId]);

  const loadQuestions = async (examId: string) => {
    try {
      const qList = await api.getQuestions(examId);
      setQuestions(qList);
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

  const handleAddCriterion = () => {
    setRubricCriteria([
      ...rubricCriteria,
      {
        name: `Criterion ${rubricCriteria.length + 1}`,
        description: 'Grading criterion description',
        expected_concepts: [],
        max_marks: 1.0,
        display_order: rubricCriteria.length + 1
      }
    ]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setRubricCriteria(rubricCriteria.filter((_, i) => i !== idx));
  };

  const handleCriterionChange = (idx: number, field: string, val: any) => {
    const updated = [...rubricCriteria];
    (updated[idx] as any)[field] = val;
    setRubricCriteria(updated);
  };

  const rubricSum = rubricCriteria.reduce((sum, c) => sum + (Number(c.max_marks) || 0), 0);
  const isRubricValid = Math.abs(rubricSum - qMaxMarks) < 0.05;

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isRubricValid) {
      setFormError(`The sum of rubric criteria marks (${rubricSum}) must equal question maximum marks (${qMaxMarks}).`);
      return;
    }

    try {
      const conceptsList = qConcepts.split(',').map(s => s.trim()).filter(Boolean);
      await api.createQuestion(selectedExamId, {
        question_number: qNumber,
        text: qText,
        question_type: qType,
        max_marks: qMaxMarks,
        topic: qTopic || 'General',
        difficulty: qDifficulty,
        reference_answer: qReferenceAnswer,
        important_concepts: conceptsList,
        rubric_criteria: rubricCriteria
      });

      setShowAddForm(false);
      // Reset form
      setQNumber(`Q${questions.length + 2}`);
      setQText('');
      setQReferenceAnswer('');
      setQConcepts('');
      loadQuestions(selectedExamId);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create question');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (confirm("Delete this question and its rubrics?")) {
      try {
        await api.deleteQuestion(qId);
        loadQuestions(selectedExamId);
      } catch (err: any) {
        alert(err.message || 'Failed to delete question');
      }
    }
  };

  const activeExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTab('exams')}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Question Bank & Rubric Scheme</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure reference answers and strict criteria rubrics for semantic AI evaluation
          </p>
        </div>

        {/* Exam Picker */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">Select Exam:</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-brand-500"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {activeExam && (
        <div className="p-4 bg-brand-50/60 border border-brand-200/80 rounded-xl flex items-center justify-between text-xs text-brand-900">
          <div>
            <span className="font-bold">{activeExam.title}</span> • {activeExam.subject} • Total: {activeExam.total_marks} Marks
          </div>
          <span className="font-semibold text-brand-700">
            {questions.length} Question(s) Configured
          </span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Configured Questions ({questions.length})</h3>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          )}
        </div>

        {questions.length === 0 && !showAddForm ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No questions defined yet. Click "Add Question" to build your rubric scheme.
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-800 font-bold rounded text-xs">
                      {q.question_number}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{q.text}</span>
                    <span className="text-xs font-semibold text-slate-500">({q.max_marks} Marks)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Topic: {q.topic} • Difficulty: {q.difficulty}</p>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Reference Answer Preview */}
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">Teacher Reference Answer:</span>
                <p className="leading-relaxed">{q.reference_answer}</p>
              </div>

              {/* Rubric Criteria List */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Rubric Scoring Criteria ({q.rubric_criteria?.length || 0}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {q.rubric_criteria?.map((crit, cIdx) => (
                    <div key={cIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{crit.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{crit.description}</p>
                      </div>
                      <span className="font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-[11px]">
                        {crit.max_marks} M
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Add Question Form Card */}
        {showAddForm && (
          <form onSubmit={handleSaveQuestion} className="p-6 bg-white rounded-2xl border-2 border-brand-500 shadow-md space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Add New Question & Marking Rubric</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question Number *</label>
                <input
                  type="text"
                  required
                  value={qNumber}
                  onChange={e => setQNumber(e.target.value)}
                  placeholder="e.g. Q1 or 2(a)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Marks *</label>
                <input
                  type="number"
                  required
                  step="0.5"
                  value={qMaxMarks}
                  onChange={e => setQMaxMarks(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic / Module</label>
                <input
                  type="text"
                  value={qTopic}
                  onChange={e => setQTopic(e.target.value)}
                  placeholder="e.g. Virtual Memory"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Question Text *</label>
              <textarea
                required
                rows={2}
                value={qText}
                onChange={e => setQText(e.target.value)}
                placeholder="Enter complete question statement..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference Answer *</label>
              <textarea
                required
                rows={3}
                value={qReferenceAnswer}
                onChange={e => setQReferenceAnswer(e.target.value)}
                placeholder="Enter official reference answer and key concepts that the AI will use to grade meaning..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Important Concepts (Comma Separated)</label>
              <input
                type="text"
                value={qConcepts}
                onChange={e => setQConcepts(e.target.value)}
                placeholder="e.g. Page Table, Frame, MMU, Offset"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Rubric Builder Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900">Marking Rubric Criteria</h5>
                  <p className="text-[11px] text-slate-500">Each criterion must specify its maximum marks. Total criteria must sum to {qMaxMarks} Marks.</p>
                </div>
                <div className={`px-2.5 py-1 rounded text-xs font-bold ${
                  isRubricValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Sum: {rubricSum} / {qMaxMarks} Marks {isRubricValid ? '✓' : '⚠️'}
                </div>
              </div>

              <div className="space-y-2">
                {rubricCriteria.map((crit, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                      <input
                        type="text"
                        required
                        value={crit.name}
                        onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                        placeholder="Criterion Name"
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={crit.description || ''}
                        onChange={e => handleCriterionChange(idx, 'description', e.target.value)}
                        placeholder="Description / Guidance"
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        required
                        step="0.25"
                        value={crit.max_marks}
                        onChange={e => handleCriterionChange(idx, 'max_marks', parseFloat(e.target.value))}
                        placeholder="Marks"
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    {rubricCriteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isRubricValid}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
              >
                Save Question & Rubric
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
