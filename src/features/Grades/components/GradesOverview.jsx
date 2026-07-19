import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, BookOpen, BrainCircuit, ChevronRight, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';

const GradesOverview = () => {
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [semesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);
  const [totalDegreeCredits, setTotalDegreeCredits] = useStorage('TOTAL_DEGREE_CREDITS', 120);
  const [targetCgpa, setTargetCgpa] = useStorage('TARGET_CGPA', 3.5);
  
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [editCreditsValue, setEditCreditsValue] = useState(totalDegreeCredits.toString());
  
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState(targetCgpa.toString());

  // Calculate stats dynamically
  let totalCreditsCompleted = 0;
  let totalGradePoints = 0;
  let gradedCoursesCount = 0;

  const realCourses = courses.map(course => {
    const courseAssignments = assignments.filter(a => a.courseId === course.id);
    let totalScore = 0;
    let totalWeight = 0;

    courseAssignments.forEach(a => {
      const weight = a.weight || Math.round(100 / (courseAssignments.length || 1));
      if (a.marks && a.marks.includes('/')) {
        const [earned, total] = a.marks.split('/').map(Number);
        if (!isNaN(earned) && !isNaN(total) && total > 0) {
           const parsedScore = (earned / total) * 100;
           totalScore += parsedScore * (weight / 100);
           totalWeight += weight;
        }
      }
    });

    let currentGrade = '--';
    let gpaValue = 0;
    
    let rawPercentage = 0;
    if (totalWeight > 0) {
       rawPercentage = (totalScore / totalWeight) * 100;
       const normalized = rawPercentage;
       if (normalized >= 90) { currentGrade = 'A+'; gpaValue = 4.0; }
       else if (normalized >= 85) { currentGrade = 'A'; gpaValue = 4.0; }
       else if (normalized >= 80) { currentGrade = 'A-'; gpaValue = 3.7; }
       else if (normalized >= 75) { currentGrade = 'B+'; gpaValue = 3.3; }
       else if (normalized >= 70) { currentGrade = 'B'; gpaValue = 3.0; }
       else if (normalized >= 65) { currentGrade = 'B-'; gpaValue = 2.7; }
       else if (normalized >= 60) { currentGrade = 'C+'; gpaValue = 2.3; }
       else if (normalized >= 50) { currentGrade = 'C'; gpaValue = 2.0; }
       else { currentGrade = 'F'; gpaValue = 0; }
       
       gradedCoursesCount++;
       const courseCredits = course.credits || 3;
       totalCreditsCompleted += courseCredits;
       totalGradePoints += (gpaValue * courseCredits);
    }

    return {
      id: course.id,
      title: course.title,
      credits: course.credits || 3,
      currentGrade,
      gpaValue,
      rawPercentage,
      semesterId: course.semesterId
    };
  });

  const overallCgpa = totalCreditsCompleted > 0 ? (totalGradePoints / totalCreditsCompleted).toFixed(2) : "0.00";

  // Generate realistic chart data based on real semester data
  const chartData = semesters.map((sem, index) => {
    const semCourses = realCourses.filter(c => c.semesterId === sem.id);
    let semCredits = 0;
    let semPoints = 0;
    semCourses.forEach(c => {
      if (c.currentGrade !== '--') {
        semCredits += c.credits;
        semPoints += (c.gpaValue * c.credits);
      }
    });
    const termGpa = semCredits > 0 ? (semPoints / semCredits) : 0;
    
    // Fallback name if title is empty
    const shortName = sem.title ? sem.title.split(' ')[0] : `S${index + 1}`;
    
    return {
      name: shortName,
      gpa: Number(termGpa.toFixed(2))
    };
  }).filter(data => data.gpa > 0); // Only plot semesters with recorded GPA

  // If there's not enough data, use placeholder data so the chart still looks nice
  const displayChartData = chartData.length >= 2 ? chartData : [
    { name: 'Past', gpa: Math.max(0, parseFloat(overallCgpa) - 0.4) },
    { name: 'Current', gpa: parseFloat(overallCgpa) || 0 }
  ].filter(d => d.gpa > 0);

  const stats = {
    cgpa: overallCgpa,
    semesterGpa: chartData.length > 0 ? chartData[chartData.length - 1].gpa.toFixed(2) : overallCgpa, 
    creditsCompleted: totalCreditsCompleted,
    creditsTotal: Math.max(totalDegreeCredits, totalCreditsCompleted), // Use the user-defined degree total
    academicStanding: parseFloat(overallCgpa) >= 3.5 ? "Excellent" : parseFloat(overallCgpa) >= 2.0 ? "Good" : "Probation"
  };

  // Generate Radar Data (Option A: top 6 active courses)
  const gradedRealCourses = realCourses.filter(c => c.currentGrade !== '--');
  
  const radarData = gradedRealCourses.slice(0, 6).map(c => {
    // Generate a short name (e.g. "Software Engineering" -> "Software Eng")
    const words = c.title.split(' ');
    const shortTitle = words.length > 1 ? `${words[0]} ${words[1].substring(0, 3)}.` : words[0].substring(0, 10);
    return {
      subject: shortTitle,
      score: Math.round(c.rawPercentage) || 0,
      fullMark: 100
    };
  });

  // If we don't have enough data, provide a nice placeholder
  const displayRadarData = radarData.length >= 3 ? radarData : [
    { subject: 'Programming', score: 90, fullMark: 100 },
    { subject: 'Networking', score: 75, fullMark: 100 },
    { subject: 'Database', score: 85, fullMark: 100 },
    { subject: 'Math', score: 65, fullMark: 100 },
    { subject: 'Comm.', score: 88, fullMark: 100 },
  ];

  // Calculate Risk Subjects (lowest GPA value)
  const riskSubjects = [...gradedRealCourses]
     .filter(c => c.gpaValue < targetCgpa) // Below target
     .sort((a, b) => a.gpaValue - b.gpaValue) // Lowest first
     .slice(0, 2); // Top 2 highest risks

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Top Academic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CGPA', value: stats.cgpa, sub: `${stats.academicStanding} Standing`, icon: Award, tint: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Semester GPA', value: stats.semesterGpa, sub: 'Current Term', icon: TrendingUp, tint: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30' },
          { label: 'Credits Completed', value: `${stats.creditsCompleted} / ${stats.creditsTotal}`, sub: 'Degree Progress', icon: BookOpen, tint: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                {stat.label === 'Credits Completed' && isEditingCredits ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-2xl font-black ${stat.tint}`}>{stats.creditsCompleted} /</span>
                    <input
                      type="number"
                      autoFocus
                      className="w-16 bg-slate-100 dark:bg-slate-800 text-2xl font-black text-indigo-500 rounded px-1 outline-none focus:ring-2 focus:ring-indigo-500/50 -ml-1"
                      value={editCreditsValue}
                      onChange={(e) => setEditCreditsValue(e.target.value)}
                      onBlur={() => {
                         const val = parseInt(editCreditsValue, 10);
                         if (!isNaN(val) && val > 0) setTotalDegreeCredits(val);
                         else setEditCreditsValue(totalDegreeCredits.toString());
                         setIsEditingCredits(false);
                      }}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') e.target.blur();
                      }}
                    />
                  </div>
                ) : (
                  <p 
                    className={`text-2xl font-black mt-1 ${stat.tint} ${stat.label === 'Credits Completed' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    onClick={() => {
                       if (stat.label === 'Credits Completed') {
                          setIsEditingCredits(true);
                          setEditCreditsValue(totalDegreeCredits.toString());
                       }
                    }}
                    title={stat.label === 'Credits Completed' ? "Click to edit total required credits" : ""}
                  >
                    {stat.value}
                  </p>
                )}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
            {stat.label === 'Credits Completed' ? (
               <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-2">
                 <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${(stats.creditsCompleted / stats.creditsTotal) * 100}%` }}></div>
               </div>
            ) : (
               <p className="text-[10px] font-bold text-slate-500 mt-1">{stat.sub}</p>
            )}
          </motion.div>
        ))}

        {/* AI Insight Card */}
        {totalCreditsCompleted > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-lg shadow-blue-500/20 text-white relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10 mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1.5">
                <BrainCircuit size={14} /> AI Insight
              </p>
            </div>
            <p className="text-sm font-bold leading-tight relative z-10 mt-1">
              {parseFloat(overallCgpa) >= 3.5 
                ? "Your grades are trending upward this semester. You're securely in the Excellent standing!"
                : "You have a solid foundation. Focus on your highest credit courses to boost your overall CGPA."}
            </p>
          </motion.div>
        )}
      </div>

      {/* Main Grid: Chart & Current Semester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full">
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">GPA Progress</h3>
           <div className="flex-1 min-h-[250px] w-full mt-2 flex items-center justify-center">
             {totalCreditsCompleted > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                   <YAxis domain={[0, 4.0]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }}
                     itemStyle={{ color: '#3b82f6' }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="gpa" 
                     stroke="#3b82f6" 
                     strokeWidth={4} 
                     dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
                     activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
                     animationDuration={1500}
                   />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="text-center">
                 <TrendingUp size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                 <p className="text-slate-500 font-bold">No progress data available yet.</p>
                 <p className="text-slate-400 text-sm mt-1">Start entering grades in your courses to unlock the progress chart.</p>
               </div>
             )}
           </div>
        </div>

        {/* Current Semester Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full">
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Current Semester</h3>
           
           <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
             {realCourses.length === 0 ? (
               <p className="text-sm text-slate-500 italic p-4">No graded courses yet.</p>
             ) : realCourses.slice(0, 3).map(course => (
               <div key={course.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div>
                     <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{course.title}</h4>
                     <p className="text-xs text-slate-500 font-medium">{course.credits} Credits</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                     <p className="font-black text-blue-500 text-lg">{course.currentGrade}</p>
                     <p className="text-xs text-slate-400 font-bold">{course.gpaValue > 0 ? `${course.gpaValue.toFixed(1)} GPA` : 'In Progress'}</p>
                  </div>
               </div>
             ))}
           </div>
           
           <button className="w-full mt-auto pt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group">
              View All Subjects <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>

      {/* Second Grid: Radar Chart & Goals Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar Chart (Subject Performance) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full">
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Subject Performance</h3>
           <p className="text-sm text-slate-500 font-medium mb-4">Relative strengths across your curriculum</p>
           
           <div className="flex-1 min-h-[300px] w-full flex items-center justify-center -mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="75%" data={displayRadarData}>
                   <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                   <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                   <Radar 
                     name="Performance" 
                     dataKey="score" 
                     stroke="#6366f1" 
                     fill="#6366f1" 
                     fillOpacity={0.3} 
                     isAnimationActive={true}
                     animationDuration={1500}
                   />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }}
                     itemStyle={{ color: '#818cf8' }}
                   />
                 </RadarChart>
               </ResponsiveContainer>
           </div>
        </div>

        {/* Goal Tracker & Risk Subjects */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
           <div className="absolute top-0 right-0 p-24 bg-indigo-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
           
           <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <Target size={20} className="text-indigo-500" /> Goal Target
                </h3>
              </div>
           </div>

           <div className="relative z-10 mb-8 bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target CGPA</p>
                 {isEditingTarget ? (
                   <input
                     type="number"
                     step="0.1"
                     autoFocus
                     className="w-16 bg-white dark:bg-slate-900 text-lg font-black text-indigo-500 rounded px-2 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700"
                     value={editTargetValue}
                     onChange={(e) => setEditTargetValue(e.target.value)}
                     onBlur={() => {
                        const val = parseFloat(editTargetValue);
                        if (!isNaN(val) && val > 0 && val <= 4.0) setTargetCgpa(val);
                        else setEditTargetValue(targetCgpa.toString());
                        setIsEditingTarget(false);
                     }}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                     }}
                   />
                 ) : (
                   <p 
                      className="text-lg font-black text-slate-900 dark:text-white cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={() => setIsEditingTarget(true)}
                      title="Click to edit target CGPA"
                   >
                      {targetCgpa.toFixed(2)}
                   </p>
                 )}
              </div>
              
              <div className="flex items-end gap-3">
                 <h2 className="text-4xl font-black text-slate-900 dark:text-white">{stats.cgpa}</h2>
                 <p className="text-sm font-bold text-slate-400 mb-1">Current</p>
              </div>

              <div className="mt-4">
                 <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className={parseFloat(stats.cgpa) >= targetCgpa ? 'text-green-500' : 'text-slate-500'}>
                       {parseFloat(stats.cgpa) >= targetCgpa ? 'On Track' : 'Needs Improvement'}
                    </span>
                    <span className="text-slate-400">{Math.min(100, (parseFloat(stats.cgpa) / targetCgpa) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                   <div 
                      className={`h-2 rounded-full transition-all ${parseFloat(stats.cgpa) >= targetCgpa ? 'bg-green-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${Math.min(100, (parseFloat(stats.cgpa) / targetCgpa) * 100)}%` }}
                   ></div>
                 </div>
              </div>
           </div>

           <div className="relative z-10 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertCircle size={16} className="text-amber-500" /> Risk Subjects
              </h4>
              
              {riskSubjects.length === 0 ? (
                 <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">All subjects are currently exceeding your target!</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {riskSubjects.map(subject => (
                       <div key={subject.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <div className="pr-2">
                             <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{subject.title}</p>
                             <p className="text-xs font-medium text-slate-500">Current: {subject.currentGrade}</p>
                          </div>
                          <div className="flex-shrink-0 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-lg whitespace-nowrap">
                             Target: {
                                targetCgpa >= 4.0 ? 'A' :
                                targetCgpa >= 3.7 ? 'A-' :
                                targetCgpa >= 3.3 ? 'B+' :
                                targetCgpa >= 3.0 ? 'B' : 'B-'
                             }
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default GradesOverview;
