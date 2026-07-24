import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Folder, 
  Search, 
  Trash2, 
  Download, 
  MoreVertical,
  Upload,
  Tag,
  Eye,
  FileCode,
  Image as ImageIcon,
  Archive,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../../../../components/EmptyState';

const ProjectFiles = ({ project, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const tags = ['All', 'Notes', 'Assignments', 'Resources', 'Submissions', 'Exam'];

  const filteredFiles = (project.files || []).filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'All' || f.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (type.includes('image')) return <ImageIcon size={18} className="text-blue-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive size={18} className="text-amber-500" />;
    if (type.includes('javascript') || type.includes('python')) return <FileCode size={18} className="text-emerald-500" />;
    return <FileText size={18} className="text-slate-400" />;
  };

  const handleUpload = () => {
    toast.error('Cloud storage integration requires active subscription.');
  };

  const handleDelete = (fileName) => {
    const updatedFiles = project.files.filter(f => f.name !== fileName);
    onUpdate({ files: updatedFiles });
    toast.success('Asset removed from workspace');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* File Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex-1 w-full max-w-xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search within project assets..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 outline-none focus:border-primary-500/20 focus:ring-4 ring-primary-500/5 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedTag === tag 
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
                  : 'bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <button 
          onClick={handleUpload}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md shadow-primary-500/20 transition-all active:scale-95 group"
        >
          <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          Deploy Asset
        </button>
      </div>

      {/* Folders Visualization */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Notes', 'Assignments', 'Resources', 'Submissions'].map((folder, index) => (
          <div key={folder} className="glass rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 hover:border-primary-500/20 transition-all hover:-translate-y-0.5 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Folder size={18} />
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">{folder}</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {(project.files || []).filter(f => f.tag === folder).length} Items
            </p>
          </div>
        ))}
      </div>

      {/* Files List */}
      <div className="glass rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm">
        <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Architectural Assets</h3>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{filteredFiles.length} Found</span>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm transition-all">
                    {getFileIcon(file.type || '')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-widest">
                        {file.tag || 'Unset'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-all shadow-sm">
                    <Eye size={14} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-all shadow-sm">
                    <Download size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(file.name)}
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-2">
              <EmptyState 
                compact
                icon={<Upload size={32} className="text-slate-300 dark:text-slate-700" />}
                title="No assets deployed"
                description="Upload slides, research papers or assignments files to keep workspace context clear."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectFiles;
