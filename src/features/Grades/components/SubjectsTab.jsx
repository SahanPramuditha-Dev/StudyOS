import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, CheckSquare, Clock, ArrowLeft, MoreVertical, Plus, FileText, Trash2, X, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade, checkPrerequisites } from '../utils/gradeCalculations';
import { isSchoolMode } from '../utils/gradeCenter';

const SubjectsTab = ({ gcSettings, selectedYear = 'All' }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ title: '', weight: '', score: '', dueDate: '' });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [editCreditsValue, setEditCreditsValue] = useState('3');

  const [allCourses, setCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [tasks, setTasks] = useStorage(STORAGE_KEYS.TASKS, []);
  const [semesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);

  const courses = selectedYear === 'All'
    ? allCourses
    : allCourses.filter(c => {
        const sem = semesters.find(s => s.id === c.semesterId);
        return sem && sem.year === selectedYear;
      });

  const isSchool = isSchoolMode(gcSettings);

  // Map courses to real data
  const realCourses = courses.filter(c => c.semesterId).map(course => {
    const { totalScore, totalWeight, rawPercentage, currentGrade, gpaValue, currentMarks, courseAssignments } = calculateCourseGrade(course.id, assignments);
    const { met, missing } = checkPrerequisites(course.id, course.semesterId, courses, semesters);
    
    const mappedAssessments = courseAssignments.map(a => ({
      id: a.id,
      title: a.title,
      score: a.marks || '--',
      weight: a.weight || Math.round(100 / (courseAssignments.length || 1)),
      status: a.status,
      date: a.date
    }));

    return {
      id: course.id,
      title: course.title,
      credits: course.credits || 3,
      targetGrade: course.targetGrade || (isSchool ? '80' : 'A'),
      currentGrade,
      currentMarks,
      rawPercentage,
      assessments: mappedAssessments,
      prereqsMet: met,
      missingPrereqs: missing,
      color: course.color || '#3b82f6'
    };
  });

  const selectedCourse = realCourses.find(c => c.id === selectedCourseId);

  const handleSaveAssessment = (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const newAssignment = {
      id: Date.now().toString(),
      courseId: selectedCourse.id,
      title: modalForm.title,
      weight: Number(modalForm.weight),
      marks: modalForm.score,
      status: modalForm.score ? 'Completed' : 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    
    setAssignments([...assignments, newAssignment]);

    if (modalForm.dueDate) {
       const newTask = {
         id: Date.now().toString() + '_task',
         title: `Complete ${modalForm.title}`,
         description: `Assessment for ${selectedCourse.title}`,
         courseId: selectedCourse.id,
         priority: 'High',
         dueDate: new Date(modalForm.dueDate).toISOString(),
         status: 'todo',
         type: 'Assignment'
       };
       setTasks([...tasks, newTask]);
    }

    setIsModalOpen(false);
    setModalForm({ title: '', weight: '', score: '', dueDate: '' });
  };

  const handleDeleteAssessment = (id) => {
    if (confirm('Are you sure you want to delete this assessment?')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  // Determine course performance trends
  const getTrendIcon = (course) => {
    if (course.assessments.length < 2) return '→';
    const sorted = [...course.assessments].sort((a,b) => new Date(a.date) - new Date(b.date));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    
    const lastVal = last.score.includes('/') ? (Number(last.score.split('/')[0]) / Number(last.score.split('/')[1])) * 100 : Number(last.score);
    const prevVal = prev.score.includes('/') ? (Number(prev.score.split('/')[0]) / Number(prev.score.split('/')[1])) * 100 : Number(prev.score);
    
    if (lastVal > prevVal) return '↑';
    if (lastVal < prevVal) return '↓';
    return '→';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {!selectedCourseId ? (
        // Grid View of Subjects
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
             <h3 className="text-lg font-black text-slate-900 dark:text-white">Subjects</h3>
             <p className="text-sm text-slate-500 font-medium">Select a subject card to view details, performance trend, resources, and grades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realCourses.map(course => {
              const trend = getTrendIcon(course);
              return (
                <div 
                  key={course.id}
                  onClick={() => { setSelectedCourseId(course.id); setDetailTab('overview'); }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-48 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: course.color }} />
                  
                  <div className="flex justify-between items-start pl-2">
                     <div>
                        <h4 className="font-black text-lg text-slate-900 dark:text-white line-clamp-1">{course.title}</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1">{course.credits} Credits</p>
                     </div>
                     {!course.prereqsMet && (
                        <div className="text-red-500 flex items-center gap-1" title={`Missing prerequisites: ${course.missingPrereqs.join(', ')}`}>
                           <AlertTriangle size={18} />
                        </div>
                     )}
                  </div>

                  <div className="flex justify-between items-end pl-2">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Standing</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-3xl font-black text-slate-900 dark:text-white">
                             {isSchool ? (course.rawPercentage > 0 ? `${Math.round(course.rawPercentage)}%` : '--') : course.currentGrade}
                           </span>
                           {trend !== '→' && (
                              <span className={`text-xs font-bold ${trend === '↑' ? 'text-green-500' : 'text-red-500'}`}>
                                 {trend} {trend === '↑' ? 'Improving' : 'Declining'}
                              </span>
                           )}
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mt-1">{isSchool ? `${course.targetGrade}%` : course.targetGrade}</p>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Detail View of Single Subject
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setSelectedCourseId(null)}
               className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
             >
                <ArrowLeft size={16} />
             </button>
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedCourse.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  {isEditingCredits ? (
                    <select
                      autoFocus
                      value={editCreditsValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCourses(allCourses.map(c => c.id === selectedCourse.id ? { ...c, credits: val } : c));
                        setIsEditingCredits(false);
                      }}
                      onBlur={() => setIsEditingCredits(false)}
                      className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-200 rounded px-1 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map(c => (
                        <option key={c} value={c}>{c} Credits</option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:opacity-85"
                      onClick={() => {
                        setIsEditingCredits(true);
                        setEditCreditsValue(selectedCourse.credits.toString());
                      }}
                    >
                      {selectedCourse.credits} Credits
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  {isEditingTarget ? (
                     <input 
                        type="text" 
                        autoFocus
                        className="w-16 bg-white dark:bg-slate-800 text-xs font-bold text-blue-500 uppercase tracking-widest border border-blue-500 rounded px-1 outline-none"
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(e.target.value)}
                        onBlur={() => {
                           if (editTargetValue) {
                              setCourses(allCourses.map(c => c.id === selectedCourse.id ? { ...c, targetGrade: isSchool ? editTargetValue : editTargetValue.toUpperCase() } : c));
                           }
                           setIsEditingTarget(false);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                     />
                  ) : (
                     <span 
                        className="text-xs font-bold text-blue-500 uppercase tracking-widest cursor-pointer hover:opacity-80"
                        onClick={() => {
                           setIsEditingTarget(true);
                           setEditTargetValue(selectedCourse.targetGrade);
                        }}
                     >
                        Target: {isSchool ? `${selectedCourse.targetGrade}%` : selectedCourse.targetGrade}
                     </span>
                  )}
                </div>
             </div>

             <button 
                onClick={() => setIsModalOpen(true)}
                className="ml-auto flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
             >
                <Plus size={16} /> Add Grade / Result
             </button>
          </div>

          {/* Sub tabs navigation */}
          <div className="flex border-b border-slate-100 dark:border-slate-850 gap-4">
             {['overview', 'marks', 'performance'].map(t => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${detailTab === t ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                   {t}
                </button>
             ))}
          </div>

          <div className="grid grid-cols-1 gap-6">
             {detailTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Standing</p>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                        {isSchool ? (selectedCourse.rawPercentage > 0 ? `${Math.round(selectedCourse.rawPercentage)}%` : '--') : selectedCourse.currentGrade}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-4">Weighted average of completed assessments</p>
                   </div>
                   
                   <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Standing</p>
                      <h3 className="text-4xl font-black text-slate-950 dark:text-slate-50 mt-1">
                        {isSchool ? `${selectedCourse.targetGrade}%` : selectedCourse.targetGrade}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-4">Your personalized goal</p>
                   </div>

                   <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prerequisites Status</p>
                      {selectedCourse.prereqsMet ? (
                         <div className="mt-2 text-green-500 font-bold flex items-center gap-1.5">
                            <Star size={20} /> All Met
                         </div>
                      ) : (
                         <div className="mt-2 text-red-500 font-bold flex flex-col gap-1">
                            <span className="flex items-center gap-1.5"><AlertTriangle size={20} /> Unmet Prerequisites</span>
                            <span className="text-xs text-slate-400 font-medium">Missing: {selectedCourse.missingPrereqs.join(', ')}</span>
                         </div>
                      )}
                      <p className="text-[10px] text-slate-500 mt-4">Curriculum roadmap validation</p>
                   </div>
                </div>
             )}

             {detailTab === 'marks' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                   <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Assessment Breakdown</h3>
                   
                   {selectedCourse.assessments.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-6 text-center">No assessments added to this subject yet.</p>
                   ) : (
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                               <th className="pb-3">Assessment Title</th>
                               <th className="pb-3">Weight</th>
                               <th className="pb-3">Score</th>
                               <th className="pb-3 text-right">Action</th>
                            </tr>
                         </thead>
                         <tbody className="text-sm font-medium text-slate-700 dark:text-slate-350">
                            {selectedCourse.assessments.map(a => (
                               <tr key={a.id} className="border-b border-slate-50 dark:border-slate-850/50">
                                  <td className="py-4 font-bold text-slate-900 dark:text-white">{a.title}</td>
                                  <td className="py-4">{a.weight}%</td>
                                  <td className="py-4 font-black text-blue-500">{a.score}</td>
                                  <td className="py-4 text-right">
                                     <button onClick={() => handleDeleteAssessment(a.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                                        <Trash2 size={16} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   )}
                </div>
             )}

             {detailTab === 'performance' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                   <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Grade Progression</h3>
                   <div className="h-64 w-full">
                      {selectedCourse.assessments.length < 2 ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                            <TrendingUp size={36} className="mb-2 text-slate-200" />
                            Add at least 2 graded assessments to unlock trend analytics.
                         </div>
                      ) : (
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...selectedCourse.assessments].sort((a,b) => new Date(a.date) - new Date(b.date)).map((a, i) => ({
                               name: a.title,
                               score: a.score.includes('/') ? (Number(a.score.split('/')[0]) / Number(a.score.split('/')[1])) * 100 : Number(a.score)
                            }))}>
                               <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                               <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                            </LineChart>
                         </ResponsiveContainer>
                      )}
                   </div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Add Assessment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Add Grade Result</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-655 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                   <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveAssessment} className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assessment Title</label>
                   <input required type="text" placeholder="e.g. Midterm 1, Assignment A" value={modalForm.title} onChange={e => setModalForm({...modalForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weight (%)</label>
                     <input type="number" min="1" max="100" placeholder="e.g. 20" value={modalForm.weight} onChange={e => setModalForm({...modalForm, weight: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Score (Optional)</label>
                     <input type="text" placeholder="e.g. 18/20" value={modalForm.score} onChange={e => setModalForm({...modalForm, score: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold" />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Due Date (Sync to Planner Tasks)</label>
                   <input type="date" value={modalForm.dueDate} onChange={e => setModalForm({...modalForm, dueDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-600 dark:text-slate-300" />
                </div>
                <button type="submit" className="w-full mt-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg">
                   Save Result
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectsTab;
