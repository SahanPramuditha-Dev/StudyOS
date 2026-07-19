import React, { useState, useEffect } from 'react';
import { Calculator, Target, BrainCircuit, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';

const GradeCalculator = () => {
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);

  const [selectedCourseId, setSelectedCourseId] = useState('custom');
  const [targetGrade, setTargetGrade] = useState('A');
  const [currentScore, setCurrentScore] = useState(65);
  const [finalWeight, setFinalWeight] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (selectedCourseId !== 'custom') {
      const courseAssignments = assignments.filter(a => a.courseId === selectedCourseId);
      let totalScore = 0;
      let totalWeight = 0;

      courseAssignments.forEach(a => {
        const weight = a.weight || 0;
        if (a.marks && a.marks.includes('/')) {
          const [earned, total] = a.marks.split('/').map(Number);
          if (!isNaN(earned) && !isNaN(total) && total > 0) {
             const parsedScore = (earned / total) * 100;
             totalScore += parsedScore * (weight / 100);
             totalWeight += weight;
          }
        }
      });

      if (totalWeight > 0) {
        setCurrentScore(Math.round((totalScore / totalWeight) * 100));
        // Assume final exam is whatever weight is remaining out of 100
        setFinalWeight(Math.max(1, 100 - totalWeight));
      } else {
        setCurrentScore(0);
        setFinalWeight(100);
      }
    }
  }, [selectedCourseId, assignments]);
  
  const handleGeneratePlan = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Study plan generated and added to your tasks!', {
        icon: '🧠',
        style: {
          borderRadius: '16px',
          background: '#1e293b',
          color: '#fff',
        },
      });
    }, 1500);
  };

  // Basic mock calculation for MVP
  const requiredScore = Math.max(0, Math.min(100, Math.round(((85 - (currentScore * (1 - finalWeight/100))) / (finalWeight/100)))));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
         {/* Left Column: Context & Inputs */}
         <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Header Block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm flex items-center gap-5">
               <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-500">
                  <Calculator size={32} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Grade Predictor</h2>
                  <p className="text-sm text-slate-500 leading-tight">Calculate exactly what you need on your final exam.</p>
               </div>
            </div>

            {/* Input Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm flex-1">
               <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                 <Target size={18} className="text-blue-500" /> Current Standing
               </h3>
               
               <div className="space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <BookOpen size={14} /> Link to Course
                     </label>
                     <select 
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base font-bold appearance-none text-slate-700 dark:text-slate-300"
                     >
                        <option value="custom">Custom (Manual Entry)</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Coursework Average (%)</label>
                     <input 
                        type="number" 
                        value={currentScore}
                        onChange={(e) => {
                          setSelectedCourseId('custom');
                          setCurrentScore(Number(e.target.value));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base font-black"
                     />
                  </div>
                  
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Final Exam Weight (%)</label>
                     <input 
                        type="number" 
                        value={finalWeight}
                        onChange={(e) => {
                          setSelectedCourseId('custom');
                          setFinalWeight(Number(e.target.value));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base font-black"
                     />
                  </div>
                  
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Final Grade</label>
                     <select 
                        value={targetGrade}
                        onChange={(e) => setTargetGrade(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base font-black appearance-none"
                     >
                        <option value="A+">A+ (90%+)</option>
                        <option value="A">A (85%+)</option>
                        <option value="A-">A- (80%+)</option>
                        <option value="B+">B+ (75%+)</option>
                        <option value="B">B (70%+)</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Output & AI */}
         <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Output Section */}
            <div className="flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400 dark:border-indigo-500 rounded-[2rem] p-10 shadow-lg shadow-blue-500/20 text-white relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[300px]">
               <div className="absolute top-0 right-0 p-40 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
               <div className="absolute bottom-0 left-0 p-32 bg-indigo-900/20 rounded-full blur-[50px] -ml-16 -mb-16 pointer-events-none" />
               
               <p className="text-sm font-bold text-blue-100 uppercase tracking-widest mb-4 relative z-10">Required on Final Exam</p>
               <h2 className="text-8xl font-black mb-4 relative z-10 drop-shadow-xl">{requiredScore}%</h2>
               <p className="text-blue-100 font-medium max-w-sm mx-auto text-lg relative z-10 leading-relaxed">
                  To achieve an {targetGrade} overall, you need to score at least {requiredScore}% on your upcoming final exam.
               </p>
            </div>

            {/* AI Assistant Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex flex-shrink-0 items-center justify-center text-indigo-500">
                  <BrainCircuit size={28} />
               </div>
               <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">StudyOS AI Recommendation</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Based on your past performance, scoring {requiredScore}% is highly achievable. Focus your revision on <strong className="text-slate-700 dark:text-slate-300">Database Normalization</strong> and <strong className="text-slate-700 dark:text-slate-300">SQL Subqueries</strong>.</p>
               </div>
               <button 
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="flex-shrink-0 w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      Generate Plan <ArrowRight size={18} />
                    </>
                  )}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default GradeCalculator;
