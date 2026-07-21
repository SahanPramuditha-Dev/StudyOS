import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FlaskConical, LayoutList, X, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { summarizeText, generateFlashcards, generateGeminiResponse } from '../../../services/aiService';
import toast from 'react-hot-toast';

const ACTIONS = [
  {
    key: 'summarize',
    label: 'Summarize',
    Icon: BookOpen,
    color: 'text-violet-400',
    ring: 'ring-violet-500/30',
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    activeBg: 'bg-violet-500/25',
  },
  {
    key: 'quiz',
    label: 'Quiz Me',
    Icon: FlaskConical,
    color: 'text-sky-400',
    ring: 'ring-sky-500/30',
    bg: 'bg-sky-500/10 hover:bg-sky-500/20',
    activeBg: 'bg-sky-500/25',
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    Icon: LayoutList,
    color: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    activeBg: 'bg-emerald-500/25',
  },
];

const AINotesToolbar = ({ noteContent = '', noteTitle = '' }) => {
  const [loadingKey, setLoadingKey] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [result, setResult] = useState('');

  const handleAction = async (key) => {
    if ((noteContent || '').trim().length < 20) {
      toast.error('Write some notes first for Orion to analyze!');
      return;
    }

    // If already showing this panel, toggle it off
    if (activeKey === key && !loadingKey) {
      setActiveKey(null);
      setResult('');
      return;
    }

    setLoadingKey(key);
    setActiveKey(key);
    setResult('');

    try {
      let text = '';
      if (key === 'summarize') {
        text = await summarizeText(noteContent);
      } else if (key === 'flashcards') {
        text = await generateFlashcards(noteContent);
      } else if (key === 'quiz') {
        const quizPrompt = `Generate 3 multiple-choice questions (MCQ) based on these notes. Format each as:
Q: [question]
a) option  b) option  c) option  d) option
Answer: [letter] - [brief explanation]

Notes: ${noteContent.slice(0, 3000)}`;
        text = await generateGeminiResponse(quizPrompt, null, 'general');
      }
      setResult(text);
    } catch (err) {
      toast.error('Orion ran into an error. Please try again.');
      console.error('AINotesToolbar error:', err);
      setActiveKey(null);
      setResult('');
    } finally {
      setLoadingKey(null);
    }
  };

  const closePanel = () => {
    setActiveKey(null);
    setResult('');
  };

  const activeAction = ACTIONS.find((a) => a.key === activeKey);

  return (
    <div className="px-6 lg:px-8 py-3 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Header label */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles size={12} className="text-amber-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
          Orion AI
        </span>
      </div>

      {/* Toolbar buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {ACTIONS.map(({ key, label, Icon, color, bg, activeBg, ring }) => {
          const isLoading = loadingKey === key;
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              onClick={() => handleAction(key)}
              disabled={!!loadingKey}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                transition-all duration-200 ring-1
                disabled:opacity-60 disabled:cursor-not-allowed
                ${ring}
                ${isActive ? activeBg : bg}
              `}
            >
              {isLoading ? (
                <Loader2 size={13} className={`${color} animate-spin`} />
              ) : (
                <Icon size={13} className={color} />
              )}
              <span className={`${color}`}>{isLoading ? 'Thinking\u2026' : label}</span>
            </button>
          );
        })}
      </div>

      {/* Result panel */}
      <AnimatePresence>
        {activeKey && result && (
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="relative rounded-xl border p-4"
              style={{
                background: 'rgba(8, 14, 32, 0.92)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {activeAction && (
                    <activeAction.Icon size={13} className={activeAction.color} />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {activeAction?.label}
                  </span>
                </div>
                <button
                  onClick={closePanel}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Markdown content */}
              <div className="prose prose-sm prose-invert max-w-none max-h-72 overflow-y-auto pr-1 text-slate-200">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AINotesToolbar;
