import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Download,
  Eye,
  Edit3,
  Layout,
  Save,
  Link as LinkIcon,
  Tag as TagIcon,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import NoteEditor from './NoteEditor';
import NotePreview from './NotePreview';
import Select from '../../../components/ui/Select';

const NoteDetailSidebar = ({
  selectedNoteDetail,
  setSelectedNoteDetail,
  updateNote,
  viewMode,
  setViewMode,
  courses,
  videos
}) => {
  if (!selectedNoteDetail) return null;

  const exportNote = (format = 'md') => {
    const content = selectedNoteDetail.content;
    const filename = `${selectedNoteDetail.title.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim().toLowerCase();
      if (!(selectedNoteDetail.tags || []).includes(newTag)) {
        updateNote({ tags: [...(selectedNoteDetail.tags || []), newTag] });
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    updateNote({ 
      tags: (selectedNoteDetail.tags || []).filter(t => t !== tagToRemove) 
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedNoteDetail(null)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-[1200px] h-[85vh] max-h-[850px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header / Toolbar */}
        <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="space-y-1 flex-1 min-w-0">
              <input 
                className="bg-transparent border-none text-xl lg:text-2xl font-black text-slate-800 dark:text-white focus:ring-0 w-full truncate p-0"
                value={selectedNoteDetail.title}
                onChange={(e) => updateNote({ title: e.target.value })}
                placeholder="Note Title"
              />
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Save size={10} className="text-green-500" />
                <span>Last synced {new Date(selectedNoteDetail.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mr-2">
              <button 
                onClick={() => setViewMode('edit')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Edit Mode"
              >
                <Edit3 size={18} />
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`hidden sm:block p-2 rounded-xl transition-all ${viewMode === 'split' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Split View"
              >
                <Layout size={18} />
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Preview Mode"
              >
                <Eye size={18} />
              </button>
            </div>
            <button 
              onClick={() => exportNote()}
              className="hidden sm:flex p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all"
              title="Export as Markdown"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => setSelectedNoteDetail(null)}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Context Bar (Linking & Tags) */}
        <div className="px-6 lg:px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center gap-4 lg:gap-8 shrink-0">
          <div className="flex items-center gap-2 group">
            <BookOpen size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            <Select 
              className="bg-transparent border-none text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:ring-0 p-0 cursor-pointer transition-colors"
              value={selectedNoteDetail.courseId || ''}
              onChange={(val) => updateNote({ courseId: val })}
              options={[
                { label: 'Link Course...', value: '' },
                ...courses.map(c => ({ label: c.title, value: c.id }))
              ]}
            />
          </div>

          <div className="flex items-center gap-2 group">
            <LinkIcon size={14} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            <Select 
              className="bg-transparent border-none text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:ring-0 p-0 cursor-pointer transition-colors"
              value={selectedNoteDetail.videoId || ''}
              onChange={(val) => updateNote({ videoId: val })}
              options={[
                { label: 'Link Video...', value: '' },
                ...videos.map(v => ({ label: v.title, value: v.id }))
              ]}
            />
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-[200px]">
            <TagIcon size={14} className="text-slate-400" />
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {(selectedNoteDetail.tags || []).map((tag, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 group transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input 
                className="bg-transparent border-none text-xs font-bold text-slate-400 focus:text-slate-700 dark:focus:text-slate-200 focus:ring-0 p-0 w-24 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="Add tag..."
                onKeyDown={handleAddTag}
              />
            </div>
          </div>
        </div>

        {/* Editor/Preview Area */}
        <div className="flex-1 flex overflow-hidden">
          {(viewMode === 'edit' || viewMode === 'split') && (
            <NoteEditor 
              content={selectedNoteDetail.content}
              onChange={(content) => updateNote({ content })}
            />
          )}
          {viewMode === 'split' && <div className="w-px bg-slate-100 dark:bg-slate-800 shrink-0" />}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <NotePreview content={selectedNoteDetail.content} />
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default NoteDetailSidebar;
