import React from 'react';
import {
  Edit2,
  Trash2,
  ExternalLink,
  BookOpen,
  Clock,
  FolderOpen,
  FileText,
  MoreHorizontal,
  Check,
  ArchiveRestore,
  Archive,
  CalendarDays,
  PlayCircle,
  StickyNote,
  Video,
  Flag,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ShieldAlert,
  GripVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const CourseItem = ({
  course,
  onEdit,
  onDelete,
  onViewResources,
  onOpenDetail,
  onToggleArchive,
  onContinue,
  assignments = [],
  meta = {},
  selected = false,
  onToggleSelect
}) => {
  const relatedAssignments = assignments.filter((a) => a.courseId === course.id);
  const upcomingAssignment = relatedAssignments
    .filter((a) => a.deadline && a.status !== 'Submitted')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] || null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const preferredExternalUrl = course.playlistUrl || course.courseUrl || course.certificateUrl || '';

  const formatUpdatedLabel = (value) => {
    if (!value) return 'No recent updates';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No recent updates';
    return `Updated ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  // Generate a mock 7-day sparkline array using the course id as a seed so it remains consistent
  const getSparklineData = React.useMemo(() => {
    const data = [];
    let prev = 20;
    const seedStr = String(course.id);
    for (let i = 0; i < 7; i++) {
      const seedNum = seedStr.charCodeAt(i % seedStr.length) || 50;
      prev = Math.max(10, Math.min(100, prev + (seedNum % 30) - 15));
      data.push({ day: i, value: prev });
    }
    return data;
  }, [course.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'Completed':
        return 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400';
      case 'Paused':
        return 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
      case 'Medium':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getHealthConfig = (health) => {
    if (health === 'Completed') return { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' };
    if (health === 'Paused') return { icon: PauseCircle, color: 'text-amber-500', label: 'Paused' };
    if (health === 'At Risk') return { icon: ShieldAlert, color: 'text-rose-500', label: 'At Risk' };
    if (health === 'Behind') return { icon: AlertTriangle, color: 'text-amber-500', label: 'Behind' };
    return { icon: CheckCircle2, color: 'text-sky-500', label: 'On Track' };
  };

  const closeMenu = (event) => {
    const detailsEl = event.currentTarget.closest('details');
    if (detailsEl) detailsEl.removeAttribute('open');
  };

  const health = meta.health || 'On Track';
  const healthConfig = getHealthConfig(health);
  const HealthIcon = healthConfig.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="card group flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary-200/70 dark:hover:border-primary-500/30 transition-all relative"
    >
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
          >
            <GripVertical size={16} />
          </div>
          <button
            type="button"
            onClick={() => onToggleSelect?.(course.id)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              selected
                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-primary-400'
            }`}
            aria-label={`Select ${course.title}`}
          >
            <Check size={12} />
          </button>
          <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(course.status)}`}>
            {course.status}
          </div>
          <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getPriorityColor(course.priority || 'Medium')}`}>
            <Flag size={11} className="inline mr-1" />
            {course.priority || 'Medium'}
          </div>
          {course.archived && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Archived
            </div>
          )}
        </div>

        <details className="relative">
          <summary className="list-none cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={16} />
          </summary>
          <div className="absolute right-0 top-11 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 p-1.5">
            <button
              type="button"
              onClick={(e) => {
                onOpenDetail?.(course);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Details
            </button>
            <button
              type="button"
              onClick={(e) => {
                onEdit(course);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                onToggleArchive?.(course);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              {course.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {course.archived ? 'Restore' : 'Archive'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                onDelete(course.id);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </details>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 line-clamp-1">
            {course.title}
          </h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <ExternalLink size={14} className="text-primary-500" />
            {course.platform}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <HealthIcon size={14} className={healthConfig.color} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{healthConfig.label}</span>
          </div>
          
          <div className="h-8 w-24 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getSparklineData}>
                <defs>
                  <linearGradient id={`colorValue${course.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#colorValue${course.id})`} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(course.tags || []).slice(0, 4).map((tag, i) => (
            <span key={`${tag}-${i}`} className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              #{tag}
            </span>
          ))}
          {(course.tags || []).length > 4 && (
            <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              +{course.tags.length - 4}
            </span>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Next Task</p>
          {upcomingAssignment ? (
            <>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                {upcomingAssignment.title || 'Assignment'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-primary-500" />
                Due {new Date(upcomingAssignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No upcoming assignments linked</p>
          )}
        </div>
      </div>

      <div className="space-y-4 mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {course.trackingType === 'time' ? 'Time Spent' : course.trackingType === 'modules' ? 'Modules' : 'Mastery'}
          </span>
          <span className="text-sm font-black text-primary-500">
            {course.trackingType === 'time'
              ? `${course.timeTracking?.current || '0:00'}`
              : course.trackingType === 'modules'
                ? `${course.moduleTracking?.completed || 0}/${course.moduleTracking?.total || 0}`
                : `${course.progress}%`}
          </span>
        </div>

        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            className="h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-primary-500" />
            {course.difficulty}
          </div>
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-amber-500" />
            {meta.assignmentCount ?? relatedAssignments.length} assignments
          </div>
          <div className="flex items-center gap-1.5">
            <StickyNote size={13} className="text-indigo-500" />
            {meta.noteCount ?? 0} notes
          </div>
          <div className="flex items-center gap-1.5">
            <Video size={13} className="text-rose-500" />
            {meta.videoCount ?? 0} videos
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onContinue?.(course)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-colors"
          >
            <PlayCircle size={14} className="inline mr-1" />
            Continue
          </button>
          <button
            onClick={() => onOpenDetail?.(course)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Details
          </button>
          {preferredExternalUrl ? (
            <a
              href={preferredExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 hover:border-primary-300 transition-colors"
              title="Open course link"
            >
              <ExternalLink size={15} />
            </a>
          ) : (
            <button
              onClick={() => onViewResources(course)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 hover:border-primary-300 transition-colors"
              title="View resources"
            >
              <FolderOpen size={15} />
            </button>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 pt-1">
          {formatUpdatedLabel(course.updatedAt || course.createdAt)}
        </p>
      </div>
    </motion.div>
  );
};

export default CourseItem;
