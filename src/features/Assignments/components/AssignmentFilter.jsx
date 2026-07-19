import React from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  LayoutGrid,
  ArrowUpDown,
  Table2,
  Filter,
  Columns,
  ListOrdered
} from 'lucide-react';
import Select from '../../../components/ui/Select';

const STATUS_FILTERS = ['All', 'Not Started', 'In Progress', 'Submitted', 'Late'];

const AssignmentFilter = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  onReset,
  onAdd,
  assignmentCount,
  statusCounts = {},
  filterCourse,
  setFilterCourse,
  courses = [],
  viewMode,
  setViewMode
}) => {
  return (
    <div className="relative mb-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 md:p-5 shadow-sm flex flex-col gap-5">
        
        {/* Top Row: Search and Primary Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search assignments, subjects..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-blue-500/10 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onReset}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm active:scale-95"
              title="Reset search and filters"
              aria-label="Reset data"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={onAdd}
              className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <Plus size={18} />
              Add Assignment
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
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/40'
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
              <LayoutGrid size={16} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {assignmentCount} Showing
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <ArrowUpDown size={16} className="text-blue-500" />
              <Select
                variant="ghost"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: 'Recently Updated', value: 'updated' },
                  { label: 'Title (A-Z)', value: 'title' },
                  { label: 'Deadline', value: 'deadline' },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid size={14} className="inline mr-1" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                  viewMode === 'kanban'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Columns size={14} className="inline mr-1" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                  viewMode === 'timeline'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ListOrdered size={14} className="inline mr-1" />
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                  viewMode === 'table'
                    ? 'bg-blue-500 text-white shadow-sm'
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
          {courses.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <Filter size={15} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Course</span>
              <Select
                variant="ghost"
                value={filterCourse}
                onChange={setFilterCourse}
                options={[
                  { label: 'All', value: 'All' },
                  ...courses.map(c => ({ label: c.title || c, value: c.id || c }))
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentFilter;
