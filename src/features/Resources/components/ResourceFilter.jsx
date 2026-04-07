import React from 'react';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  LayoutGrid, 
  Filter,
  FolderPlus,
  Upload,
  ChevronDown
} from 'lucide-react';

const ResourceFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  groupBy, 
  setGroupBy, 
  onNewFolder, 
  onUpload, 
  onAddLink, 
  isUploading,
  itemCount
}) => {
  return (
    <div className="flex flex-col gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4">
      {/* Search and Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search assets, tags, or metadata..."
            className="w-full pl-12 pr-4 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-primary-500/10 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={onNewFolder}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all shadow-sm active:scale-95 group"
            title="New Collection"
          >
            <FolderPlus size={22} className="group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={onUpload}
            disabled={isUploading}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all shadow-sm active:scale-95 disabled:opacity-50 group"
            title="Upload Local Data"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={22} className="group-hover:translate-y-[-2px] transition-transform" />
            )}
          </button>

          <button 
            onClick={onAddLink}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform" />
            Link Asset
          </button>
        </div>
      </div>

      {/* Organizational Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-2">
            <LayoutGrid size={18} className="text-primary-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {itemCount} Knowledge Units
            </span>
          </div>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-primary-500" />
            <div className="relative flex items-center">
              <select 
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 text-slate-500 dark:text-slate-400 cursor-pointer p-0 pr-6 appearance-none"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option className="dark:bg-slate-900" value="type">Group by Type</option>
                <option className="dark:bg-slate-900" value="course">Group by Course</option>
                <option className="dark:bg-slate-900" value="video">Group by Video</option>
                <option className="dark:bg-slate-900" value="folder">File System (Flat)</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
          <RotateCcw size={12} className="text-slate-300" />
          Real-time Cloud Sync
        </div>
      </div>
    </div>
  );
};

export default ResourceFilter;
