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
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (type.includes('image')) return <ImageIcon size={20} className="text-blue-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive size={20} className="text-amber-500" />;
    if (type.includes('javascript') || type.includes('python')) return <FileCode size={20} className="text-emerald-500" />;
    return <FileText size={20} className="text-slate-400" />;
  };

  const handleUpload = () => {
    // In a real app, this would open a file picker and upload to Firebase Storage
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
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search within project assets..."
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:border-primary-500/20 focus:ring-4 ring-primary-500/5 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedTag === tag 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <button 
          onClick={handleUpload}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 group"
        >
          <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          Deploy Asset
        </button>
      </div>

      {/* Folders Visualization (Mock) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {['Notes', 'Assignments', 'Resources', 'Submissions'].map(folder => (
          <div key={folder} className="card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-500/20 transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Folder size={24} />
              </div>
              <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-500 transition-colors" />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1">{folder}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {(project.files || []).filter(f => f.tag === folder).length} Items
            </p>
          </div>
        ))}
      </div>

      {/* Files List */}
      <div className="card overflow-hidden border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Architectural Assets</h3>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{filteredFiles.length} Found</span>
        </div>
        
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm transition-all">
                    {getFileIcon(file.type || '')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-widest">
                        {file.tag || 'Unset'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-all shadow-sm">
                    <Eye size={16} />
                  </button>
                  <button className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-all shadow-sm">
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(file.name)}
                    className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 text-center space-y-4 opacity-30">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Upload size={32} className="text-slate-300" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">No assets deployed to this module</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectFiles;
