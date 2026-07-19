import React from 'react';
import { Download, Share2, CheckCircle2, FileText, Database } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';

const TranscriptGenerator = () => {
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [semesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);

  // Process data for transcript
  let totalCreditsEarned = 0;
  let totalGradePoints = 0;
  
  const processedCourses = courses.map(course => {
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

    let grade = '--';
    let points = 0;
    
    if (totalWeight > 0) {
       const normalized = (totalScore / totalWeight) * 100;
       if (normalized >= 90) { grade = 'A+'; points = 4.0; }
       else if (normalized >= 85) { grade = 'A'; points = 4.0; }
       else if (normalized >= 80) { grade = 'A-'; points = 3.7; }
       else if (normalized >= 75) { grade = 'B+'; points = 3.3; }
       else if (normalized >= 70) { grade = 'B'; points = 3.0; }
       else if (normalized >= 65) { grade = 'B-'; points = 2.7; }
       else if (normalized >= 60) { grade = 'C+'; points = 2.3; }
       else if (normalized >= 50) { grade = 'C'; points = 2.0; }
       else { grade = 'F'; points = 0; }
       
       const c = course.credits || 3;
       totalCreditsEarned += c;
       totalGradePoints += (points * c);
    }

    return {
       ...course,
       grade,
       gpaValue: points,
       credits: course.credits || 3
    };
  });

  const cumulativeGpa = totalCreditsEarned > 0 ? (totalGradePoints / totalCreditsEarned).toFixed(2) : "0.00";
  const hasData = processedCourses.length > 0;

  // Group by Semesters
  const transcriptData = semesters.map(sem => {
     const semCourses = processedCourses.filter(c => c.semesterId === sem.id);
     let semCredits = 0;
     let semPoints = 0;
     semCourses.forEach(c => {
        if (c.grade !== '--') {
           semCredits += c.credits;
           semPoints += (c.gpaValue * c.credits);
        }
     });
     return {
        ...sem,
        courses: semCourses,
        termGpa: semCredits > 0 ? (semPoints / semCredits).toFixed(2) : "0.00",
        termCredits: semCredits
     };
  }).filter(sem => sem.courses.length > 0);

  // Add unassigned courses if any
  const unassigned = processedCourses.filter(c => !c.semesterId);
  if (unassigned.length > 0) {
     let uCredits = 0;
     let uPoints = 0;
     unassigned.forEach(c => {
        if (c.grade !== '--') {
           uCredits += c.credits;
           uPoints += (c.gpaValue * c.credits);
        }
     });
     transcriptData.push({
        id: 'unassigned',
        title: 'Unassigned Courses',
        courses: unassigned,
        termGpa: uCredits > 0 ? (uPoints / uCredits).toFixed(2) : "0.00",
        termCredits: uCredits
     });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Academic Transcript</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Official Record Generation</p>
         </div>
         {hasData && (
           <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 <Share2 size={20} />
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95" onClick={() => window.print()}>
                 <Download size={18} /> Export PDF
              </button>
           </div>
         )}
      </div>

      {!hasData ? (
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
               <Database size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No Academic Data</h3>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
               Your transcript will automatically generate here once you've added courses and recorded some grades.
            </p>
         </div>
      ) : (
         <div className="bg-[#fcfcfc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl p-10 md:p-16 printable-area relative overflow-hidden">
            
            {/* Subtle watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
               <FileText size={400} />
            </div>

            {/* Document Header */}
            <div className="relative z-10 flex justify-between items-start border-b-2 border-slate-900 dark:border-white pb-8 mb-8">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">StudyOS</h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">Academic Record Transcript</p>
               </div>
               <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">Student Name: <span className="font-medium text-slate-600 dark:text-slate-400">Not Configured</span></p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">Student ID: <span className="font-medium text-slate-600 dark:text-slate-400">---</span></p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">Date Issued: <span className="font-medium text-slate-600 dark:text-slate-400">{new Date().toLocaleDateString()}</span></p>
               </div>
            </div>

            {/* Academic Standing */}
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

            {/* Transcript Table */}
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
            
            <div className="relative z-10 mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
               <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">End of Transcript</p>
               <p className="text-[10px] text-slate-400 mt-2">Generated securely by StudyOS Platform</p>
            </div>
         </div>
      )}
    </div>
  );
};

export default TranscriptGenerator;
