import React from 'react';
import { LayoutGrid, ChevronDown, Plus } from 'lucide-react';

const ProjectSelector = ({ projects, activeProjectId, onSelect, onNewProject }) => {
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative group min-w-[240px]">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500">
          <LayoutGrid size={20} />
        </div>
        <select 
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white font-black uppercase tracking-widest text-xs focus:ring-4 ring-primary-500/10 outline-none appearance-none cursor-pointer transition-all shadow-sm"
          value={activeProjectId || ''}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="" disabled className="dark:bg-slate-900">Select Project Context</option>
          {projects.map(p => (
            <option key={p.id} value={p.id} className="dark:bg-slate-900">
              {p.title || p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
      </div>

      <button 
        onClick={onNewProject}
        className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all font-black uppercase tracking-widest text-[10px] active:scale-95"
      >
        <Plus size={16} />
        Launch New Project
      </button>
    </div>
  );
};

export default ProjectSelector;
