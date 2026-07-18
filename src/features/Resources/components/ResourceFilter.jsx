import React from 'react';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  LayoutGrid, 
  Filter,
  FolderPlus,
  Upload,
  ChevronDown,
  LayoutList
} from 'lucide-react';
import Select from '../../../components/ui/Select';

const ResourceFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  groupBy, 
  setGroupBy, 
  dateRange, 
  setDateRange, 
  sizeFilter, 
  setSizeFilter, 
  assocFilter, 
  setAssocFilter,
  onNewFolder, 
  onUpload, 
  onAddLink, 
  isUploading,
  itemCount,
  viewMode = 'all',
  setViewMode,
  displayMode = 'grid',
  setDisplayMode
}) => {
  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const sizeOptions = [
    { value: 'all', label: 'All Sizes' },
    { value: 'small', label: '< 1MB' },
    { value: 'medium', label: '< 10MB' },
    { value: 'large', label: '< 100MB' }
  ];

  const assocOptions = [
    { value: 'all', label: 'All' },
    { value: 'none', label: 'Unlinked' },
    { value: 'course', label: 'Courses' },
    { value: 'video', label: 'Videos' }
  ];

  return (
    <div className="relative z-[90] flex flex-col gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4">
      {/* Search and Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search assets, tags, or metadata..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-primary-500/10 outline-none transition-all font-bold placeholder:font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={onNewFolder}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all shadow-sm active:scale-95 group font-bold text-sm"
            title="New Collection"
          >
            <FolderPlus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          
          <button 
            onClick={onUpload}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all shadow-sm active:scale-95 disabled:opacity-50 group font-bold text-sm"
            title="Upload Local Data"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            )}
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button 
            onClick={onAddLink}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all shadow-xl shadow-primary-500/20 active:scale-95 group text-sm"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Link Asset
          </button>
        </div>
      </div>

      {/* Organizational Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 w-full lg:w-auto px-2">
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-500">
              <LayoutGrid size={14} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              {itemCount} Units
            </span>
          </div>
          
          <div className="h-5 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />
          
          <div className="flex items-center gap-2 group cursor-pointer">
            <Filter size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
            <Select 
              variant="ghost"
              value={groupBy}
              onChange={(val) => setGroupBy(val)}
              options={[
                { label: 'Group: Type', value: 'type' },
                { label: 'Group: Course', value: 'course' },
                { label: 'Group: Video', value: 'video' },
                { label: 'Flat List', value: 'folder' }
              ]}
            />
            <ChevronDown className="text-slate-400" size={12} />
          </div>

          <div className="h-5 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />

          {/* Advanced Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date:</span>
              <Select 
                variant="ghost"
                value={dateRange || 'all'}
                onChange={(val) => setDateRange(val)}
                options={dateOptions}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size:</span>
              <Select 
                variant="ghost"
                value={sizeFilter || 'all'}
                onChange={(val) => setSizeFilter(val)}
                options={sizeOptions}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assoc:</span>
              <Select 
                variant="ghost"
                value={assocFilter || 'all'}
                onChange={(val) => setAssocFilter(val)}
                options={assocOptions}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 lg:px-4">
          <div className="inline-flex rounded-xl bg-slate-50 dark:bg-slate-800/50 p-1">
            <button
              onClick={() => setDisplayMode?.('grid')}
              className={`p-1.5 rounded-lg transition-colors ${displayMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setDisplayMode?.('list')}
              className={`p-1.5 rounded-lg transition-colors ${displayMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
          </div>

          <div className="inline-flex rounded-xl bg-slate-50 dark:bg-slate-800/50 p-1">
            <button
              onClick={() => setViewMode?.('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              All Assets
            </button>
            <button
              onClick={() => setViewMode?.('papers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'papers' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Papers
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2" title="Real-time Cloud Sync">
            <RotateCcw size={12} className="text-emerald-500" />
            <span className="hidden xl:inline">Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceFilter;
