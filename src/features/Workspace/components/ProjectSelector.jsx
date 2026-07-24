import React from 'react';
import { LayoutGrid, Plus, BookOpen } from 'lucide-react';
import Select from '../../../components/ui/Select';

const ProjectSelector = ({ contexts, activeContextKey, onSelect, onNewProject, onNewAssignment }) => {
  const hasContexts = (contexts || []).length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative w-full sm:w-[280px]">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none z-10">
          <LayoutGrid size={16} />
        </div>
        <Select
          value={activeContextKey || ''}
          onChange={onSelect}
          placeholder={hasContexts ? 'Select Workspace' : 'No contexts yet'}
          options={(contexts || []).map((item) => ({
            label: `[${item.type.toUpperCase()}] ${item.label}`,
            value: item.key,
          }))}
          disabled={!hasContexts}
          className="w-full pl-7"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onNewProject}
          className="flex items-center justify-center gap-2 h-[42px] px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black uppercase tracking-widest text-[9px] active:scale-95 whitespace-nowrap transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus size={14} />
          Project
        </button>
        <button
          onClick={onNewAssignment}
          className="flex items-center justify-center gap-2 h-[42px] px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black uppercase tracking-widest text-[9px] active:scale-95 whitespace-nowrap transition-all shadow-lg shadow-primary-500/20"
        >
          <BookOpen size={14} />
          Assignment
        </button>
      </div>
    </div>
  );
};

export default ProjectSelector;
