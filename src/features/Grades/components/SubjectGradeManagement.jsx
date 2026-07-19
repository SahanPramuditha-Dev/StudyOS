import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, CheckSquare, Clock, ArrowLeft, MoreVertical, Plus, FileText, Trash2, X } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';

const SubjectGradeManagement = () => {
  // Mock data for MVP wireframe alignment
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ title: '', weight: '', score: '' });

  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);

  // Map courses to real data
  const realCourses = courses.map(course => {
    const courseAssignments = assignments.filter(a => a.courseId === course.id);
    
    let totalScore = 0;
    let totalWeight = 0;
    
    const mappedAssessments = courseAssignments.map(a => {
      // Mock weight since it's not on the assignment model yet
      const weight = a.weight || Math.round(100 / (courseAssignments.length || 1));
      
      // Try to parse marks like "18/20"
      let parsedScore = 0;
      if (a.marks && a.marks.includes('/')) {
        const [earned, total] = a.marks.split('/').map(Number);
        if (!isNaN(earned) && !isNaN(total) && total > 0) {
           parsedScore = (earned / total) * 100;
           totalScore += parsedScore * (weight / 100);
           totalWeight += weight;
        }
      }
      
      return {
        id: a.id,
        title: a.title,
        score: a.marks || '--',
        weight: weight,
        status: a.status
      };
    });
    
    // Guess grade based on totalScore
    let currentGrade = '--';
    if (totalWeight > 0) {
       const normalized = (totalScore / totalWeight) * 100;
       if (normalized >= 90) currentGrade = 'A+';
       else if (normalized >= 85) currentGrade = 'A';
       else if (normalized >= 80) currentGrade = 'A-';
       else if (normalized >= 75) currentGrade = 'B+';
       else if (normalized >= 70) currentGrade = 'B';
       else if (normalized >= 65) currentGrade = 'B-';
       else if (normalized >= 60) currentGrade = 'C+';
       else if (normalized >= 50) currentGrade = 'C';
       else currentGrade = 'F';
    }

    return {
      id: course.id,
      title: course.title,
      credits: course.credits || 3, // Default if missing
      currentGrade,
      currentMarks: totalWeight > 0 ? `${Math.round((totalScore / totalWeight) * 100)}%` : '--',
      assessments: mappedAssessments
    };
  });

  const handleSaveAssessment = (e) => {
    e.preventDefault();
    const newAssignment = {
      id: Date.now().toString(),
      courseId: selectedCourse.id,
      title: modalForm.title,
      weight: Number(modalForm.weight),
      marks: modalForm.score,
      status: 'Completed',
    };
    setAssignments([...assignments, newAssignment]);
    setIsModalOpen(false);
    setModalForm({ title: '', weight: '', score: '' });
  };

  const handleDeleteAssessment = (id) => {
    if (confirm('Are you sure you want to delete this assessment?')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  if (selectedCourse) {
    // We need to re-find the updated course data since assignments might have changed
    const updatedSelectedCourse = realCourses.find(c => c.id === selectedCourse.id) || selectedCourse;

    return (
      <div className="animate-in fade-in slide-in-from-right-4 relative">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{updatedSelectedCourse.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{updatedSelectedCourse.credits} Credits</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Target: A</span>
            </div>
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="ml-auto p-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
          >
             <Plus size={20} />
          </button>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
              <Award size={32} />
            </div>
            <div>
               <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Current Grade</p>
               <h3 className="text-4xl font-black text-slate-900 dark:text-white">{updatedSelectedCourse.currentGrade}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
              <BookOpen size={32} />
            </div>
            <div>
               <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Overall Marks</p>
               <h3 className="text-4xl font-black text-slate-900 dark:text-white">{updatedSelectedCourse.currentMarks}</h3>
            </div>
          </div>
        </div>

        {/* Assessment Breakdown Tracker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Assessment Breakdown</h3>
              <p className="text-sm font-bold text-slate-400">Total Weight: 100%</p>
           </div>
           
           <div className="space-y-4">
              {updatedSelectedCourse.assessments.length === 0 ? (
                 <div className="text-center py-8">
                    <p className="text-slate-500 font-medium">No assessments recorded yet. Click the + button to add one.</p>
                 </div>
              ) : updatedSelectedCourse.assessments.map(assessment => (
                 <div key={assessment.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${assessment.status === 'Completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                          {assessment.status === 'Completed' ? <CheckSquare size={18} /> : <Clock size={18} />}
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{assessment.title}</h4>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight: {assessment.weight}%</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Score</p>
                          <p className={`font-black text-lg ${assessment.status === 'Completed' ? 'text-blue-500' : 'text-slate-400'}`}>{assessment.score}</p>
                       </div>
                       <button 
                          onClick={() => handleDeleteAssessment(assessment.id)}
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete Assessment"
                       >
                          <Trash2 size={18} />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Predicted Final Grade</p>
                 <p className="text-sm text-slate-400">Based on current trajectory</p>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                 <span className="font-black text-2xl">{updatedSelectedCourse.currentGrade}</span>
              </div>
           </div>
        </div>

        {/* Add Assessment Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Add Assessment</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSaveAssessment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assessment Title</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Midterm 1"
                      value={modalForm.title}
                      onChange={(e) => setModalForm({...modalForm, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weight (%)</label>
                      <input 
                        required
                        type="number" 
                        min="1"
                        max="100"
                        placeholder="e.g. 20"
                        value={modalForm.weight}
                        onChange={(e) => setModalForm({...modalForm, weight: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Score (Earned/Total)</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. 18/20"
                        pattern="[0-9.]+\/[0-9.]+"
                        title="Format: Earned/Total (e.g. 18/20 or 85/100)"
                        value={modalForm.score}
                        onChange={(e) => setModalForm({...modalForm, score: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Save Assessment
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // List of Courses
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white">Subject Grades</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {realCourses.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Courses Found</h3>
                <p className="text-slate-500">Create courses in the planner to see them here.</p>
             </div>
         ) : realCourses.map(course => (
            <motion.div 
              key={course.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedCourse(course)}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                     <BookOpen size={20} />
                  </div>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest">
                     {course.credits} Cr
                  </span>
               </div>
               
               <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 line-clamp-2">{course.title}</h3>
               
               <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</p>
                     <p className="text-2xl font-black text-blue-500 leading-none">{course.currentGrade}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall</p>
                     <p className="text-lg font-black text-slate-700 dark:text-slate-300 leading-none">{course.currentMarks}</p>
                  </div>
               </div>
            </motion.div>
         ))}
      </div>
    </div>
  );
};

export default SubjectGradeManagement;
