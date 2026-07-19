import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Archive, MoreVertical, BookOpen, TrendingUp, X, Check, Calendar } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';

const SemesterManagement = () => {
  const [semesters, setSemesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState(null);
  const [modalForm, setModalForm] = useState({ title: '', year: new Date().getFullYear().toString(), targetGpa: '' });
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetSemester, setAssignTargetSemester] = useState(null);

  const openEditModal = (semester) => {
    setEditingSemesterId(semester.id);
    setModalForm({ title: semester.title, year: semester.year, targetGpa: semester.targetGpa || '' });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleAddSemester = () => {
    if (!modalForm.title || !modalForm.year) return;
    
    if (editingSemesterId) {
       setSemesters(semesters.map(s => s.id === editingSemesterId ? {
          ...s,
          title: modalForm.title,
          year: modalForm.year,
          targetGpa: modalForm.targetGpa
       } : s));
    } else {
       setSemesters([...semesters, {
          id: nanoid(),
          title: modalForm.title,
          year: modalForm.year,
          targetGpa: modalForm.targetGpa,
          isArchived: false,
          isCurrent: false,
          createdAt: new Date().toISOString()
       }]);
    }
    
    setIsModalOpen(false);
    setEditingSemesterId(null);
    setModalForm({ title: '', year: new Date().getFullYear().toString(), targetGpa: '' });
  };

  const handleAssignCourse = (courseId) => {
    const updatedCourses = courses.map(c => c.id === courseId ? { ...c, semesterId: assignTargetSemester } : c);
    setCourses(updatedCourses);
  };
  
  const handleRemoveCourse = (courseId) => {
    const updatedCourses = courses.map(c => c.id === courseId ? { ...c, semesterId: null } : c);
    setCourses(updatedCourses);
  };

  const getSeasonalTheme = (title) => {
     const lower = title.toLowerCase();
     if (lower.includes('fall') || lower.includes('autumn')) return { icon: '🍂', border: 'border-orange-500/20', bg: 'bg-orange-50 dark:bg-orange-900/10' };
     if (lower.includes('spring')) return { icon: '🌸', border: 'border-pink-500/20', bg: 'bg-pink-50 dark:bg-pink-900/10' };
     if (lower.includes('summer')) return { icon: '☀️', border: 'border-amber-500/20', bg: 'bg-amber-50 dark:bg-amber-900/10' };
     if (lower.includes('winter')) return { icon: '❄️', border: 'border-cyan-500/20', bg: 'bg-cyan-50 dark:bg-cyan-900/10' };
     return null;
  };

  const [activeMenuId, setActiveMenuId] = useState(null);

  const toggleMenu = (id) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleSetCurrent = (id) => {
    setSemesters(semesters.map(s => 
      s.id === id ? { ...s, isCurrent: true } : { ...s, isCurrent: false }
    ));
    setActiveMenuId(null);
  };

  const handleDeleteSemester = (id) => {
    setSemesters(semesters.filter(s => s.id !== id));
    setActiveMenuId(null);
  };

  // Helper to calculate course grades
  const getCourseGrade = (courseId) => {
    const courseAssignments = assignments.filter(a => a.courseId === courseId);
    let totalScore = 0; let totalWeight = 0;
    courseAssignments.forEach(a => {
      const weight = a.weight || Math.round(100 / (courseAssignments.length || 1));
      if (a.marks && a.marks.includes('/')) {
        const [earned, total] = a.marks.split('/').map(Number);
        if (!isNaN(earned) && !isNaN(total) && total > 0) {
           totalScore += (earned / total) * 100 * (weight / 100);
           totalWeight += weight;
        }
      }
    });

    let currentGrade = '--'; let gpaValue = 0;
    if (totalWeight > 0) {
       const normalized = (totalScore / totalWeight) * 100;
       if (normalized >= 90) { currentGrade = 'A+'; gpaValue = 4.0; }
       else if (normalized >= 85) { currentGrade = 'A'; gpaValue = 4.0; }
       else if (normalized >= 80) { currentGrade = 'A-'; gpaValue = 3.7; }
       else if (normalized >= 75) { currentGrade = 'B+'; gpaValue = 3.3; }
       else if (normalized >= 70) { currentGrade = 'B'; gpaValue = 3.0; }
       else if (normalized >= 65) { currentGrade = 'B-'; gpaValue = 2.7; }
       else if (normalized >= 60) { currentGrade = 'C+'; gpaValue = 2.3; }
       else if (normalized >= 50) { currentGrade = 'C'; gpaValue = 2.0; }
       else { currentGrade = 'F'; gpaValue = 0; }
    }
    return { currentGrade, gpaValue };
  };

  // Group semesters by year
  const semestersByYear = semesters.reduce((acc, sem) => {
     if (!acc[sem.year]) acc[sem.year] = [];
     acc[sem.year].push(sem);
     return acc;
  }, {});
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white">Academic Years & Semesters</h2>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            <Plus size={18} /> Add Semester
         </button>
      </div>

      <div className="space-y-8">
         {Object.keys(semestersByYear).length === 0 ? (
            <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Calendar className="text-slate-400" size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Semesters Added</h3>
               <p className="text-slate-500 mb-6">Group your courses by academic periods to track your progress.</p>
               <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                 Create First Semester
               </button>
            </div>
         ) : (
           Object.keys(semestersByYear).sort((a,b) => b.localeCompare(a)).map(year => {
             const sems = semestersByYear[year];
             // Calculate Year GPA
             let yearTotalPoints = 0;
             let yearTotalCredits = 0;

             sems.forEach(sem => {
                const semCourses = courses.filter(c => c.semesterId === sem.id);
                semCourses.forEach(c => {
                   const { gpaValue } = getCourseGrade(c.id);
                   if (gpaValue > 0) {
                      const creds = c.credits || 3;
                      yearTotalPoints += gpaValue * creds;
                      yearTotalCredits += creds;
                   }
                });
             });
             const yearGpa = yearTotalCredits > 0 ? (yearTotalPoints / yearTotalCredits).toFixed(2) : '0.00';

             return (
               <div key={year} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                     <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">Academic Year {year}</h3>
                     <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-slate-500 shadow-sm border border-slate-100 dark:border-slate-800">Year GPA: {yearGpa}</div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     {sems.map(sem => {
                        const semCourses = courses.filter(c => c.semesterId === sem.id);
                        let semTotalPoints = 0;
                        let semTotalCredits = 0;
                        const semCourseData = semCourses.map(c => {
                           const { currentGrade, gpaValue } = getCourseGrade(c.id);
                           if (gpaValue > 0) {
                              const creds = c.credits || 3;
                              semTotalPoints += gpaValue * creds;
                              semTotalCredits += creds;
                           }
                           return { ...c, currentGrade };
                        });
                        const semGpa = semTotalCredits > 0 ? (semTotalPoints / semTotalCredits).toFixed(2) : '0.00';

                        const theme = getSeasonalTheme(sem.title);
                        const isCurrentClass = sem.isCurrent ? 'border-l-4 border-l-blue-500' : '';
                        const borderClass = theme ? theme.border : 'border-slate-200 dark:border-slate-700';
                        
                        return (
                          <div key={sem.id} className={`rounded-2xl border ${borderClass} bg-white dark:bg-slate-900 p-5 group relative ${isCurrentClass} flex flex-col`}>
                             <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-3">
                                   {theme && (
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${theme.bg}`}>
                                        {theme.icon}
                                     </div>
                                   )}
                                   <div>
                                      <h4 className="font-black text-lg text-slate-900 dark:text-white mb-1">{sem.title}</h4>
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${sem.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                                         {sem.isCurrent ? 'Current' : 'Semester'}
                                      </span>
                                   </div>
                                </div>
                                <div className="relative">
                                  <button onClick={() => toggleMenu(sem.id)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                     <MoreVertical size={18} />
                                  </button>
                                  <AnimatePresence>
                                    {activeMenuId === sem.id && (
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
                                      >
                                        <button onClick={() => openEditModal(sem)} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                          Edit Semester
                                        </button>
                                        <button onClick={() => handleSetCurrent(sem.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                          {sem.isCurrent ? 'Remove Current Status' : 'Set as Current'}
                                        </button>
                                        <button onClick={() => handleDeleteSemester(sem.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                          Delete Semester
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                             </div>
                             
                             <div className="space-y-2 mb-6 min-h-[80px] flex-1">
                                {semCourseData.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center pt-6 pb-2">
                                      <p className="text-xs text-slate-400 italic text-center mb-3">No courses assigned.</p>
                                      <button onClick={() => { setAssignTargetSemester(sem.id); setAssignModalOpen(true); }} className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        + Assign Course
                                      </button>
                                   </div>
                                ) : (
                                   semCourseData.map(c => (
                                     <div key={c.id} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group/course transition-colors">
                                        <BookOpen size={16} className="text-blue-500 flex-shrink-0" />
                                        <span className="line-clamp-1 flex-1">{c.title}</span>
                                        <span className="font-black text-slate-900 dark:text-white mr-2">{c.currentGrade}</span>
                                        <button onClick={() => handleRemoveCourse(c.id)} className="opacity-0 group-hover/course:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                                           <X size={14} />
                                        </button>
                                     </div>
                                   ))
                                )}
                             </div>
                             
                             {semCourseData.length > 0 && (
                                <button onClick={() => { setAssignTargetSemester(sem.id); setAssignModalOpen(true); }} className="w-full py-2 mb-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs font-bold transition-all">
                                  + Assign Course
                                </button>
                             )}
                             
                             <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                   <span>{semTotalCredits} Credits</span>
                                   {sem.targetGpa && <span>Target: {sem.targetGpa}</span>}
                                </div>
                                <div className="flex justify-between items-end">
                                   <div className="flex items-center gap-2">
                                      <TrendingUp size={16} className={sem.targetGpa && parseFloat(semGpa) >= parseFloat(sem.targetGpa) ? "text-green-500" : "text-blue-500"} />
                                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GPA</span>
                                   </div>
                                   <span className={`font-black text-2xl ${sem.targetGpa && parseFloat(semGpa) >= parseFloat(sem.targetGpa) ? "text-green-500" : "text-slate-900 dark:text-white"}`}>
                                      {semGpa}
                                   </span>
                                </div>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>
             );
           })
         )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{editingSemesterId ? 'Edit Semester' : 'Add Semester'}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingSemesterId(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester Title</label>
                  <input type="text" placeholder="e.g. Fall 2026, Semester 1" value={modalForm.title} onChange={e => setModalForm({...modalForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Year</label>
                    <input type="text" placeholder="e.g. 2026" value={modalForm.year} onChange={e => setModalForm({...modalForm, year: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target GPA</label>
                    <input type="number" step="0.1" max="4.0" placeholder="e.g. 3.8" value={modalForm.targetGpa} onChange={e => setModalForm({...modalForm, targetGpa: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button onClick={() => { setIsModalOpen(false); setEditingSemesterId(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancel</button>
                <button onClick={handleAddSemester} disabled={!modalForm.title || !modalForm.year} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2">
                  <Check size={18} /> {editingSemesterId ? 'Save Changes' : 'Create Semester'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAssignModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Assign Course</h2>
                <button onClick={() => setAssignModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                {courses.filter(c => !c.semesterId).length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-6">All available courses are already assigned to a semester.</p>
                ) : (
                  courses.filter(c => !c.semesterId).map(course => (
                    <div key={course.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{course.title}</p>
                        <p className="text-xs text-slate-500">{course.credits} Credits</p>
                      </div>
                      <button 
                        onClick={() => { handleAssignCourse(course.id); setAssignModalOpen(false); }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SemesterManagement;
