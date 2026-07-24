import React from 'react';
import { Search, RotateCcw, Grid, List, CheckSquare } from 'lucide-react';
import Select from '../../../components/ui/Select';

const TaskFilter = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  availableSubjects = [],
  filterSubject,
  setFilterSubject,
  onReset,
  totalCount = 0,
  selectedCount = 0,
  onSelectAllVisible
}) => {
  const STATUS_OPTIONS = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' }
  ];

  const PRIORITY_OPTIONS = [
    { label: 'All Priorities', value: 'All' },
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ];

  const TYPE_OPTIONS = [
    { label: 'All Types', value: 'All' },
    { label: 'Notes', value: 'notes' },
    { label: 'Assignment', value: 'assignment' },
    { label: 'Revision', value: 'revision' },
    { label: 'Project', value: 'project' }
  ];

  const SORT_OPTIONS = [
    { label: 'Recently Updated', value: 'updated' },
    { label: 'Priority Weight', value: 'priority' },
    { label: 'Task Title', value: 'title' },
    { label: 'Progress %', value: 'progress' },
    { label: 'Custom Order', value: 'custom' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, types, or subjects..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={onSelectAllVisible}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            <CheckSquare size={16} />
            Toggle Select Page
          </button>
          
          <button
            type="button"
            onClick={onReset}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Status</label>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={STATUS_OPTIONS}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Priority</label>
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            options={PRIORITY_OPTIONS}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Type</label>
          <Select
            value={filterType}
            onChange={setFilterType}
            options={TYPE_OPTIONS}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Subject</label>
          <Select
            value={filterSubject}
            onChange={setFilterSubject}
            options={[
              { label: 'All Subjects', value: 'All' },
              ...availableSubjects.map((subject) => ({ label: subject, value: subject }))
            ]}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Sort By</label>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default TaskFilter;
