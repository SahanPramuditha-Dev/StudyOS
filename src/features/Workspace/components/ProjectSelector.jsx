import React from 'react';
import { LayoutGrid, Plus, BookOpen } from 'lucide-react';

const ProjectSelector = ({ contexts, activeContextKey, onSelect, onNewProject, onNewAssignment }) => {
  const hasContexts = (contexts || []).length > 0;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full lg:w-auto flex flex-col lg:flex-row lg:items-end lg:flex-nowrap gap-3">
      <div className="group w-full lg:w-[360px]">
        <div className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-2 ml-1 leading-none">
          Workspace Context
        </div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none">
            <LayoutGrid size={18} />
          </div>
          <select
            className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-900/70 border border-sky-400/30 text-slate-100 font-bold uppercase tracking-wide text-[11px] outline-none cursor-pointer transition-all shadow-md group-hover:border-sky-300/60 focus:border-sky-300 focus:ring-4 ring-sky-400/20"
            value={activeContextKey || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="" className="bg-slate-900 text-slate-300">
              {hasContexts ? 'Select Workspace Context' : 'No projects/assignments yet'}
            </option>
            {(contexts || []).map((item) => (
              <option key={item.key} value={item.key} className="dark:bg-slate-900">
                [{item.type}] {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onNewProject}
          className="h-12 inline-flex items-center gap-2 px-5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] active:scale-95 whitespace-nowrap transition-all shadow-xl shadow-primary-500/30"
        >
          <Plus size={16} />
          Launch New Project
        </button>
        <button
          onClick={onNewAssignment}
          className="h-12 inline-flex items-center gap-2 px-5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] active:scale-95 whitespace-nowrap transition-all shadow-xl shadow-primary-500/30"
        >
          <BookOpen size={16} />
          New Assignment
        </button>
      </div>
      </div>
      {!hasContexts && (
        <p className="text-[10px] text-slate-400 font-semibold ml-1 leading-none">
          Create a project or assignment to unlock workspace.
        </p>
      )}
    </div>
  );
};

export default ProjectSelector;
