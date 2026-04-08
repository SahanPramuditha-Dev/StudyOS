import React from 'react';

const BulkActionBar = ({
  selectedCount,
  onSelectVisible,
  onClear,
  className = '',
  children
}) => (
  <div className={`p-4 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-900/20 flex flex-wrap items-center gap-2 ${className}`}>
    <button
      onClick={onSelectVisible}
      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700"
      title="Toggle all visible"
    >
      Select visible
    </button>
    <span className="text-xs font-black text-primary-700 dark:text-primary-300">{selectedCount} selected</span>
    {children}
    <button onClick={onClear} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">Clear</button>
  </div>
);

export default BulkActionBar;
