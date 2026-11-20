import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Activity, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { soundEffects } from '../../utils/audioEffects';

export const MobileEvaluatorCharts: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'grades' | 'rubric' | 'velocity'>('grades');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [animated, setAnimated] = useState<boolean>(false);

  useEffect(() => {
    // Trigger smooth chart build animation on mount / tab change
    const timer = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(timer);
  }, [activeChart]);

  const gradeData = [
    { grade: 'A+', percent: 34, count: 17, color: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/30' },
    { grade: 'A', percent: 42, count: 21, color: 'from-brand-500 to-indigo-500', glow: 'shadow-brand-500/30' },
    { grade: 'B', percent: 16, count: 8, color: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/30' },
    { grade: 'C', percent: 6, count: 3, color: 'from-amber-500 to-yellow-400', glow: 'shadow-amber-500/30' },
    { grade: 'Review', percent: 2, count: 1, color: 'from-rose-500 to-pink-500', glow: 'shadow-rose-500/30' },
  ];

  const rubricCriteria = [
    { title: 'Conceptual Definition', match: 94, weight: '40%' },
    { title: 'Mathematical Derivation', match: 86, weight: '35%' },
    { title: 'Algorithmic Complexity', match: 88, weight: '25%' },
  ];

  return (
    <div className="glass-card gradient-border-glow rounded-3xl p-4 sm:p-5 shadow-xl border border-white/40 dark:border-slate-800 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header and Chart Switcher Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>Evaluator Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Live AI Metrics & Scoring</p>
          </div>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveChart('grades');
              soundEffects.playScanTick();
            }}
            className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all touch-press ${
              activeChart === 'grades'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Grades
          </button>
          <button
            onClick={() => {
              setActiveChart('rubric');
              soundEffects.playScanTick();
            }}
            className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all touch-press ${
              activeChart === 'rubric'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rubrics
          </button>
          <button
            onClick={() => {
              setActiveChart('velocity');
              soundEffects.playScanTick();
            }}
            className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all touch-press ${
              activeChart === 'velocity'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Speed
          </button>
        </div>
      </div>

      {/* CHART 1: Animated Grade Distribution Bars */}
      {activeChart === 'grades' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-end justify-between h-36 pt-4 pb-2 px-2 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800">
            {gradeData.map((item, idx) => {
              const isSelected = selectedBar === idx;
              return (
                <div
                  key={item.grade}
                  onClick={() => {
                    setSelectedBar(isSelected ? null : idx);
                    soundEffects.playScanTick();
                  }}
                  className="flex flex-col items-center flex-1 mx-1 cursor-pointer group touch-press"
                >
                  {/* Tooltip / value */}
                  <div
                    className={`text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 transition-all ${
                      isSelected ? 'scale-110 text-brand-600 dark:text-brand-400' : 'opacity-80'
                    }`}
                  >
                    {item.percent}%
                  </div>

                  {/* Animated Bar with gradient & glowing effect */}
                  <div className="w-full max-w-[28px] bg-slate-200 dark:bg-slate-800 rounded-t-xl h-24 flex items-end p-0.5 overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg bg-gradient-to-t ${item.color} shadow-md ${item.glow} transition-all duration-700 ease-out`}
                      style={{
                        height: animated ? `${item.percent * 2.2}%` : '0%',
                        transitionDelay: `${idx * 80}ms`,
                      }}
                    />
                  </div>

                  {/* X-axis Label */}
                  <div
                    className={`mt-1.5 text-[10px] font-bold transition-colors ${
                      isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.grade}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Bar Summary Card */}
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              {selectedBar !== null
                ? `Grade ${gradeData[selectedBar].grade}: ${gradeData[selectedBar].count} scripts verified`
                : 'Tap any bar for specific script distribution'}
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400 text-[11px] flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Avg: 78.4%</span>
            </span>
          </div>
        </div>
      )}

      {/* CHART 2: Animated Rubric Attainment Donut Ring */}
      {activeChart === 'rubric' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-around py-2 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 px-3">
            {/* Animated SVG Donut Ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-800"
                />
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="rubricRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                {/* Animated Foreground Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="url(#rubricRingGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="238.76"
                  strokeDashoffset={animated ? '26' : '238.76'}
                  style={{
                    transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  89.2%
                </span>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                  Attainment
                </span>
              </div>
            </div>

            {/* Criteria breakdown */}
            <div className="space-y-1.5 flex-1 pl-3">
              {rubricCriteria.map((c, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                      {c.title}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.match}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-1000 ease-out"
                      style={{
                        width: animated ? `${c.match}%` : '0%',
                        transitionDelay: `${i * 150}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Semantic Rubric Confidence: 99.4% cross-validation</span>
          </div>
        </div>
      )}

      {/* CHART 3: Evaluation Speed & Velocity Sparkline */}
      {activeChart === 'velocity' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Evaluation Throughput
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <span>28 scripts/hr</span>
              </span>
            </div>

            {/* SVG Wave Sparkline */}
            <div className="h-20 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 70">
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Wave Area Fill */}
                <path
                  d="M0,50 Q40,20 80,45 T160,25 T240,15 L240,70 L0,70 Z"
                  fill="url(#waveGrad)"
                />
                {/* Wave Line */}
                <path
                  d="M0,50 Q40,20 80,45 T160,25 T240,15"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Pulsing point on current velocity */}
                <circle cx="240" cy="15" r="4.5" fill="#4f46e5" className="animate-ping opacity-75" />
                <circle cx="240" cy="15" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
            <span>OCR Latency: 1.2s / page</span>
            <span className="text-brand-600 dark:text-brand-400 font-semibold">10x faster than manual</span>
          </div>
        </div>
      )}
    </div>
  );
};
