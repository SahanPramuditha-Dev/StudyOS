import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, BookOpen, BrainCircuit, ChevronRight, Target, AlertCircle, CheckCircle2, Star, Hash, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade } from '../utils/gradeCalculations';
import { isSchoolMode, getTermLabel } from '../utils/gradeCenter';

const GradesOverview = ({ gcSettings, selectedYear = 'All' }) => {
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
  
  const totalDegreeCredits = gcSettings?.totalCreditsRequired || 120;
  const targetCgpa = gcSettings?.targetCgpa || 3.5;
  const targetAverage = gcSettings?.targetAverage || 75;

  let totalCreditsCompleted = 0;
  let totalGradePoints = 0;
  let gradedCoursesCount = 0;
  let totalPercentage = 0;

  const realCourses = courses.filter(c => c.semesterId).map(course => {
    const { totalScore, totalWeight, rawPercentage, currentGrade, gpaValue } = calculateCourseGrade(course.id, assignments);

    if (totalWeight > 0) {
       gradedCoursesCount++;
       const courseCredits = course.credits || 3;
       totalCreditsCompleted += courseCredits;
       totalGradePoints += (gpaValue * courseCredits);
       totalPercentage += rawPercentage;
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
  const overallAverage = gradedCoursesCount > 0 ? (totalPercentage / gradedCoursesCount).toFixed(1) : "0.0";
  
  const bestSubject = gradedCoursesCount > 0 ? realCourses.reduce((prev, current) => (prev.rawPercentage > current.rawPercentage) ? prev : current) : null;
  const weakestSubject = gradedCoursesCount > 0 ? realCourses.reduce((prev, current) => (prev.rawPercentage < current.rawPercentage) ? prev : current) : null;

  // Chart Data
  const chartData = semesters.map((sem, index) => {
    const semCourses = realCourses.filter(c => c.semesterId === sem.id);
    
    if (isSchool) {
      let semTotalPercentage = 0;
      let semGradedCount = 0;
      semCourses.forEach(c => {
        if (c.currentGrade !== '--') {
          semTotalPercentage += c.rawPercentage;
          semGradedCount++;
        }
      });
      const termAvg = semGradedCount > 0 ? (semTotalPercentage / semGradedCount) : 0;
      const termName = sem.title || `${getTermLabel(gcSettings)} ${index + 1}`;
      
      return {
        name: termName,
        value: Number(termAvg.toFixed(1))
      };
    } else {
      let semCredits = 0;
      let semPoints = 0;
      semCourses.forEach(c => {
        if (c.currentGrade !== '--') {
          semCredits += c.credits;
          semPoints += (c.gpaValue * c.credits);
        }
      });
      const termGpa = semCredits > 0 ? (semPoints / semCredits) : 0;
      const shortName = sem.title ? sem.title.split(' ')[0] : `S${index + 1}`;
      
      return {
        name: shortName,
        value: Number(termGpa.toFixed(2))
      };
    }
  }).filter(data => data.value > 0);

  const displayChartData = chartData.length > 0 ? chartData : [];

  // Trend detection
  let isImproving = true;
  if (displayChartData.length >= 2) {
    isImproving = displayChartData[displayChartData.length - 1].value >= displayChartData[displayChartData.length - 2].value;
  }

  const topStats = isSchool ? [
    { label: 'Average', value: `${overallAverage}%`, sub: 'Overall performance', icon: Award, tint: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Best Subject', value: bestSubject ? bestSubject.title.substring(0, 15) : '--', sub: bestSubject ? `${bestSubject.rawPercentage.toFixed(1)}%` : 'No data', icon: Star, tint: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { label: 'Subjects Count', value: gradedCoursesCount, sub: 'Active subjects', icon: Hash, tint: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Attendance', value: '95%', sub: 'Placeholder', icon: Calendar, tint: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30' }
  ] : [
    { label: 'CGPA', value: overallCgpa, sub: parseFloat(overallCgpa) >= 3.5 ? 'Excellent Standing' : parseFloat(overallCgpa) >= 2.0 ? 'Good Standing' : 'Probation', icon: Award, tint: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Semester GPA', value: chartData.length > 0 ? chartData[chartData.length - 1].value.toFixed(2) : overallCgpa, sub: 'Current Term', icon: TrendingUp, tint: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Credits Earned', value: `${totalCreditsCompleted} / ${totalDegreeCredits}`, sub: 'Degree Progress', icon: BookOpen, tint: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Progress', value: `${Math.min(100, Math.round((totalCreditsCompleted / totalDegreeCredits) * 100))}%`, sub: 'Completion rate', icon: Target, tint: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' }
  ];

  const gradedRealCourses = realCourses.filter(c => c.currentGrade !== '--');
  
  let radarData = gradedRealCourses.slice(0, 6).map(c => {
    const words = c.title.split(' ');
    const shortTitle = words.length > 1 ? `${words[0]} ${words[1].substring(0, 3)}.` : words[0].substring(0, 10);
    return {
      subject: shortTitle,
      score: Math.round(c.rawPercentage) || 0,
      fullMark: 100
    };
  });
  const displayRadarData = radarData.length > 0 ? radarData : [];

  let riskSubjects = [];
  if (isSchool) {
    riskSubjects = [...gradedRealCourses]
      .filter(c => c.rawPercentage < targetAverage)
      .sort((a, b) => a.rawPercentage - b.rawPercentage)
      .slice(0, 2);
  } else {
    riskSubjects = [...gradedRealCourses]
      .filter(c => c.gpaValue < targetCgpa)
      .sort((a, b) => a.gpaValue - b.gpaValue)
      .slice(0, 2);
  }

  const recentAssessments = [...assignments]
    .filter(a => a.marks)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  const getTargetLabel = () => {
    if (isSchool) return "Target Average";
    return "Target CGPA";
  };

  const getCurrentMetric = () => {
    if (isSchool) return overallAverage;
    return overallCgpa;
  };
  
  const getTargetMetric = () => {
    if (isSchool) return targetAverage;
    return targetCgpa;
  };

  const getMetricProgress = () => {
    const current = parseFloat(getCurrentMetric());
    const target = parseFloat(getTargetMetric());
    if (target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };
  
  const isOnTrack = parseFloat(getCurrentMetric()) >= parseFloat(getTargetMetric());

  // Generate Academic Activity Notifications
  const academicNotifications = [];
  
  if (parseFloat(overallCgpa) >= targetCgpa && !isSchool && gradedCoursesCount > 0) {
     academicNotifications.push({
        id: 'cgpa_milestone',
        type: 'milestone',
        text: `🎯 GPA Milestone reached: Your CGPA (${overallCgpa}) is currently meeting or exceeding your target of ${targetCgpa}!`,
        color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
     });
  } else if (parseFloat(overallAverage) >= targetAverage && isSchool && gradedCoursesCount > 0) {
     academicNotifications.push({
        id: 'average_milestone',
        type: 'milestone',
        text: `🎯 Target Average reached: Your overall average (${overallAverage}%) exceeds your target of ${targetAverage}%!`,
        color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
     });
  }

  realCourses.forEach(c => {
     if (c.rawPercentage >= 85) {
        academicNotifications.push({
           id: `high_score_${c.id}`,
           type: 'success',
           text: `📈 Outstanding performance: You have an A standing in "${c.title}" (${Math.round(c.rawPercentage)}%).`,
           color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
        });
     } else if (c.rawPercentage > 0 && c.rawPercentage < (isSchool ? targetAverage : targetCgpa * 25)) {
        academicNotifications.push({
           id: `low_score_${c.id}`,
           type: 'alert',
           text: `⚠ Action needed: "${c.title}" is currently standing at ${Math.round(c.rawPercentage)}%, which is below your target milestone.`,
           color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'
        });
     }
  });

  if (recentAssessments.length > 0) {
     const latest = recentAssessments[0];
     const course = courses.find(c => c.id === latest.courseId);
     academicNotifications.push({
        id: 'latest_entry',
        type: 'info',
        text: `🔔 New grade entry: "${latest.title}" (${latest.marks}) was recorded for ${course ? course.title : 'Course'}.`,
        color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20'
     });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Top Academic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.tint}`}>{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
            {stat.label === 'Credits Earned' ? (
               <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-2">
                 <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${(totalCreditsCompleted / totalDegreeCredits) * 100}%` }}></div>
               </div>
            ) : stat.label === 'Progress' ? (
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-2">
                 <div className="bg-purple-500 h-1 rounded-full" style={{ width: stat.value }}></div>
               </div>
            ) : (
               <p className="text-[10px] font-bold text-slate-500 mt-1">{stat.sub}</p>
            )}
          </motion.div>
        ))}

        {/* AI Insight Card */}
        {gradedCoursesCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-lg shadow-blue-500/20 text-white relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10 mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1.5">
                <BrainCircuit size={14} /> AI Insight
              </p>
            </div>
            <p className="text-sm font-bold leading-tight relative z-10 mt-1">
              Your grades are trending {isImproving ? 'upward' : 'downward'}.
              {weakestSubject ? ` Consider focusing more on ${weakestSubject.title} to bring up your average.` : " Keep up the good work!"}
            </p>
          </motion.div>
        )}
      </div>

      {/* Main Grid: Chart & Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full">
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">
              {isSchool ? 'Average Progress' : 'GPA Progress'}
           </h3>
           <div className="flex-1 min-h-[250px] w-full mt-2 flex items-center justify-center">
             {displayChartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                   <YAxis domain={isSchool ? [0, 100] : [0, 4.0]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }}
                     itemStyle={{ color: '#3b82f6' }}
                     formatter={(value) => [isSchool ? `${value}%` : value, isSchool ? 'Average' : 'GPA']}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="value" 
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

        {/* Recent Results Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-full">
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">
              Recent Results
           </h3>
           
           <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
             {recentAssessments.length === 0 ? (
               <p className="text-sm text-slate-500 italic p-4">No graded assessments yet.</p>
             ) : recentAssessments.map(assessment => {
               const course = courses.find(c => c.id === assessment.courseId);
               return (
                 <div key={assessment.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <div>
                       <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{assessment.title}</h4>
                       <p className="text-xs text-slate-500 font-medium">{course ? course.title : 'Unknown Subject'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <p className="font-black text-blue-500 text-lg">{assessment.marks}</p>
                    </div>
                 </div>
               );
             })}
           </div>
           
           <button className="w-full mt-auto pt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group">
              View All Assessments <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>

      {/* Academic Activity & Milestones */}
      {academicNotifications.length > 0 && (
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Academic Milestones & Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {academicNotifications.map(notif => (
                  <div key={notif.id} className={`p-4 rounded-2xl text-xs font-semibold ${notif.color}`}>
                     {notif.text}
                  </div>
               ))}
            </div>
         </div>
      )}

    </div>
  );
};

export default GradesOverview;
