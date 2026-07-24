import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Sparkles, Calendar, BookOpen, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import toast from 'react-hot-toast';

const SavedPlansModal = ({ isOpen, onClose, onApplyPlan }) => {
  const [plans, setPlans] = useStorage('studyos_study_plans', []);

  if (!isOpen) return null;

  const handleDelete = (planId) => {
    setPlans((prev) => (prev || []).filter((p) => p.id !== planId));
    toast.success('Saved plan removed.');
  };

  const handleApply = (plan) => {
    if (!plan || !plan.plan) return;
    onApplyPlan(plan.plan);
    toast.success('AI Plan applied to your Weekly Planner!');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Saved AI Study Plans</h2>
              <p className="text-xs text-slate-400 mt-0.5">Library of your generated study strategies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {!plans || plans.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Saved Plans Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Generate a study plan using the AI Plan Wizard to save customized routines here.
              </p>
            </div>
          ) : (
            plans.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                      {item.subjects || 'General Study Plan'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                      <Calendar size={12} /> Created {new Date(item.dateCreated).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      title="Delete saved plan"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleApply(item)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
                    >
                      Apply to Weekly Planner <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {item.plan && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Daily Focus:</span>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-3">{item.plan.dailyPlan}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Milestones:</span>
                      <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                        {(item.plan.weeklyRoadmap || []).slice(0, 3).map((m, idx) => (
                          <li key={idx} className="truncate flex items-center gap-1.5">
                            <CheckCircle2 size={11} className="text-purple-500 shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default SavedPlansModal;
