import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X,
  Link as LinkIcon,
  Tag as TagIcon,
  BookOpen,
  FolderOpen,
  Briefcase,
  ClipboardList,
  FileText
} from 'lucide-react';
import Select from '../../../components/ui/Select';

const ResourceDetailSidebar = ({
  selectedResourceDetail,
  setSelectedResourceDetail,
  updateResource,
  courses,
  videos,
  projects,
  assignments,
  notes,
  folders
}) => {
  if (!selectedResourceDetail) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim().toLowerCase();
      if (!(selectedResourceDetail.tags || []).includes(newTag)) {
        updateResource({ tags: [...(selectedResourceDetail.tags || []), newTag] });
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    updateResource({ 
      tags: (selectedResourceDetail.tags || []).filter(t => t !== tagToRemove) 
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedResourceDetail(null)}
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
                value={selectedResourceDetail.name || ''}
                onChange={(e) => updateResource({ name: e.target.value })}
                placeholder="Resource Name"
              />
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500">{selectedResourceDetail.type || 'Unknown'}</span>
                {selectedResourceDetail.size && <span>• {selectedResourceDetail.size} MB</span>}
                <span>• Added {new Date(selectedResourceDetail.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if(selectedResourceDetail.url) window.open(selectedResourceDetail.url, '_blank');
              }}
              className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-all font-bold text-sm"
            >
              Open Resource
            </button>
            <button 
              onClick={() => setSelectedResourceDetail(null)}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Connections & Tags (Top Bar) */}
        <div className="px-6 lg:px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center gap-4 lg:gap-8 shrink-0">
          <div className="flex items-center gap-2 group">
            <FolderOpen size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
            <Select 
              className="bg-transparent border-none text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:ring-0 p-0 cursor-pointer transition-colors"
              value={selectedResourceDetail.folderId || ''}
              onChange={(e) => updateResource({ folderId: e.target.value || null })}
              options={[
                { label: 'Root Folder', value: '' },
                ...folders.map(f => ({ label: f.name, value: f.id }))
              ]}
            />
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-[200px]">
            <TagIcon size={14} className="text-slate-400" />
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {(selectedResourceDetail.tags || []).map((tag, i) => (
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

        {/* Content / Linking Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/30 dark:bg-slate-900/10">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Extended Connections */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <LinkIcon size={20} className="text-indigo-500" />
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Cross-Linking Connections</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <BookOpen size={14} /> Course
                  </label>
                  <Select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                    value={selectedResourceDetail.courseId || ''}
                    onChange={(e) => updateResource({ courseId: e.target.value || null })}
                    options={[
                      { label: 'None', value: '' },
                      ...courses.map(c => ({ label: c.title, value: c.id }))
                    ]}
                  />
                </div>

                {/* Video */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <LinkIcon size={14} /> Video Lecture
                  </label>
                  <Select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                    value={selectedResourceDetail.videoId || ''}
                    onChange={(e) => updateResource({ videoId: e.target.value || null })}
                    options={[
                      { label: 'None', value: '' },
                      ...videos.map(v => ({ label: v.title, value: v.id }))
                    ]}
                  />
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Briefcase size={14} /> Project
                  </label>
                  <Select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                    value={selectedResourceDetail.projectId || ''}
                    onChange={(e) => updateResource({ projectId: e.target.value || null })}
                    options={[
                      { label: 'None', value: '' },
                      ...projects.map(p => ({ label: p.title || p.name, value: p.id }))
                    ]}
                  />
                </div>

                {/* Assignment */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <ClipboardList size={14} /> Assignment
                  </label>
                  <Select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                    value={selectedResourceDetail.assignmentId || ''}
                    onChange={(e) => updateResource({ assignmentId: e.target.value || null })}
                    options={[
                      { label: 'None', value: '' },
                      ...assignments.map(a => ({ label: a.title, value: a.id }))
                    ]}
                  />
                </div>

                {/* Note */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <FileText size={14} /> Link to Note
                  </label>
                  <Select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                    value={selectedResourceDetail.noteId || ''}
                    onChange={(e) => updateResource({ noteId: e.target.value || null })}
                    options={[
                      { label: 'None', value: '' },
                      ...notes.map(n => ({ label: n.title, value: n.id }))
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* URL/Location (if applicable) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Source Details</h3>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Path</label>
                <input 
                  type="text"
                  value={selectedResourceDetail.url || ''}
                  onChange={(e) => updateResource({ url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                  placeholder="https://..."
                />
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ResourceDetailSidebar;
