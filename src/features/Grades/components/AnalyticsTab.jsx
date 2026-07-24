import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade, getGradeFromPercentage } from '../utils/gradeCalculations';
import { isSchoolMode } from '../utils/gradeCenter';
import { Award, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

const AnalyticsTab = ({ gcSettings, selectedYear = 'All' }) => {
  const [allCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [allSemesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);

  const semesters = selectedYear === 'All' 
    ? allSemesters 
    : allSemesters.filter(s => s.year === selectedYear);

  const courses = selectedYear === 'All'
    ? allCourses
    : allCourses.filter(c => {
        const sem = allSemesters.find(s => s.id === c.semesterId);
        return sem && sem.year === selectedYear;
      });

  const isSchool = isSchoolMode(gcSettings);

  // Map courses to real data
  const realCourses = courses.filter(c => c.semesterId).map(course => {
    const { rawPercentage, currentGrade } = calculateCourseGrade(course.id, assignments);
    return {
      id: course.id,
      title: course.title,
      score: Math.round(rawPercentage),
      grade: currentGrade
    };
  }).filter(c => c.score > 0);

  // Semesters/Terms line chart data
  const timelineData = semesters.map((sem, index) => {
    const semCourses = courses.filter(c => c.semesterId === sem.id);
    let totalScore = 0;
    let totalWeight = 0;
    let semCredits = 0;
    let semPoints = 0;
    let gradedCount = 0;

    semCourses.forEach(c => {
      const { rawPercentage, gpaValue, totalWeight: w } = calculateCourseGrade(c.id, assignments);
      if (w > 0) {
        totalScore += rawPercentage;
        totalWeight += 100;
        semCredits += c.credits || 3;
        semPoints += (gpaValue * (c.credits || 3));
        gradedCount++;
      }
    });

    const termAvg = gradedCount > 0 ? totalScore / gradedCount : 0;
    const termGpa = semCredits > 0 ? semPoints / semCredits : 0;

    return {
      name: sem.title ? sem.title.split(' ')[0] : `Term ${index + 1}`,
      value: isSchool ? Number(termAvg.toFixed(1)) : Number(termGpa.toFixed(2))
    };
  }).filter(d => d.value > 0);

  // Strengths and Weaknesses classification
  const targetVal = isSchool ? (gcSettings?.targetAverage || 75) : (gcSettings?.targetCgpa || 3.5);
  
  const strengths = [];
  const weaknesses = [];

  realCourses.forEach(c => {
    const scoreVal = isSchool ? c.score : getGradeFromPercentage(c.score).gpaValue;
    if (scoreVal >= targetVal) {
      strengths.push(c);
    } else {
      weaknesses.push(c);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
         <h3 className="text-lg font-black text-slate-900 dark:text-white">Academic Analytics</h3>
         <p className="text-sm text-slate-500 font-medium">Deconstruct performance trends, compare subjects, and review strength/weakness matrices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Performance Trend Line Chart */}
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-96">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Performance Trend</h3>
            <div className="flex-1 w-full">
               {timelineData.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-20 text-center">No trend data available. Log grades to see trends.</p>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <YAxis domain={isSchool ? [0, 100] : [0, 4.0]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8 }} />
                     </LineChart>
                  </ResponsiveContainer>
               )}
            </div>
         </div>

         {/* Subject Comparison Bar Chart */}
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-96">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Subject Comparison</h3>
            <div className="flex-1 w-full">
               {realCourses.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-20 text-center">No subjects logged. Select the Subjects tab to record grades.</p>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={realCourses}>
                        <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
         </div>
      </div>

      {/* Strength & Weakness Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Sparkles size={18} /> Strongest Subjects
            </h3>
            <div className="space-y-3">
               {strengths.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No subjects currently exceeding target.</p>
               ) : (
                  strengths.map(c => (
                     <div key={c.id} className="flex justify-between items-center p-4 bg-green-50/30 dark:bg-green-950/10 border border-green-100/50 dark:border-green-900/20 rounded-2xl">
                        <span className="font-bold text-slate-900 dark:text-white">{c.title}</span>
                        <span className="font-black text-green-600 dark:text-green-400 text-lg">{isSchool ? `${c.score}%` : c.grade}</span>
                     </div>
                  ))
               )}
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <AlertCircle size={18} /> Focus & Improvement Areas
            </h3>
            <div className="space-y-3">
               {weaknesses.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Excellent! No subjects currently below target.</p>
               ) : (
                  weaknesses.map(c => (
                     <div key={c.id} className="flex justify-between items-center p-4 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-2xl">
                        <span className="font-bold text-slate-900 dark:text-white">{c.title}</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-lg">{isSchool ? `${c.score}%` : c.grade}</span>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
