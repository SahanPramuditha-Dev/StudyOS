import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Github, 
  Database, 
  Timer,
  AlertCircle,
  Activity,
  FileText,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectOverview = ({ project, stats, onNavigate }) => {
  const getDeadlineInfo = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: 'Overdue', color: 'bg-red-500/90 text-white', icon: AlertCircle, label: 'Missed' };
    if (days === 0) return { text: 'Due Today', color: 'bg-orange-500/90 text-white', icon: Clock, label: 'Urgent' };
    if (days <= 3) return { text: `${days} days left`, color: 'bg-amber-500/90 text-white', icon: Timer, label: 'Closing' };
    return { text: `${days} days left`, color: 'bg-slate-900/90 text-white', icon: Timer, label: 'Ongoing' };
  };

  const deadlineInfo = getDeadlineInfo(project.deadline);
  const storageMB = (((project.files || []).reduce((acc, f) => acc + (f.size || 0), 0) || 0) / (1024 * 1024)).toFixed(2);
  const storageLimit = 50; // 50MB limit for student projects
  const storagePercent = Math.min((parseFloat(storageMB) / storageLimit) * 100, 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Execution Progress */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-1 rounded-lg">
              {stats.progress}% Done
            </span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Project Execution</p>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className="h-full bg-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <Database size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
              {storageMB}MB / {storageLimit}MB
            </span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Cloud Storage</p>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${storagePercent}%` }}
                className={`h-full ${storagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
              />
            </div>
          </div>
        </div>

        {/* Assets Count */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-500">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Study Assets</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">{project.files?.length || 0}</p>
          </div>
        </div>

        {/* Deadline Countdown */}
        {deadlineInfo ? (
          <div className={`glass rounded-3xl p-6 border border-slate-100 dark:border-slate-800 ${deadlineInfo.color} shadow-lg flex items-center gap-4 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <deadlineInfo.icon size={60} />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                {deadlineInfo.label} Countdown
              </p>
              <p className="text-lg font-black leading-none">
                {deadlineInfo.text}
              </p>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-6 border-dashed border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">No Deadline Set</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Context */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <AlertCircle size={18} className="text-primary-500" />
                  {project.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    {project.subject || 'General'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                    project.status === 'Ongoing' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                    project.status === 'Submitted' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                    'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
              {project.repo && (
                <a href={project.repo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-primary-500 uppercase tracking-widest transition-all">
                  <Github size={12} />
                  Repo Insight
                </a>
              )}
            </div>
            <p className="text-slate-400 font-semibold text-xs leading-relaxed">
              {project.description || 'No description provided for this architectural vision.'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {project.stack?.split(',').map(s => (
                <span key={s} className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider border border-slate-100 dark:border-slate-800/80">
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              Execution History
            </h3>
            <div className="space-y-5">
              {(project.activity || []).length > 0 ? (
                project.activity.map((act, i) => (
                  <div key={act.id} className="flex gap-4 relative">
                    {i !== project.activity.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-20px] w-0.5 bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{act.detail}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {new Date(act.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center opacity-30">
                  <p className="text-[9px] font-black uppercase tracking-widest dark:text-slate-500">No activity logged yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">System Access</h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'files', label: 'Study Materials', icon: Database, color: 'text-blue-500', desc: 'PDFs, Slides & ZIPs' },
              { id: 'tasks', label: 'Task Pipeline', icon: CheckCircle2, color: 'text-primary-500', desc: 'Kanban & Deadlines' },
              { id: 'code', label: 'Code Workspace', icon: Github, color: 'text-slate-900 dark:text-white', desc: 'Snippets & Github' },
              { id: 'docs', label: 'Documentation', icon: FileText, color: 'text-purple-500', desc: 'SRS & Reports' }
            ].map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-primary-500/20 hover:shadow-lg hover:shadow-primary-500/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 ${link.color}`}>
                    <link.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white">{link.label}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{link.desc}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
