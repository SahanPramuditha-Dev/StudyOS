import React from 'react';

const CATEGORIES = [
  { id: 'All', label: 'All Categories', color: 'bg-slate-500' },
  { id: 'Study', label: 'Study Sessions', color: 'bg-blue-500' },
  { id: 'Exam', label: 'Exams & Quizzes', color: 'bg-rose-500' },
  { id: 'Assignment', label: 'Assignments', color: 'bg-amber-500' },
  { id: 'Project', label: 'Projects', color: 'bg-purple-500' },
  { id: 'Personal', label: 'Personal', color: 'bg-emerald-500' },
  { id: 'Budget', label: 'Budget & Bills', color: 'bg-teal-500' }
];

const CategoryLegend = ({ selectedCategory, onSelectCategory, categoryCounts = {} }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const count = categoryCounts[cat.id] || 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              isSelected
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cat.color}`} />
            <span>{cat.label}</span>
            {cat.id !== 'All' && count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  isSelected
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryLegend;
export { CATEGORIES };
