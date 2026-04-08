import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  BookOpen, 
  LayoutGrid, 
  ArrowUpDown 
} from 'lucide-react';

const CourseFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  sortBy, 
  setSortBy, 
  onReset, 
  onAdd, 
  courseCount,
  showArchived,
  setShowArchived
}) => {
  return (
    <div className="flex flex-col gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search courses, platforms, or tags..."
            className="w-full pl-12 pr-4 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-primary-500/10 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={onReset}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm active:scale-95"
            title="Reset to Defaults"
          >
            <RotateCcw size={22} />
          </button>
          
          <button 
            onClick={onAdd}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform" />
            Add Course
          </button>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-2">
            <LayoutGrid size={18} className="text-primary-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {courseCount} Total Courses
            </span>
          </div>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-primary-500" />
            <select 
              className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 text-slate-500 dark:text-slate-400 cursor-pointer p-0 pr-6"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option className="dark:bg-slate-900">All</option>
              <option className="dark:bg-slate-900">Active</option>
              <option className="dark:bg-slate-900">Paused</option>
              <option className="dark:bg-slate-900">Completed</option>
              <option className="dark:bg-slate-900">Archived</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <button
            type="button"
            onClick={() => setShowArchived?.(!showArchived)}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle showing archived courses"
          >
            {showArchived ? 'Showing Archived' : 'Hide Archived'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ArrowUpDown size={18} className="text-primary-500" />
          <select 
            className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 text-slate-500 dark:text-slate-400 cursor-pointer p-0 pr-6 text-right"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option className="dark:bg-slate-900" value="title">Sort by Title</option>
            <option className="dark:bg-slate-900" value="progress">Sort by Progress</option>
            <option className="dark:bg-slate-900" value="platform">Sort by Platform</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CourseFilter;
