import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, Trash2, Award, BookOpen, Star, Sparkles } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { isSchoolMode } from '../utils/gradeCenter';

const GoalsTab = ({ gcSettings }) => {
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [goalsState, setGoalsState] = useStorage(STORAGE_KEYS.GOALS, {
    dailyStudyGoal: 120,
    weeklyMinutesGoal: 600,
    weeklySessionsGoal: 7,
    sessionsByDate: {},
    smartGoalText: '',
    academicGoals: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    type: 'subject_grade', // 'subject_grade' | 'gpa' | 'rank' | 'exam'
    courseId: '',
    title: '',
    targetVal: '',
    currentVal: ''
  });

  const isSchool = isSchoolMode(gcSettings);

  const handleAddGoal = (e) => {
    e.preventDefault();
    
    let constructedTitle = modalForm.title;
    if (modalForm.type === 'subject_grade') {
      const courseName = courses.find(c => c.id === modalForm.courseId)?.title || 'Subject';
      constructedTitle = `Achieve target grade in ${courseName}`;
    } else if (modalForm.type === 'gpa') {
      constructedTitle = `Achieve CGPA target of ${modalForm.targetVal}`;
    } else if (modalForm.type === 'rank') {
      constructedTitle = `Reach Class Rank ${modalForm.targetVal}`;
    }

    const newGoal = {
      id: Date.now().toString(),
      type: 'academic',
      goalType: modalForm.type,
      courseId: modalForm.courseId,
      title: constructedTitle,
      targetValue: Number(modalForm.targetVal) || 0,
      currentValue: Number(modalForm.currentVal) || 0,
      createdAt: new Date().toISOString()
    };

    const currentAcademic = Array.isArray(goalsState?.academicGoals) ? goalsState.academicGoals : [];

    setGoalsState({
      ...goalsState,
      academicGoals: [...currentAcademic, newGoal]
    });
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setModalForm({
      type: 'subject_grade',
      courseId: courses[0]?.id || '',
      title: '',
      targetVal: '',
      currentVal: ''
    });
  };

  const handleDeleteGoal = (id) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      const currentAcademic = Array.isArray(goalsState?.academicGoals) ? goalsState.academicGoals : [];
      setGoalsState({
        ...goalsState,
        academicGoals: currentAcademic.filter(g => g.id !== id)
      });
    }
  };

  const academicGoals = Array.isArray(goalsState?.academicGoals) ? goalsState.academicGoals : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex justify-between items-center">
        <div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white">Academic Goals</h3>
           <p className="text-sm text-slate-500 font-medium">Keep track of your targets: overall CGPA, subject grades, or exam performance.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Goals Grid list */}
      {academicGoals.length === 0 ? (
         <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm">
            <Target size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold">No academic goals configured yet.</p>
            <p className="text-slate-400 text-sm mt-1">Set a target grade or GPA goal to keep yourself motivated!</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {academicGoals.map(goal => {
               const progress = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
               return (
                  <div key={goal.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden h-40">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                              <Target size={20} />
                           </div>
                           <div>
                              <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">{goal.title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Goal Target</p>
                           </div>
                        </div>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                           <Trash2 size={16} />
                        </button>
                     </div>

                     <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                           <span>Current: {goal.currentValue} / Target: {goal.targetValue}</span>
                           <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full">
                           <div 
                              className="bg-blue-500 h-2.5 rounded-full transition-all" 
                              style={{ width: `${progress}%` }}
                           />
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      )}

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Create Academic Goal</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-655 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddGoal} className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Goal Type</label>
                   <select
                      value={modalForm.type}
                      onChange={e => setModalForm({ ...modalForm, type: e.target.value, title: '' })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                   >
                      <option value="subject_grade">Improve Subject Grade</option>
                      {!isSchool && <option value="gpa">GPA Target</option>}
                      {isSchool && <option value="rank">Class Rank Target</option>}
                   </select>
                </div>

                {modalForm.type === 'subject_grade' && (
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject Link</label>
                      <select
                         required
                         value={modalForm.courseId}
                         onChange={e => setModalForm({ ...modalForm, courseId: e.target.value })}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300"
                      >
                         <option value="" disabled>Select Subject</option>
                         {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Value</label>
                      <input
                         required
                         type="number"
                         step="0.1"
                         placeholder="e.g. 60"
                         value={modalForm.currentVal}
                         onChange={e => setModalForm({ ...modalForm, currentVal: e.target.value })}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Value</label>
                      <input
                         required
                         type="number"
                         step="0.1"
                         placeholder="e.g. 90"
                         value={modalForm.targetVal}
                         onChange={e => setModalForm({ ...modalForm, targetVal: e.target.value })}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold"
                      />
                   </div>
                </div>

                <button type="submit" className="w-full mt-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg">
                   Save Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalsTab;
