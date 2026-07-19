import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, LayoutDashboard, CalendarDays, BookOpen, Calculator, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import GradesOverview from './components/GradesOverview';
import SemesterManagement from './components/SemesterManagement';
import SubjectGradeManagement from './components/SubjectGradeManagement';
import GradeCalculator from './components/GradeCalculator';
import TranscriptGenerator from './components/TranscriptGenerator';

const Grades = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'semesters', label: 'Semesters', icon: CalendarDays },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'transcript', label: 'Transcript', icon: FileText }
  ];

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 relative">
      {/* Background Glows Wrapper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem]">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
      </div>
      
      <div className="relative z-10 p-4 lg:p-8">
        <PageHeader
          title="Academic Tracker"
          description="Comprehensive grade tracking, forecasting, and GPA management"
          icon={<GraduationCap size={28} />}
          className="mb-8"
        />

        {/* Navigation Tabs */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 w-max">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <GradesOverview />}
            {activeTab === 'semesters' && <SemesterManagement />}
            {activeTab === 'subjects' && <SubjectGradeManagement />}
            {activeTab === 'calculator' && <GradeCalculator />}
            {activeTab === 'transcript' && <TranscriptGenerator />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Grades;
