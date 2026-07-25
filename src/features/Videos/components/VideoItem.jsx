import React from 'react';
import {
  PlayCircle,
  MoreHorizontal,
  Check,
  ArchiveRestore,
  Archive,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { motion } from 'framer-motion';

const formatTime = (s) => {
  if (!s || s <= 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  return `${m}:${sec.toString().padStart(2,'0')}`;
};

const formatDuration = (s) => {
  if (!s || s <= 0) return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec > 0 ? sec + 's' : ''}`.trim();
  return `${sec}s`;
};

const TAG_COLORS = [
  { id: 'sky',    bg: 'bg-sky-100 dark:bg-sky-500/20',      text: 'text-sky-700 dark:text-sky-300' },
  { id: 'green',  bg: 'bg-green-100 dark:bg-green-500/20',  text: 'text-green-700 dark:text-green-300' },
  { id: 'amber',  bg: 'bg-amber-100 dark:bg-amber-500/20',  text: 'text-amber-700 dark:text-amber-300' },
  { id: 'rose',   bg: 'bg-rose-100 dark:bg-rose-500/20',    text: 'text-rose-700 dark:text-rose-300' },
  { id: 'violet', bg: 'bg-violet-100 dark:bg-violet-500/20',text: 'text-violet-700 dark:text-violet-300' },
  { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-500/20',text: 'text-orange-700 dark:text-orange-300' },
];

const VideoItem = ({
  video,
  onPlay,
  onDelete,
  onToggleArchive,
  onToggleComplete,
  courses = [],
  globalTags = [],
  selected = false,
  onToggleSelect,
  viewMode = 'grid'
}) => {
  const course = courses.find((c) => c.id === video.courseId);
  const tags = (video.tagIds || []).map(id => globalTags.find(t => t.id === id)).filter(Boolean);

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

  const closeMenu = (event) => {
    const detailsEl = event.currentTarget.closest('details');
    if (detailsEl) detailsEl.removeAttribute('open');
  };

  if (viewMode === 'table') {
    return null; // Handled directly in Videos.jsx for table view
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className={`card group flex flex-col bg-white dark:bg-slate-900 border ${
        video.completed ? 'border-green-200 dark:border-green-500/30' : 'border-slate-100 dark:border-slate-800'
      } p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary-200/70 dark:hover:border-primary-500/30 transition-all relative overflow-hidden`}
    >
      <div className="relative -mt-6 -mx-6 mb-4 h-48 overflow-hidden rounded-t-[1.9rem] group-hover:shadow-inner">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <PlayCircle size={32} className="text-slate-300 dark:text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={() => onPlay(video)} className="p-4 bg-primary-500/90 text-white rounded-full backdrop-blur-md shadow-2xl scale-75 group-hover:scale-100 hover:bg-primary-500 transition-all">
            <PlayCircle size={36} className="fill-current" />
          </button>
        </div>
      </div>

      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onToggleSelect?.(video.id)}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              selected
                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-black/40 backdrop-blur-md border-white/20 text-transparent hover:border-primary-400'
            }`}
            aria-label={`Select ${video.title}`}
          >
            <Check size={14} />
          </button>
          
          {video.completed && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-500 text-white shadow-lg flex items-center gap-1 backdrop-blur-sm">
              <CheckCircle2 size={11} className="fill-current" /> Completed
            </div>
          )}
          {video.archived && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 shadow-lg backdrop-blur-sm">
              Archived
            </div>
          )}
        </div>

        <details className="relative">
          <summary className="list-none cursor-pointer p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-colors [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={18} />
          </summary>
          <div className="absolute right-0 top-11 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 p-1.5">
            <button
              type="button"
              onClick={(e) => {
                onPlay(video);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <PlayCircle size={14} /> Play
            </button>
            <button
              type="button"
              onClick={(e) => {
                onToggleComplete?.(video);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <CheckCircle2 size={14} /> {video.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                onToggleArchive?.(video);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              {video.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {video.archived ? 'Restore' : 'Archive'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                onDelete(video.id);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </details>
      </div>

      <div className="relative z-10 flex-1 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 line-clamp-2 leading-tight">
            {video.title}
          </h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {video.author || 'Unknown Author'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag, i) => {
            const colorClass = TAG_COLORS.find(c => c.id === tag.color) || TAG_COLORS[0];
            return (
              <span key={`${tag.id}-${i}`} className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${colorClass.bg} ${colorClass.text}`}>
                #{tag.name}
              </span>
            );
          })}
          {tags.length > 4 && (
            <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              +{tags.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        {(() => {
          const displayProgress = video.completed
            ? 100
            : (video.duration && video.duration > 0)
              ? Math.min(100, Math.round(((video.lastPosition || 0) / video.duration) * 100))
              : (video.progress || 0);

          const durationDisplay = (video.duration && video.duration > 0)
            ? `${formatTime(video.lastPosition || 0)} / ${formatDuration(video.duration)}`
            : (video.lastPosition > 0 ? `${formatTime(video.lastPosition)} watched` : '0:00');

          return (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={12} /> Progress
                </span>
                <span className="text-sm font-black text-primary-500">
                  {durationDisplay}
                </span>
              </div>

              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${displayProgress}%` }}
                  className="h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                />
              </div>
            </>
          );
        })()}

        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {course && (
            <div className="flex items-center gap-1.5" title={`Linked to Course: ${course.title}`}>
              <BookOpen size={13} className="text-primary-500" />
              <span className="truncate">{course.title}</span>
            </div>
          )}
          {(video.bookmarks?.length > 0) && (
            <div className="flex items-center gap-1.5" title={`${video.bookmarks.length} bookmarks`}>
              <Bookmark size={13} className="text-amber-500" />
              <span>{video.bookmarks.length} Bookmarks</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onPlay(video)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-colors flex justify-center items-center gap-1.5"
          >
            <PlayCircle size={14} />
            {video.progress > 0 && !video.completed ? 'Resume' : 'Play'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pt-1">
          <Clock size={12} />
          {formatUpdatedLabel(video.lastWatched || video.addedAt)}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoItem;
