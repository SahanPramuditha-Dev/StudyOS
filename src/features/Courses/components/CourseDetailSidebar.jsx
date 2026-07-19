import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Video,
  StickyNote,
  Link as LinkIcon,
  Trash2,
  Clock,
  Layout,
  BarChart,
  Flag,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '../../../components/ui/Select';
import AIRecommendations from '../../../components/AIRecommendations';
import ReactMarkdown from 'react-markdown';

const MODULE_STATUSES = ['Not Started', 'In Progress', 'Completed'];

// A reusable SVG circular progress ring component
const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary-500 transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-700 dark:text-slate-200">{progress}%</span>
    </div>
  );
};

const CourseDetailSidebar = ({
  selectedCourseDetail,
  selectedDetailMeta,
  detailTab,
  setDetailTab,
  handleContinueCourse,
  studyTimer,
  toggleStudySession,
  handleEdit,
  setSelectedCourseDetail,
  updateModuleInSelectedCourse,
  removeModuleFromSelectedCourse
}) => {
  if (!selectedCourseDetail) return null;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'modules', label: 'Modules' },
    { id: 'notes', label: 'Notes' },
    { id: 'resources', label: 'Resources' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'videos', label: 'Videos' },
    { id: 'activity', label: 'Activity' }
  ];

  const getGradientForCategory = (category) => {
    const gradients = {
      'Programming': 'from-blue-500 to-indigo-600',
      'Design': 'from-pink-500 to-rose-500',
      'Business': 'from-emerald-500 to-teal-600',
      'Marketing': 'from-orange-400 to-amber-500',
      'Science': 'from-cyan-500 to-blue-500',
      'Default': 'from-slate-600 to-slate-800'
    };
    return gradients[category] || gradients['Default'];
  };

  const bannerGradient = getGradientForCategory(selectedCourseDetail.category);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedCourseDetail(null)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-[860px] h-[85vh] max-h-[850px] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-primary-500/10 overflow-hidden flex flex-col"
      >
        {/* Dynamic Gradient Banner Header */}
        <div className={`relative h-32 bg-gradient-to-r ${bannerGradient} shrink-0`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent" />
          
          {/* Floating Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => {
                if (studyTimer.isRunning && studyTimer.course?.id !== selectedCourseDetail.id) {
                  toast.error(`A session is already running for ${studyTimer.course.title}`);
                  return;
                }
                toggleStudySession(selectedCourseDetail);
              }}
              className={`px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md transition-all ${
                studyTimer.isRunning && studyTimer.course?.id === selectedCourseDetail.id
                  ? 'bg-rose-500 hover:bg-rose-600 border border-rose-400 shadow-rose-500/30'
                  : 'bg-primary-500 hover:bg-primary-600 border border-primary-400 shadow-primary-500/30'
              }`}
            >
              {studyTimer.isRunning && studyTimer.course?.id === selectedCourseDetail.id ? 'End Session' : 'Start Session'}
            </button>
            <button 
              onClick={() => handleEdit(selectedCourseDetail)} 
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white shadow-lg backdrop-blur-md transition-all"
            >
              <FileText size={16} />
            </button>
            <button 
              onClick={() => setSelectedCourseDetail(null)} 
              className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-white shadow-lg backdrop-blur-md transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Title and Pills Section */}
        <div className="px-8 pb-6 -mt-12 relative z-10 shrink-0">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl border border-white/50 dark:border-slate-700/50">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">
                  {selectedCourseDetail.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1.5 flex items-center gap-2">
                  <span>{selectedCourseDetail.platform}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>{selectedCourseDetail.category}</span>
                </p>
              </div>
              <div className="text-primary-500">
                <ProgressRing progress={selectedCourseDetail.progress || 0} size={56} />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {selectedCourseDetail.courseHours && (
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
                  <Clock size={12} /> {selectedCourseDetail.courseHours}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Activity size={12} /> {selectedCourseDetail.status}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-300 flex items-center gap-1.5">
                <Flag size={12} /> {selectedCourseDetail.priority}
              </span>
              {selectedDetailMeta?.health && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {selectedDetailMeta.health}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Animated Tabs */}
        <div className="px-8 pb-4 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors z-10 ${
                  detailTab === tab.id ? 'text-primary-600 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {detailTab === tab.id && (
                  <motion.div
                    layoutId="activeTabSidebar"
                    className="absolute inset-0 bg-primary-50 dark:bg-primary-500/20 rounded-xl -z-10 shadow-sm border border-primary-100 dark:border-primary-500/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Tab Content with AnimatePresence */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={detailTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Modules', value: `${selectedDetailMeta?.moduleCompleted || 0}/${selectedDetailMeta?.moduleTotal || 0}`, icon: Layout },
                      { label: 'Time Spent', value: selectedCourseDetail.timeTracking?.current || '00:00:00', icon: Clock },
                      { label: 'Difficulty', value: selectedCourseDetail.difficulty, icon: BarChart },
                      { label: 'Health', value: selectedDetailMeta?.health || 'On Track', icon: Activity }
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between aspect-square">
                          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-primary-500">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Clock size={14} /> Critical Dates
                      </p>
                      <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-slate-900" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedCourseDetail.startDate || 'Not set'}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-400 ring-4 ring-white dark:ring-slate-900" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Completion</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedCourseDetail.targetDate || 'Not set'}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-white dark:ring-slate-900" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam / Certificate</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {selectedCourseDetail.examDate || selectedCourseDetail.certificateDeadline || 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-5 rounded-[2rem] bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                          <AlertCircle size={64} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 relative z-10">
                          Next Recommended Action
                        </p>
                        <p className="text-lg font-bold relative z-10 leading-tight">
                          {selectedDetailMeta?.nextAction || 'Continue to your next module and keep up the momentum!'}
                        </p>
                        <button 
                          onClick={() => handleContinueCourse(selectedCourseDetail)}
                          className="mt-4 px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-shadow relative z-10"
                        >
                          Take Action
                        </button>
                      </div>

                      <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <LinkIcon size={14} /> Quick Links
                        </p>
                        <div className="space-y-2">
                          {[['Course URL', selectedCourseDetail.courseUrl], ['Playlist URL', selectedCourseDetail.playlistUrl], ['Certificate URL', selectedCourseDetail.certificateUrl]].map(([label, url]) => (
                            <div key={label} className="flex items-center justify-between gap-2 text-sm p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <span className="font-bold text-slate-600 dark:text-slate-400">{label}</span>
                              {url ? (
                                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-500 font-bold hover:underline">
                                  Open <ExternalLink size={14} />
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">Not set</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <AIRecommendations title={selectedCourseDetail.title} description={selectedCourseDetail.category} />
                      
                      {selectedCourseDetail.syllabus && (
                        <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <FileText size={14} /> Course Syllabus
                          </p>
                          <div className="prose prose-sm dark:prose-invert prose-indigo max-w-none">
                            <ReactMarkdown>{selectedCourseDetail.syllabus}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modules Tab */}
              {detailTab === 'modules' && (
                <div className="space-y-3">
                  {(selectedCourseDetail.modules || []).length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 border-dashed shadow-sm flex flex-col items-center justify-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 mb-3">
                        <Layout size={24} />
                      </div>
                      <h3 className="text-slate-700 dark:text-slate-200 font-black mb-1">No Modules Yet</h3>
                      <p className="text-slate-400 text-sm mb-6 max-w-[250px]">Break down your course into manageable modules to track progress.</p>
                      <button className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                        + Add Module
                      </button>
                    </div>
                  ) : (
                    selectedCourseDetail.modules.map((module, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={module.id} 
                        className={`p-4 rounded-2xl border ${module.completed ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'} shadow-sm`}
                      >
                        <div className="flex gap-4">
                          <div className="mt-1 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={module.completed}
                              onChange={(e) => {
                                const completed = e.target.checked;
                                updateModuleInSelectedCourse(
                                  module.id,
                                  (current) => ({ ...current, completed, status: completed ? 'Completed' : 'Not Started' }),
                                  `Module marked ${completed ? 'completed' : 'incomplete'}: ${module.title}`
                                );
                              }}
                              className="w-5 h-5 rounded-full border-slate-300 text-primary-500 focus:ring-primary-500 transition-colors"
                            />
                          </div>
                          <div className="flex-1">
                            <p className={`font-black text-lg ${module.completed ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-70' : 'text-slate-800 dark:text-white'}`}>
                              {module.title}
                            </p>
                            
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Select
                                value={module.status}
                                onChange={(val) => {
                                  const status = val;
                                  updateModuleInSelectedCourse(
                                    module.id,
                                    (current) => ({ ...current, status, completed: status === 'Completed' }),
                                    `Module status changed: ${module.title} -> ${status}`
                                  );
                                }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300"
                                options={MODULE_STATUSES.map(status => ({ label: status, value: status }))}
                              />
                              
                              <input
                                value={module.duration || ''}
                                onChange={(e) => {
                                  updateModuleInSelectedCourse(
                                    module.id,
                                    (current) => ({ ...current, duration: e.target.value }),
                                    `Duration updated: ${module.title}`
                                  );
                                }}
                                placeholder="Duration (e.g. 1h 30m)"
                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold w-32 text-slate-600 dark:text-slate-300"
                              />

                              <button
                                onClick={() => removeModuleFromSelectedCourse(module.id)}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10 text-xs font-bold transition-colors ml-auto flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            </div>

                            {(module.notesLink || module.resourceLink || module.videoUrl) && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-3 text-xs font-bold">
                                {module.notesLink && (
                                  <a href={module.notesLink} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">
                                    <StickyNote size={12} /> Notes
                                  </a>
                                )}
                                {module.resourceLink && (
                                  <a href={module.resourceLink} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    <LinkIcon size={12} /> Resource
                                  </a>
                                )}
                                {module.videoUrl && (
                                  <a href={module.videoUrl} target="_blank" rel="noreferrer" className="text-rose-500 hover:text-rose-600 inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">
                                    <Video size={12} /> Video
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* Other Tabs (Notes, Resources, Assignments, Videos, Activity) */}
              {['notes', 'resources', 'assignments', 'videos', 'activity'].includes(detailTab) && (
                <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 border-dashed shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 mb-3">
                    <FileText size={24} />
                  </div>
                  <p className="text-slate-500 font-bold">Content for {detailTab} will appear here.</p>
                  <p className="text-xs text-slate-400 mt-1">This section can be populated via linking items to this course.</p>
                </div>
              )}
              
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default CourseDetailSidebar;
