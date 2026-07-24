import React, { useState } from 'react';
import { Download, Share2, Award, BookOpen, CheckCircle, Clock, CheckCircle2, FileText, Database } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade } from '../utils/gradeCalculations';
import { isSchoolMode } from '../utils/gradeCenter';

const ReportsTab = ({ gcSettings, selectedYear = 'All' }) => {
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
  const [activeReport, setActiveReport] = useState(isSchool ? 'reportcard' : 'transcript');

  // Process data
  let totalCreditsEarned = 0;
  let totalGradePoints = 0;
  let overallPercentageSum = 0;
  let gradedCoursesCount = 0;
  
  const processedCourses = courses.filter(c => c.semesterId).map(course => {
    const { totalScore, totalWeight, rawPercentage, currentGrade, gpaValue, currentMarks } = calculateCourseGrade(course.id, assignments);

    if (totalWeight > 0) {
       totalCreditsEarned += (course.credits || 3);
       totalGradePoints += (gpaValue * (course.credits || 3));
       overallPercentageSum += rawPercentage;
       gradedCoursesCount++;
    }

    return {
      ...course,
      credits: course.credits || 3,
      grade: currentGrade,
      gpaValue,
      score: currentMarks,
      rawPercentage
    };
  });

  const cumulativeGpa = totalCreditsEarned > 0 ? (totalGradePoints / totalCreditsEarned).toFixed(2) : "0.00";
  const overallAvg = gradedCoursesCount > 0 ? `${Math.round(overallPercentageSum / gradedCoursesCount)}%` : '--';

  // Group by semesters
  const transcriptData = semesters.map(sem => {
    const semCourses = processedCourses.filter(c => c.semesterId === sem.id);
    let termGradePoints = 0;
    let termCredits = 0;
    let semPercentageSum = 0;
    let semGradedCount = 0;

    semCourses.forEach(c => {
       if (c.grade !== '--') {
          termGradePoints += (c.gpaValue * c.credits);
          termCredits += c.credits;
          semPercentageSum += c.rawPercentage;
          semGradedCount++;
       }
    });

    const termGpa = termCredits > 0 ? (termGradePoints / termCredits).toFixed(2) : "0.00";
    const termAvg = semGradedCount > 0 ? `${Math.round(semPercentageSum / semGradedCount)}%` : '--';

    return {
      ...sem,
      courses: semCourses,
      termGpa,
      termAvg,
      termCredits
    };
  }).filter(sem => sem.courses.length > 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Selector Subtabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 gap-4 print:hidden">
         {isSchool ? (
            <button
               onClick={() => setActiveReport('reportcard')}
               className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeReport === 'reportcard' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
            >
               Report Card
            </button>
         ) : (
            <>
               <button
                  onClick={() => setActiveReport('transcript')}
                  className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeReport === 'transcript' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
               >
                  Official Transcript
               </button>
               <button
                  onClick={() => setActiveReport('credit')}
                  className={`py-3.5 px-1 font-black uppercase tracking-widest text-xs border-b-2 transition-all ${activeReport === 'credit' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-655'}`}
               >
                  Credit Breakdown
               </button>
            </>
         )}
      </div>

      {/* Export Toolbar */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 print:hidden">
         <span className="text-xs font-bold text-slate-500">Export formats: PDF (via Print), dynamic CSV.</span>
         <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
            <Download size={14} /> Export Document
         </button>
      </div>

      {activeReport === 'transcript' && (
         <div className="relative bg-white dark:bg-slate-950 p-8 md:p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto printable-area overflow-hidden">
            {/* Header branding */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-100 dark:border-slate-900 pb-8 mb-8 gap-4">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Academic Record</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">Grade Center Official Transcript Summary</p>
               </div>
               <div className="text-left md:text-right text-sm text-slate-500">
                  <p className="font-bold text-slate-900 dark:text-white">Degree: <span className="font-medium text-slate-600 dark:text-slate-400">{gcSettings.degreeName || 'Undergraduate'}</span></p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">Date Issued: <span className="font-medium text-slate-600 dark:text-slate-400">{new Date().toLocaleDateString()}</span></p>
               </div>
            </div>

            {/* Stats Block */}
            <div className="relative z-10 flex justify-between items-center bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-10 shadow-sm">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cumulative GPA</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{cumulativeGpa}</h3>
               </div>
               <div className="text-center border-x border-slate-100 dark:border-slate-800 px-12">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Credits Earned</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalCreditsEarned}</h3>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Academic Standing</p>
                  <div className={`inline-flex items-center gap-1.5 font-black mt-1 ${parseFloat(cumulativeGpa) >= 2.0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                     {parseFloat(cumulativeGpa) >= 2.0 ? <><CheckCircle2 size={18} /> Good Standing</> : 'Probation'}
                  </div>
               </div>
            </div>

            {/* Transcript Table list */}
            <div className="relative z-10 space-y-10">
               {transcriptData.map(sem => (
                  <div key={sem.id}>
                     <h4 className="font-bold text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-800 pb-2 mb-4 uppercase tracking-wider text-sm flex justify-between items-end">
                        <span>{sem.title} {sem.year ? `- ${sem.year}` : ''}</span>
                     </h4>
                     <table className="w-full text-left">
                        <thead>
                           <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-3 w-1/2">Course Title</th>
                              <th className="pb-3 text-center">Credits</th>
                              <th className="pb-3 text-center">Grade</th>
                              <th className="pb-3 text-right">Points</th>
                           </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300">
                           {sem.courses.map(course => (
                              <tr key={course.id} className="border-b border-slate-50 dark:border-slate-800/50">
                                 <td className="py-3">{course.title}</td>
                                 <td className="py-3 text-center">{course.credits.toFixed(1)}</td>
                                 <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{course.grade}</td>
                                 <td className="py-3 text-right">{(course.gpaValue * course.credits).toFixed(1)}</td>
                              </tr>
                           ))}
                        </tbody>
                        <tfoot>
                           <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-4">
                              <td className="pt-4" colSpan="3">Term GPA: <span className="text-slate-900 dark:text-white">{sem.termGpa}</span></td>
                              <td className="pt-4 text-right">Term Credits: <span className="text-slate-900 dark:text-white">{sem.termCredits.toFixed(1)}</span></td>
                           </tr>
                        </tfoot>
                     </table>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeReport === 'reportcard' && (
         <div className="bg-white dark:bg-slate-950 p-8 md:p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto printable-area overflow-hidden">
            <div className="border-b-2 border-slate-100 dark:border-slate-900 pb-8 mb-8">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Report Card</h2>
               <p className="text-sm font-bold text-slate-500 mt-1">Official Academic Term Breakdown</p>
            </div>

            <div className="space-y-8">
               {transcriptData.map(term => (
                  <div key={term.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{term.title}</h4>
                        <span className="font-black text-blue-500">Term Average: {term.termAvg}</span>
                     </div>
                     <table className="w-full text-left">
                        <thead>
                           <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <th className="pb-2">Subject Name</th>
                              <th className="pb-2 text-right">Score</th>
                           </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300">
                           {term.courses.map(c => (
                              <tr key={c.id} className="border-b border-slate-50 dark:border-slate-900/50">
                                 <td className="py-2.5">{c.title}</td>
                                 <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">{c.score}</td>
                              </tr>
                           ))}
                        </tbody>
                      </table>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeReport === 'credit' && (
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm max-w-xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Degree Credit Analysis</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Overview of completed and pending credit requirements.</p>

            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                     <span>Degree Core Progress</span>
                     <span>{totalCreditsEarned} / {gcSettings.totalCreditsRequired || 120} Credits</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-3">
                     <div 
                        className="bg-blue-500 h-3 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (totalCreditsEarned / (gcSettings.totalCreditsRequired || 120)) * 100)}%` }}
                     />
                  </div>
               </div>

               <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-center">
                  <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Earned Credits</p>
                     <h4 className="text-3xl font-black text-slate-900 dark:text-white">{totalCreditsEarned}</h4>
                  </div>
                  <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Remaining Credits</p>
                     <h4 className="text-3xl font-black text-slate-900 dark:text-white">
                       {Math.max(0, (gcSettings.totalCreditsRequired || 120) - totalCreditsEarned)}
                     </h4>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ReportsTab;
