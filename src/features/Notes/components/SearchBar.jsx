import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, onClear }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    <input 
      type="text"
      placeholder="Search notes, tags, or content..."
      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 ring-primary-500/20 outline-none transition-all text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button 
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export default SearchBar;
