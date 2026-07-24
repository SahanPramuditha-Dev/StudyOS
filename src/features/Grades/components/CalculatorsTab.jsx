import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Target, BrainCircuit, ArrowRight, Loader2, BookOpen, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade, simulateGPA, parseScore, GRADE_SCALE } from '../utils/gradeCalculations';
import { isSchoolMode } from '../utils/gradeCenter';

const CalculatorsTab = ({ gcSettings, selectedYear = 'All' }) => {
  const [allCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [tasks, setTasks] = useStorage(STORAGE_KEYS.TASKS, []);
  const [semesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);

  const courses = selectedYear === 'All'
    ? allCourses
    : allCourses.filter(c => {
        const sem = semesters.find(s => s.id === c.semesterId);
        return sem && sem.year === selectedYear;
      });

  const isSchool = isSchoolMode(gcSettings);
  const [activeSubCalc, setActiveSubCalc] = useState(isSchool ? 'average' : 'gpa');

  // GPA Calculator States
  const [selectedCourseId, setSelectedCourseId] = useState('custom');
  const [targetGrade, setTargetGrade] = useState('A');
  const [currentScore, setCurrentScore] = useState(65);
  const [finalWeight, setFinalWeight] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weakTopics, setWeakTopics] = useState([]);

  // Average Calculator States (School)
  const [schoolSubjects, setSchoolSubjects] = useState([{ name: 'Math', score: '' }, { name: 'Science', score: '' }]);

  // Target Calculator States
  const [tgtCurrent, setTgtCurrent] = useState('80');
  const [tgtTarget, setTgtTarget] = useState('90');
  const [tgtWeight, setTgtWeight] = useState('30');

  // GPA Simulator States
  const [simulatedCourses, setSimulatedCourses] = useState([]);

  const targetGradeMap = {
     'A+': 90, 'A': 85, 'A-': 80, 'B+': 75, 'B': 70, 'B-': 65, 'C+': 60, 'C': 50, 'F': 0
  };

  const getRequiredWeightScore = () => {
    const targetMin = targetGradeMap[targetGrade] || 85;
    const currentWeight = 100 - finalWeight;
    const currentCont = (currentScore * currentWeight) / 100;
    const requiredTotal = targetMin - currentCont;
    const needed = (requiredTotal / finalWeight) * 100;
    return Math.max(0, Math.round(needed));
  };

  const requiredScore = getRequiredWeightScore();

  useEffect(() => {
    if (selectedCourseId !== 'custom') {
      const { rawPercentage, totalWeight, courseAssignments } = calculateCourseGrade(selectedCourseId, assignments);
      if (totalWeight > 0) {
        setCurrentScore(Math.round(rawPercentage));
        setFinalWeight(Math.max(1, 100 - totalWeight));
      } else {
        setCurrentScore(0);
        setFinalWeight(100);
      }
      
      if (courseAssignments && courseAssignments.length > 0) {
         const scored = courseAssignments.map(a => ({ title: a.title, score: parseScore(a.marks) })).filter(a => a.score > 0);
         const lowest = scored.sort((a,b) => a.score - b.score).slice(0, 2);
         setWeakTopics(lowest.map(l => l.title));
      } else {
         setWeakTopics([]);
      }
    }
  }, [selectedCourseId, assignments]);

  // Handle GPA Simulation Setup
  useEffect(() => {
    const semCourses = courses.filter(c => c.semesterId);
    setSimulatedCourses(semCourses.map(c => ({
      id: c.id,
      title: c.title,
      credits: c.credits || 3,
      simulatedGrade: '' // Will start as empty, fallback to actual
    })));
  }, [courses]);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      
      const newTasks = [];
      const courseName = selectedCourseId !== 'custom' ? courses.find(c => c.id === selectedCourseId)?.title : 'Your Course';
      
      if (weakTopics.length > 0) {
         weakTopics.forEach(topic => {
            newTasks.push({
               id: Date.now().toString() + Math.random().toString(36).substring(7),
               title: `Review ${topic} for Final Exam`,
               description: `Targeting a ${requiredScore}% on the final to achieve a ${targetGrade}. Focus on this weak area.`,
               courseId: selectedCourseId !== 'custom' ? selectedCourseId : null,
               priority: 'High',
               dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
               status: 'todo',
               type: 'Study'
            });
         });
      } else {
         newTasks.push({
             id: Date.now().toString() + '_plan1',
             title: `Comprehensive Review for ${courseName} Final`,
             description: `Targeting a ${requiredScore}% on the final to achieve a ${targetGrade}. Review all major concepts.`,
             courseId: selectedCourseId !== 'custom' ? selectedCourseId : null,
             priority: 'High',
             dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
             status: 'todo',
             type: 'Study'
         });
      }
      
      setTasks([...tasks, ...newTasks]);

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

  const getSimulatedCgpa = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    courses.filter(c => c.semesterId).forEach(course => {
      const simCourse = simulatedCourses.find(sc => sc.id === course.id);
      let gpaVal = 0;
      let hasGrade = false;

      if (simCourse?.simulatedGrade) {
        const scaleMatch = GRADE_SCALE.find(g => g.letter === simCourse.simulatedGrade);
        gpaVal = scaleMatch ? scaleMatch.gpa : 0;
        hasGrade = true;
      } else {
        const { gpaValue, totalWeight } = calculateCourseGrade(course.id, assignments);
        if (totalWeight > 0) {
          gpaVal = gpaValue;
          hasGrade = true;
        }
      }

      if (hasGrade) {
        const credits = course.credits || 3;
        totalCredits += credits;
        totalGradePoints += gpaVal * credits;
      }
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 gap-4">
         {isSchool ? (
            <button
               onClick={() => setActiveSubCalc('average')}
               className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeSubCalc === 'average' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
            >
               Average Calculator
            </button>
         ) : (
            <>
               <button
                  onClick={() => setActiveSubCalc('gpa')}
                  className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeSubCalc === 'gpa' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
               >
                  GPA Predictor
               </button>
               <button
                  onClick={() => setActiveSubCalc('simulator')}
                  className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeSubCalc === 'simulator' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
               >
                  Future GPA Simulator
               </button>
            </>
         )}
         <button
            onClick={() => setActiveSubCalc('target')}
            className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeSubCalc === 'target' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
         >
            Target Grade Calculator
         </button>
      </div>

      {activeSubCalc === 'average' && (
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-w-xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Average Calculator</h3>
            <div className="space-y-3">
               {schoolSubjects.map((sub, i) => (
                  <div key={i} className="flex gap-3">
                     <input
                        type="text"
                        placeholder="Subject..."
                        value={sub.name}
                        onChange={(e) => {
                           const n = [...schoolSubjects];
                           n[i].name = e.target.value;
                           setSchoolSubjects(n);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold"
                     />
                     <input
                        type="number"
                        placeholder="Mark %"
                        value={sub.score}
                        onChange={(e) => {
                           const n = [...schoolSubjects];
                           n[i].score = e.target.value;
                           setSchoolSubjects(n);
                        }}
                        className="w-24 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold"
                     />
                  </div>
               ))}
               <button
                  onClick={() => setSchoolSubjects([...schoolSubjects, { name: '', score: '' }])}
                  className="text-xs font-bold text-blue-500 flex items-center gap-1.5 pt-2"
               >
                  + Add Subject
               </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculated Average</p>
                  <h4 className="text-3xl font-black text-blue-500 mt-1">
                     {Math.round(schoolSubjects.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / schoolSubjects.filter(s => s.score).length || 0)}%
                  </h4>
               </div>
            </div>
         </div>
      )}

      {activeSubCalc === 'gpa' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
               <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Final Exam Grade Predictor</h3>
               <div className="space-y-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Link to Subject</label>
                   <select 
                     value={selectedCourseId} 
                     onChange={e => setSelectedCourseId(e.target.value)} 
                     className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-850 dark:text-slate-350"
                   >
                     <option value="custom">Custom Input (Non-linked)</option>
                     {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                   </select>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Grade</label>
                     <select value={targetGrade} onChange={e => setTargetGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-850 dark:text-slate-350">
                        {Object.keys(targetGradeMap).filter(k => k !== 'F').map(k => <option key={k} value={k}>{k}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Marks %</label>
                     <input type="number" value={currentScore} onChange={e => setCurrentScore(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-850 dark:text-slate-350" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Final Exam Weight %</label>
                     <input type="number" value={finalWeight} onChange={e => setFinalWeight(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none font-bold text-slate-850 dark:text-slate-350" />
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
               <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Calculated Target</h3>
                  <p className="text-sm text-slate-500 font-medium">Score needed on final exam</p>
               </div>
               
               <div className="py-8 text-center">
                  <h1 className="text-6xl font-black text-blue-500">{requiredScore > 100 ? 'Impossible' : `${requiredScore}%`}</h1>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Required Exam score</p>
               </div>

               <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                     <BrainCircuit size={20} className="text-indigo-500 mt-0.5" />
                     <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Recommendation</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">
                           {weakTopics.length > 0 ? `Focus revision on ${weakTopics.join(', ')} to boost your standing.` : 'Everything looks stable, maintain current study habits.'}
                        </p>
                     </div>
                  </div>

                  <button
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                    className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                     {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Generate AI Study Plan'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {activeSubCalc === 'simulator' && (
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">GPA Simulator</h3>
                  <p className="text-sm text-slate-500 font-medium">Model future semester outcomes to predict your graduation CGPA.</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Simulated Cumulative GPA:</span>
                  <span className="text-xl font-black text-blue-500">{getSimulatedCgpa()}</span>
               </div>
            </div>

            <div className="space-y-3">
               {simulatedCourses.map(sc => (
                  <div key={sc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl">
                     <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{sc.title}</p>
                        <p className="text-xs text-slate-500">{sc.credits} Credits</p>
                     </div>
                     <select
                        value={sc.simulatedGrade}
                        onChange={(e) => {
                           setSimulatedCourses(simulatedCourses.map(c => c.id === sc.id ? { ...c, simulatedGrade: e.target.value } : c));
                        }}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-bold text-sm"
                     >
                        <option value="">Actual Grade</option>
                        {Object.keys(targetGradeMap).map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeSubCalc === 'target' && (
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-w-md">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Target Score Calculator</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Marks (%)</label>
                  <input type="number" value={tgtCurrent} onChange={e => setTgtCurrent(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Grade (%)</label>
                  <input type="number" value={tgtTarget} onChange={e => setTgtTarget(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remaining Exam Weight (%)</label>
                  <input type="number" value={tgtWeight} onChange={e => setTgtWeight(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold" />
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score Needed on Exam</p>
               <h4 className="text-4xl font-black text-blue-500 mt-1">
                  {(() => {
                     const current = Number(tgtCurrent) || 0;
                     const target = Number(tgtTarget) || 0;
                     const weight = Number(tgtWeight) || 0;
                     const currentWeight = 100 - weight;
                     const contribution = (current * currentWeight) / 100;
                     const needed = ((target - contribution) / weight) * 100;
                     return needed > 100 ? 'Impossible' : `${Math.max(0, Math.round(needed))}%`;
                  })()}
               </h4>
            </div>
         </div>
      )}
    </div>
  );
};

export default CalculatorsTab;
