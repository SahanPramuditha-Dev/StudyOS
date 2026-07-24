import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  CheckSquare, 
  Calculator, 
  TrendingUp, 
  FileText, 
  Target, 
  BrainCircuit, 
  Download, 
  Plus, 
  Settings 
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';

// Tabs Components
import GradesOverview from './components/GradesOverview';
import AcademicTimeline from './components/AcademicTimeline';
import SubjectsTab from './components/SubjectsTab';
import AssessmentsTab from './components/AssessmentsTab';
import CalculatorsTab from './components/CalculatorsTab';
import AnalyticsTab from './components/AnalyticsTab';
import ReportsTab from './components/ReportsTab';
import GoalsTab from './components/GoalsTab';
import AIAdvisorTab from './components/AIAdvisorTab';
import OnboardingModal from './components/OnboardingModal';

const Grades = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState('All');
  const [gradeCenterSettings, setGradeCenterSettings] = useStorage(STORAGE_KEYS.GRADE_CENTER, {
    mode: null,
    schoolLevel: null,
    universityLevel: null,
    degreeName: '',
    major: '',
    totalCreditsRequired: 120,
    expectedGraduation: '',
    gradeScale: 'standard_4.0',
    targetCgpa: 3.5,
    totalDegreeCredits: 120
  });

  const [semesters, setSemesters] = useStorage(STORAGE_KEYS.SEMESTERS, []);
  const [courses, setCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);

  // Quick Action Modals Trigger States
  const [quickAddAssessmentOpen, setQuickAddAssessmentOpen] = useState(false);

  if (!gradeCenterSettings || gradeCenterSettings.mode === null) {
    return (
      <OnboardingModal 
        onSave={(data) => {
          setGradeCenterSettings(data);
        }} 
      />
    );
  }

  const isSchool = gradeCenterSettings.mode === 'school';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'timeline', label: isSchool ? 'Timeline' : 'Timeline', icon: CalendarDays },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'assessments', label: 'Assessments', icon: CheckSquare },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'ai-advisor', label: 'AI Advisor', icon: BrainCircuit }
  ];

  const handleExportAll = () => {
    window.print();
  };

  const handleResetSettings = () => {
    if (confirm("Reset Grade Center settings? This will clear your academic configuration (but keep your course marks).")) {
      setGradeCenterSettings({
        mode: null,
        schoolLevel: null,
        universityLevel: null,
        degreeName: '',
        major: '',
        totalCreditsRequired: 120,
        expectedGraduation: '',
        gradeScale: 'standard_4.0',
        targetCgpa: 3.5,
        totalDegreeCredits: 120
      });
    }
  };

  const uniqueYears = ['All', ...new Set(semesters.map(s => s.year).filter(Boolean))].sort((a,b) => b - a);

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 relative">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem]">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
      </div>

      <div className="relative z-10 p-4 lg:p-8">
        {/* Adaptive Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
          <div>
            <PageHeader
              title="Grade Center"
              description={isSchool ? `School Mode • ${gradeCenterSettings.schoolLevel}` : `${gradeCenterSettings.degreeName} in ${gradeCenterSettings.major}`}
              icon={<GraduationCap size={28} />}
              className="mb-0"
            />
            <p className="text-sm font-bold text-slate-500 mt-2">
              Good evening, Sahan 👋 Track your academic journey, analyze performance and improve results.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5">
               <span className="text-slate-400">Year:</span>
               <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-700 dark:text-slate-355 select-none"
               >
                  {uniqueYears.map(year => (
                     <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
                  ))}
               </select>
            </div>
            <button 
              onClick={handleResetSettings}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5"
              title="Reset Settings"
            >
              <Settings size={14} /> Mode
            </button>
            <button 
              onClick={handleExportAll}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5"
            >
              <Download size={14} /> Export Report
            </button>
            <button 
              onClick={() => {
                setActiveTab('assessments');
                setQuickAddAssessmentOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus size={14} /> Add Result
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 relative print:hidden">
          <style>{`
            .grade-nav-scrollbar::-webkit-scrollbar {
              height: 5px;
            }
            .grade-nav-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .grade-nav-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 99px;
            }
            .dark .grade-nav-scrollbar::-webkit-scrollbar-thumb {
              background: #334155;
            }
            .grade-nav-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #cbd5e1 transparent;
            }
            .dark .grade-nav-scrollbar {
              scrollbar-color: #334155 transparent;
            }
          `}</style>
          <div className="overflow-x-auto pb-3 border-b border-slate-100 dark:border-slate-800/50 grade-nav-scrollbar">
            <div className="flex gap-2 w-max pr-8">
              {tabs.map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setQuickAddAssessmentOpen(false);
                    }}
                    className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <TabIcon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Fading side indicators to show scrolling capability */}
          <div className="absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <GradesOverview gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'timeline' && <AcademicTimeline gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'subjects' && <SubjectsTab gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'assessments' && <AssessmentsTab quickAddOpen={quickAddAssessmentOpen} gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'calculators' && <CalculatorsTab gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'analytics' && <AnalyticsTab gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'reports' && <ReportsTab gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'goals' && <GoalsTab gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
            {activeTab === 'ai-advisor' && <AIAdvisorTab gcSettings={gradeCenterSettings} selectedYear={selectedYear} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Grades;
