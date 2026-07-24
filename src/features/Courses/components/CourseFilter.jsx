import React from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  LayoutGrid,
  ArrowUpDown,
  Table2,
  Filter
} from 'lucide-react';
import { Select } from '../../../components/ui/Select';

const STATUS_FILTERS = ['All', 'Active', 'Paused', 'Completed', 'Archived'];

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
  setShowArchived,
  statusCounts = {},
  filterCategory,
  setFilterCategory,
  filterDifficulty,
  setFilterDifficulty,
  availableCategories = [],
  availableDifficulties = [],
  viewMode,
  setViewMode
}) => {
  return (
    <div className="relative z-[90] mb-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 md:p-5 shadow-sm flex flex-col gap-5">
        
        {/* Top Row: Search and Primary Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search courses, platforms, or tags..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-primary-500/10 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onReset}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm active:scale-95"
              title="Reset to default sample data"
              aria-label="Reset data"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={onAdd}
              className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-lg shadow-primary-500/25 active:scale-95"
            >
              <Plus size={18} />
              Add Course
            </button>
          </div>
        </div>

        {/* Second Row: Status Tabs & View Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
          
          {/* Left: Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((status) => {
              const isActive = filterStatus === status;
              const count = statusCounts[status] ?? 0;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-500/40'
                  }`}
                >
                  {status}
                  <span className={`ml-1.5 ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Display & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <LayoutGrid size={16} className="text-primary-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {courseCount} Showing
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: 'Custom Order', value: 'custom' },
                  { label: 'Recently Updated', value: 'updated' },
                  { label: 'Title (A-Z)', value: 'title' },
                  { label: 'Highest Progress', value: 'progress' },
                  { label: 'Platform', value: 'platform' },
                ]}
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid size={14} className="inline mr-1" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                  viewMode === 'table'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Table2 size={14} className="inline mr-1" />
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Third Row: Advanced Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowArchived?.(!showArchived)}
            className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              showArchived
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300 border-primary-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Toggle archived visibility"
          >
            {showArchived ? 'Including Archived' : 'Hide Archived'}
          </button>

          <div className="flex items-center gap-2">
            <Select
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { label: 'Category: All', value: 'All' },
                ...availableCategories.map(c => ({ label: `Category: ${c}`, value: c }))
              ]}
              className="w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={filterDifficulty}
              onChange={setFilterDifficulty}
              options={[
                { label: 'Difficulty: All', value: 'All' },
                ...availableDifficulties.map(diff => ({ label: `Difficulty: ${diff}`, value: diff }))
              ]}
              className="w-44"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFilter;
