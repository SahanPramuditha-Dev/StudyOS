import React from 'react';
import { BookOpen, FileText, Code2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TEMPLATES = [
  {
    id: 'university',
    title: 'University Project',
    description: 'A structured environment for academic assignments and group projects.',
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-900',
    docs: ['Requirements', 'Research', 'Documentation', 'Draft', 'Final Report'],
    tasks: ['Literature Search', 'Outline', 'First Draft', 'Review', 'Submission']
  },
  {
    id: 'research',
    title: 'Research Paper',
    description: 'Optimized for deep research, literature reviews, and thesis writing.',
    icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-900',
    docs: ['Abstract', 'Literature Review', 'Methodology', 'Results', 'References'],
    tasks: ['Gather Sources', 'Analyze Data', 'Write Intro', 'Draft Conclusion']
  },
  {
    id: 'programming',
    title: 'Programming Project',
    description: 'Perfect for software development, coding assignments, and hackathons.',
    icon: Code2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-900',
    docs: ['README', 'Architecture', 'API Specs', 'Testing Plan'],
    tasks: ['Setup Environment', 'Implement Core Logic', 'Write Tests', 'Deploy']
  }
];

const WorkspaceTemplates = ({ onSelectTemplate }) => {
  return (
    <div className="py-12 px-6 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
          Start a new Workspace
        </h2>
        <p className="text-slate-400 font-medium text-sm max-w-lg mx-auto">
          Choose a quick-start template to automatically scaffold your project with the right structure, folders, and documents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEMPLATES.map((template, index) => (
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative flex flex-col text-left bg-white/50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-xl hover:shadow-primary-500/5 overflow-hidden hover:-translate-y-1 duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className={`w-12 h-12 rounded-2xl ${template.bg} ${template.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <template.icon size={22} />
            </div>
            
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-2 group-hover:text-primary-500 transition-colors uppercase tracking-tight">
              {template.title}
            </h3>
            
            <p className="text-slate-400 text-xs font-semibold mb-6 flex-1 leading-relaxed">
              {template.description}
            </p>

            <div className="space-y-4 w-full relative z-10">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Scope of delivery</span>
                <div className="flex flex-wrap gap-1.5">
                  {template.docs.slice(0, 3).map(doc => (
                    <span key={doc} className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider rounded-lg border border-slate-100 dark:border-slate-800/85">
                      {doc}
                    </span>
                  ))}
                  {template.docs.length > 3 && (
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider rounded-lg border border-slate-100 dark:border-slate-800/85">
                      +{template.docs.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary-500 transition-colors relative z-10">
              <span>Use Template</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceTemplates;
