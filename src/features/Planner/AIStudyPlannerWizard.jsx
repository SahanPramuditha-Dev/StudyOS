import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, BookOpen, Target, Loader2, Save } from 'lucide-react';
import { generateStudyPlan } from '../../services/aiService';
import toast from 'react-hot-toast';
import { useStorage } from '../../hooks/useStorage';
import ReactMarkdown from 'react-markdown';
import Select from '../../components/ui/Select';

const AIStudyPlannerWizard = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useStorage('studyos_study_plans', []);

  const [formData, setFormData] = useState({
    subjects: '',
    exams: '',
    hours: '10',
    goals: 'Balanced mix of theory and practice',
  });

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!formData.subjects.trim()) {
      toast.error('Please enter at least one subject!');
      return;
    }
    setLoading(true);
    try {
      const planResult = await generateStudyPlan(formData);
      setResult(planResult);
      setStep(3);
    } catch (err) {
      toast.error('Failed to generate study plan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (result) {
      const newPlan = {
        id: `plan-${Date.now()}`,
        dateCreated: new Date().toISOString(),
        subjects: formData.subjects,
        plan: result
      };
      setPlans([newPlan, ...plans]);
      toast.success('Study plan saved!');
      onClose();
      // Reset state for next open
      setTimeout(() => {
        setStep(1);
        setResult(null);
        setFormData({ subjects: '', exams: '', hours: '10', goals: 'Balanced mix of theory and practice' });
      }, 500);
    }
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
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">AI Study Planner</h2>
              <p className="text-xs text-slate-400 mt-0.5">Let Orion generate your perfect schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14} /> Subjects / Topics
                  </label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 outline-none dark:text-white"
                    placeholder="e.g. Calculus, Organic Chemistry, World History"
                    value={formData.subjects}
                    onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> Exam Dates / Deadlines
                  </label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 outline-none dark:text-white"
                    placeholder="e.g. Midterms next Friday, Final project on Dec 15"
                    value={formData.exams}
                    onChange={e => setFormData({ ...formData, exams: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Target size={14} /> Hours / Week
                    </label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 outline-none dark:text-white"
                      value={formData.hours}
                      onChange={e => setFormData({ ...formData, hours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Difficulty / Goal
                    </label>
                    <Select
                      value={formData.goals}
                      onChange={val => setFormData({ ...formData, goals: val })}
                      options={[
                        { label: 'Balanced mix of theory and practice', value: 'Balanced mix of theory and practice' },
                        { label: 'Intense cramming (Urgent)', value: 'Intense cramming (Urgent)' },
                        { label: 'Deep foundational learning', value: 'Deep foundational learning' },
                        { label: 'Exam focused (Heavy practice)', value: 'Exam focused (Heavy practice)' }
                      ]}
                      className="w-full text-slate-850 dark:text-slate-350 font-bold"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98]"
                >
                  Review Constraints
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 text-center py-6">
                <div className="mx-auto w-20 h-20 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4 shadow-inner">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Ready to Generate</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                    Orion will create a customized daily plan, a weekly roadmap, and a revision schedule based on your inputs.
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors">
                    Back
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-[2] py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
                    ) : (
                      'Generate Plan'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && result && (
              <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/30">
                    <h4 className="text-sm font-black text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-widest">Daily Routine</h4>
                    <p className="text-blue-900 dark:text-blue-200 text-sm leading-relaxed">{result.dailyPlan}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/30">
                    <h4 className="text-sm font-black text-indigo-800 dark:text-indigo-300 mb-3 uppercase tracking-widest">Weekly Roadmap</h4>
                    <ul className="space-y-2">
                      {result.weeklyRoadmap.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-indigo-900 dark:text-indigo-200">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30">
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-widest">Revision Schedule</h4>
                    <p className="text-emerald-900 dark:text-emerald-200 text-sm leading-relaxed">{result.revisionSchedule}</p>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Plan to Library
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default AIStudyPlannerWizard;
