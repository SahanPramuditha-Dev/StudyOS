import React from 'react';
import {
  Edit2,
  Trash2,
  BookOpen,
  Clock,
  MoreHorizontal,
  Check,
  ArchiveRestore,
  Archive,
  Link as LinkIcon,
  Pin,
  StickyNote,
  Video
} from 'lucide-react';
import { motion } from 'framer-motion';

const NoteItem = ({
  note,
  onEdit,
  onDelete,
  onToggleArchive,
  onTogglePin,
  courses = [],
  videos = [],
  selected = false,
  onToggleSelect,
  viewMode = 'grid'
}) => {
  const course = courses.find((c) => c.id === note.courseId);
  const video = videos.find((v) => v.id === note.videoId);

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
    // For table view in Notes.jsx, we will just return a row representation, but since the Notes.jsx renders the <tr> directly (like in Courses.jsx), NoteItem is only used for grid view.
    return null; 
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className={`card group flex flex-col bg-white dark:bg-slate-900 border ${
        note.pinned ? 'border-amber-200 dark:border-amber-500/30 shadow-amber-500/10' : 'border-slate-100 dark:border-slate-800'
      } p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary-200/70 dark:hover:border-primary-500/30 transition-all relative`}
    >
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onToggleSelect?.(note.id)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              selected
                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-primary-400'
            }`}
            aria-label={`Select ${note.title}`}
          >
            <Check size={12} />
          </button>
          {note.pinned && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 flex items-center gap-1">
              <Pin size={11} className="fill-current" /> Pinned
            </div>
          )}
          {note.archived && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Trash
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
                onEdit(note);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit Note
            </button>
            <button
              type="button"
              onClick={(e) => {
                onTogglePin?.(note.id);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Pin size={14} />
              {note.pinned ? 'Unpin' : 'Pin Note'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                onToggleArchive?.(note);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              {note.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {note.archived ? 'Restore' : 'Move to Trash'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                onDelete(note.id);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Permanently
            </button>
          </div>
        </details>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 line-clamp-1">
            {note.title || 'Untitled Note'}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {note.content || 'No content yet...'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(note.tags || []).slice(0, 4).map((tag, i) => (
            <span key={`${tag}-${i}`} className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              #{tag}
            </span>
          ))}
          {(note.tags || []).length > 4 && (
            <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              +{(note.tags || []).length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        {(course || video) && (
          <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {course && (
              <div className="flex items-center gap-1.5" title={`Linked to Course: ${course.title}`}>
                <BookOpen size={13} className="text-primary-500" />
                <span className="truncate">{course.title}</span>
              </div>
            )}
            {video && (
              <div className="flex items-center gap-1.5" title={`Linked to Video: ${video.title}`}>
                <Video size={13} className="text-rose-500" />
                <span className="truncate">{video.title}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onEdit(note)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-colors"
          >
            <StickyNote size={14} className="inline mr-1" />
            Open Note
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pt-1">
          <Clock size={12} />
          {formatUpdatedLabel(note.updatedAt || note.createdAt)}
        </div>
      </div>
    </motion.div>
  );
};

export default NoteItem;
