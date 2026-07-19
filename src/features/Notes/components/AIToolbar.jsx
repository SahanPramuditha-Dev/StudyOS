import React from 'react';
import { Sparkles, Type, CheckCircle, BrainCircuit } from 'lucide-react';
import toast from 'react-hot-toast';

const AIToolbar = ({ onAction, isProcessing }) => {
  const tools = [
    { id: 'summarize', icon: CheckCircle, label: 'Summarize', description: 'Condense into key bullet points' },
    { id: 'explain', icon: BrainCircuit, label: 'Explain like I\'m 5', description: 'Simplify complex concepts' },
    { id: 'expand', icon: Sparkles, label: 'Expand', description: 'Add depth and details' },
    { id: 'grammar', icon: Type, label: 'Improve Writing', description: 'Fix grammar and tone' },
    { id: 'flashcards', icon: Sparkles, label: 'Generate Flashcards', description: 'Create Q&A pairs for active recall' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 lg:p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
      <div className="flex items-center gap-2 mr-2">
        <Sparkles size={16} className="text-indigo-500 animate-pulse" />
        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">AI Tools</span>
      </div>
      
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onAction(tool.id)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
          title={tool.description}
        >
          <tool.icon size={14} className="group-hover:scale-110 transition-transform" />
          <span>{tool.label}</span>
        </button>
      ))}
      
      {isProcessing && (
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );
};

export default AIToolbar;
