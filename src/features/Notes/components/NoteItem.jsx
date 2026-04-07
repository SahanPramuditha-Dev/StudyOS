import React from 'react';
import { Clock, Trash2, Tag, BookOpen, Link as LinkIcon } from 'lucide-react';

const NoteItem = ({ note, isActive, onClick, onDelete, courses, videos }) => {
  const course = courses.find(c => c.id === note.courseId);
  const video = videos.find(v => v.id === note.videoId);

  return (
    <div 
      onClick={() => onClick(note)}
      className={`group p-4 rounded-2xl cursor-pointer transition-all border ${
        isActive 
          ? 'bg-primary-50 dark:bg-primary-500/5 border-primary-200 dark:border-primary-500/30 ring-2 ring-primary-500/10' 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-sm font-bold truncate flex-1 mr-2 ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {note.title || 'Untitled Note'}
        </h3>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mb-3 leading-relaxed">
        {note.content || 'No content yet...'}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {note.tags?.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Clock size={12} />
          {new Date(note.updatedAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1.5">
          {course && (
            <div className="p-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500" title={`Course: ${course.title}`}>
              <BookOpen size={10} />
            </div>
          )}
          {video && (
            <div className="p-1 rounded bg-red-50 dark:bg-red-500/10 text-red-500" title={`Video: ${video.title}`}>
              <LinkIcon size={10} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteItem;
