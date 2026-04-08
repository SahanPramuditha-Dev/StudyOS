import React from 'react';
import { 
  Trash2, 
  ExternalLink, 
  Edit2, 
  Tag, 
  Youtube, 
  BookOpen,
  FileText,
  File,
  Link as LinkIcon,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

const ResourceItem = ({
  res,
  onEdit,
  onDelete,
  onMove,
  folderOptions = [],
  courses,
  videos,
  selected = false,
  onToggleSelect,
  onDragStart
}) => {
  const getIcon = () => {
    switch (res.type) {
      case 'Link': return <LinkIcon size={20} />;
      case 'PDF': return <FileText size={20} />;
      case 'Video': return <Play size={20} />;
      case 'Slides': return <File size={20} />;
      default: return <File size={20} />;
    }
  };

  const getAssociation = () => {
    if (res.associatedType === 'Course') {
      const course = courses.find(c => c.id === res.associatedId);
      return { label: course?.title || 'Linked Course', icon: BookOpen, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' };
    }
    if (res.associatedType === 'Video') {
      const video = videos.find(v => v.id === res.associatedId);
      return { label: video?.title || 'Linked Video', icon: Youtube, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' };
    }
    return null;
  };

  const assoc = getAssociation();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={(e) => onDragStart?.(e, { type: 'resource', id: res.id })}
      className="card group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSelect?.(res.id)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-black ${selected ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 text-transparent'}`}
            aria-label={`Select ${res.name}`}
          >
            ✓
          </button>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
          {getIcon()}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(res)} 
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary-500 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(res.id)} 
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1">
        <h4 className="font-black text-slate-800 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-500 transition-colors" title={res.name}>
          {res.name}
        </h4>
        {res.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed font-medium">
            {res.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-transparent">
            {res.type}
          </span>
          {res.tags?.map((tag, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-500/5 text-[9px] font-black text-primary-600 dark:text-primary-400 flex items-center gap-1 uppercase tracking-widest border border-primary-100/50 dark:border-primary-500/10">
              #{tag}
            </span>
          ))}
        </div>

        {assoc && (
          <div className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent mb-4 ${assoc.bg}`}>
            <assoc.icon size={14} className={assoc.color} />
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate uppercase tracking-tighter">
              {assoc.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-auto">
        <a 
          href={res.url} 
          target="_blank" 
          rel="noreferrer" 
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          <ExternalLink size={14} /> {res.isLocal ? 'Open File' : 'Visit Link'}
        </a>
      </div>
      <div className="mt-3">
        <select
          value={res.folderId || ''}
          onChange={(e) => onMove?.(res.id, e.target.value || null)}
          className="w-full text-[10px] font-black uppercase tracking-widest"
        >
          <option value="">Move to Root</option>
          {folderOptions.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.pathLabel}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};

export default ResourceItem;
