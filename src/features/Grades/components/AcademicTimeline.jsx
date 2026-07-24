import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Archive, MoreVertical, BookOpen, TrendingUp, X, Check, Calendar, ChevronRight, GraduationCap } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade } from '../utils/gradeCalculations';
import { isSchoolMode, getTermLabel } from '../utils/gradeCenter';

const AcademicTimeline = ({ gcSettings, selectedYear = 'All' }) => {
  const [allSemesters, setSemesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);
  const [allCourses, setCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);

  const semesters = selectedYear === 'All' 
    ? allSemesters 
    : allSemesters.filter(s => s.year === selectedYear);

  const courses = selectedYear === 'All'
    ? allCourses
    : allCourses.filter(c => {
        const sem = allSemesters.find(s => s.id === c.semesterId);
        return sem && sem.year === selectedYear;
      });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState(null);
  const [modalForm, setModalForm] = useState({ title: '', year: new Date().getFullYear().toString(), targetGpa: '' });
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetSemester, setAssignTargetSemester] = useState(null);
  
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateTitle, setQuickCreateTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [selectedSemDetails, setSelectedSemDetails] = useState(null);

  const isSchool = isSchoolMode(gcSettings);
  const termLabel = getTermLabel(gcSettings);

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

  const handleQuickCreateCourse = () => {
    if (!quickCreateTitle.trim()) return;
    const newCourse = {
      id: nanoid(),
      title: quickCreateTitle,
      credits: 3,
      instructor: '',
      color: '#3b82f6',
      progress: 0,
      tasks: 0,
      semesterId: assignTargetSemester,
      createdAt: new Date().toISOString()
    };
    setCourses([...courses, newCourse]);
    setQuickCreateTitle('');
    setQuickCreateOpen(false);
    setAssignModalOpen(false);
  };

  const handleRemoveCourse = (courseId) => {
    const updatedCourses = courses.map(c => c.id === courseId ? { ...c, semesterId: null } : c);
    setCourses(updatedCourses);
  };

  const handleDeleteSemester = (id) => {
    if (confirm(`Are you sure you want to delete this ${termLabel.toLowerCase()}?`)) {
       setSemesters(semesters.filter(s => s.id !== id));
       // Unassign courses in this semester
       setCourses(courses.map(c => c.semesterId === id ? { ...c, semesterId: null } : c));
    }
    setActiveMenuId(null);
  };

  const handleSetCurrent = (id) => {
    setSemesters(semesters.map(s => ({
      ...s,
      isCurrent: s.id === id ? !s.isCurrent : false
    })));
    setActiveMenuId(null);
  };

  const toggleMenu = (id) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const getSeasonalTheme = (title) => {
    const t = title.toLowerCase();
    if (t.includes('fall') || t.includes('autumn')) return { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600', border: 'border-amber-100 dark:border-amber-900/30', icon: '🍂' };
    if (t.includes('spring')) return { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-600', border: 'border-pink-100 dark:border-pink-900/30', icon: '🌸' };
    if (t.includes('summer')) return { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600', border: 'border-orange-100 dark:border-orange-900/30', icon: '☀️' };
    if (t.includes('winter')) return { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600', border: 'border-blue-100 dark:border-blue-900/30', icon: '❄️' };
    return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600', border: 'border-slate-100 dark:border-slate-800', icon: '📅' };
  };

  const getCourseGrade = (courseId) => {
    return calculateCourseGrade(courseId, assignments);
  };

  // Group semesters by year
  const years = Array.from(new Set(semesters.map(s => s.year))).sort((a, b) => b - a);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Top Action Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white">Academic Timeline</h3>
           <p className="text-sm text-slate-500 font-medium">Manage and review your semesters and term schedules.</p>
        </div>
        <button
          onClick={() => { setEditingSemesterId(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={16} /> Add {termLabel}
        </button>
      </div>

      {years.length === 0 ? (
         <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm">
            <Calendar size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold">No academic periods tracked yet.</p>
            <p className="text-slate-400 text-sm mt-1">Add your first {termLabel.toLowerCase()} to begin planning.</p>
         </div>
      ) : (
         years.map(year => {
            const sems = semesters.filter(s => s.year === year);
            return (
              <div key={year} className="space-y-6">
                <div className="flex items-center gap-4">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Academic Year {year}</h3>
                   <div className="h-px bg-slate-100 dark:bg-slate-800/80 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {sems.map(sem => {
                      const semCourses = courses.filter(c => c.semesterId === sem.id);
                      let semTotalPoints = 0;
                      let semTotalCredits = 0;
                      let semTotalPercent = 0;
                      let semGradedCount = 0;

                      const semCourseData = semCourses.map(c => {
                         const { currentGrade, gpaValue, rawPercentage, totalWeight } = getCourseGrade(c.id);
                         if (totalWeight > 0) {
                            const creds = c.credits || 3;
                            semTotalPoints += gpaValue * creds;
                            semTotalCredits += creds;
                            semTotalPercent += rawPercentage;
                            semGradedCount++;
                         }
                         return { ...c, currentGrade, rawPercentage };
                      });

                      const semGpa = semTotalCredits > 0 ? (semTotalPoints / semTotalCredits).toFixed(2) : '0.00';
                      const semAvg = semGradedCount > 0 ? `${Math.round(semTotalPercent / semGradedCount)}%` : '--';

                      const theme = getSeasonalTheme(sem.title);
                      const isCurrentClass = sem.isCurrent ? 'border-l-4 border-l-blue-500' : '';
                      const borderClass = theme ? theme.border : 'border-slate-200 dark:border-slate-700';
                      
                      return (
                        <div 
                          key={sem.id} 
                          onClick={() => setSelectedSemDetails({ sem, semCourseData, semGpa, semAvg, semTotalCredits })}
                          className={`rounded-2xl border ${borderClass} bg-white dark:bg-slate-900 p-5 group relative ${isCurrentClass} flex flex-col cursor-pointer hover:shadow-md transition-all`}
                        >
                           <div className="flex justify-between items-start mb-6" onClick={e => e.stopPropagation()}>
                              <div className="flex items-start gap-3">
                                 {theme && (
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${theme.bg}`}>
                                      {theme.icon}
                                   </div>
                                 )}
                                 <div>
                                    <h4 className="font-black text-lg text-slate-900 dark:text-white mb-1">{sem.title}</h4>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${sem.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                                       {sem.isCurrent ? 'Current' : termLabel}
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
                                        Edit {termLabel}
                                      </button>
                                      <button onClick={() => handleSetCurrent(sem.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        {sem.isCurrent ? 'Remove Current Status' : 'Set as Current'}
                                      </button>
                                      <button onClick={() => handleDeleteSemester(sem.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        Delete {termLabel}
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                           </div>
                           
                           <div className="space-y-2 mb-6 min-h-[80px] flex-1">
                              {semCourseData.length === 0 ? (
                                 <div className="flex flex-col items-center justify-center pt-6 pb-2" onClick={e => e.stopPropagation()}>
                                    <p className="text-xs text-slate-400 italic text-center mb-3">No courses assigned.</p>
                                    <button onClick={() => { setAssignTargetSemester(sem.id); setAssignModalOpen(true); }} className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                      + Assign Course
                                    </button>
                                 </div>
                              ) : (
                                 semCourseData.slice(0, 3).map(c => (
                                   <div key={c.id} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                      <BookOpen size={16} className="text-blue-500 flex-shrink-0" />
                                      <span className="line-clamp-1 flex-1">{c.title}</span>
                                      <span className="font-black text-slate-900 dark:text-white mr-2">
                                        {isSchool ? (c.rawPercentage > 0 ? `${Math.round(c.rawPercentage)}%` : '--') : c.currentGrade}
                                      </span>
                                   </div>
                                 ))
                              )}
                              {semCourseData.length > 3 && (
                                 <p className="text-[11px] text-slate-400 font-bold pl-2">+{semCourseData.length - 3} more subjects</p>
                              )}
                           </div>
                           
                           <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500">
                                {isSchool ? `${semCourseData.length} Subjects` : `${semTotalCredits} Credits`}
                              </span>
                              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-base">
                                 <span>{isSchool ? 'Avg:' : 'GPA:'}</span>
                                 <span className={isSchool ? 'text-blue-500' : 'text-green-500'}>
                                   {isSchool ? semAvg : semGpa}
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

      {/* Detail Slideover/Modal for selected Term/Semester */}
      <AnimatePresence>
         {selectedSemDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }} 
                 className="absolute inset-0" 
                 onClick={() => setSelectedSemDetails(null)} 
               />
               <motion.div 
                 initial={{ x: '100%' }} 
                 animate={{ x: 0 }} 
                 exit={{ x: '100%' }} 
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 p-6 shadow-2xl flex flex-col justify-between"
               >
                  <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                     <div className="flex justify-between items-start">
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedSemDetails.sem.title}</h2>
                           <p className="text-sm font-bold text-slate-500 mt-1">Year {selectedSemDetails.sem.year} Summary</p>
                        </div>
                        <button onClick={() => setSelectedSemDetails(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{isSchool ? 'Average' : 'Term GPA'}</p>
                           <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                             {isSchool ? selectedSemDetails.semAvg : selectedSemDetails.semGpa}
                           </h3>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{isSchool ? 'Subjects' : 'Credits'}</p>
                           <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                             {isSchool ? selectedSemDetails.semCourseData.length : selectedSemDetails.semTotalCredits}
                           </h3>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Courses & Grades</h4>
                        <div className="space-y-3">
                           {selectedSemDetails.semCourseData.length === 0 ? (
                              <p className="text-sm text-slate-500 italic">No courses in this term.</p>
                           ) : (
                              selectedSemDetails.semCourseData.map(c => (
                                 <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                       <BookOpen className="text-blue-500" size={18} />
                                       <div>
                                          <p className="font-bold text-slate-900 dark:text-white text-sm">{c.title}</p>
                                          <p className="text-xs text-slate-500">{c.credits} Credits</p>
                                       </div>
                                    </div>
                                    <span className="font-black text-base text-slate-850 dark:text-slate-150">
                                      {isSchool ? (c.rawPercentage > 0 ? `${Math.round(c.rawPercentage)}%` : '--') : c.currentGrade}
                                    </span>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                     <button 
                       onClick={() => {
                         setAssignTargetSemester(selectedSemDetails.sem.id);
                         setAssignModalOpen(true);
                         setSelectedSemDetails(null);
                       }}
                       className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-all"
                     >
                        Assign Courses
                     </button>
                     <button 
                       onClick={() => setSelectedSemDetails(null)}
                       className="px-5 py-3 border border-slate-200 dark:border-slate-800 font-bold rounded-xl text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                     >
                        Close
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Semester/Term Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{editingSemesterId ? `Edit ${termLabel}` : `Add ${termLabel}`}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingSemesterId(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{termLabel} Title</label>
                  <input type="text" placeholder={`e.g. Fall 2026, ${termLabel} 1`} value={modalForm.title} onChange={e => setModalForm({...modalForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Year</label>
                    <select 
                      value={modalForm.year} 
                      onChange={e => setModalForm({...modalForm, year: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {Array.from({ length: 16 }, (_, i) => 2020 + i).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target {isSchool ? 'Average %' : 'GPA'}</label>
                    <input type="number" step={isSchool ? '1' : '0.1'} max={isSchool ? '100' : '4.0'} placeholder={isSchool ? 'e.g. 85' : 'e.g. 3.8'} value={modalForm.targetGpa} onChange={e => setModalForm({...modalForm, targetGpa: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button onClick={() => { setIsModalOpen(false); setEditingSemesterId(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancel</button>
                <button onClick={handleAddSemester} disabled={!modalForm.title || !modalForm.year} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2">
                  <Check size={18} /> {editingSemesterId ? 'Save Changes' : `Create ${termLabel}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Course Modal */}
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
                
                {quickCreateOpen ? (
                   <div className="p-3 mt-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Course Name..."
                        value={quickCreateTitle}
                        onChange={(e) => setQuickCreateTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold mb-2 outline-none focus:border-blue-500"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCreateCourse(); }}
                      />
                      <div className="flex justify-end gap-2">
                         <button onClick={() => setQuickCreateOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                         <button onClick={handleQuickCreateCourse} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold">Create</button>
                      </div>
                   </div>
                ) : (
                   <button 
                     onClick={() => setQuickCreateOpen(true)} 
                     className="w-full mt-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
                   >
                     <Plus size={16} /> Create New Course
                   </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AcademicTimeline;
