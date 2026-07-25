import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  Search as SearchIcon, 
  X, 
  BookOpen, 
  Youtube, 
  FileText, 
  Github as GithubIcon, 
  Layout as Kanban,
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../../services/storage';

const CATEGORIES = [
  { 
    label: 'Courses', 
    tab: 'courses', 
    icon: BookOpen, 
    gradient: 'from-sky-500 to-blue-600',
    glow: 'rgba(14,165,233,0.25)',
    bg: 'bg-sky-500/10 dark:bg-sky-500/10',
    border: 'border-sky-500/20 dark:border-sky-400/20',
    text: 'text-sky-600 dark:text-sky-400',
    desc: 'Browse all courses'
  },
  { 
    label: 'Videos', 
    tab: 'videos', 
    icon: Youtube, 
    gradient: 'from-rose-500 to-red-600',
    glow: 'rgba(239,68,68,0.25)',
    bg: 'bg-rose-500/10 dark:bg-rose-500/10',
    border: 'border-rose-500/20 dark:border-rose-400/20',
    text: 'text-rose-600 dark:text-rose-400',
    desc: 'Watch saved videos'
  },
  { 
    label: 'Notes', 
    tab: 'notes', 
    icon: FileText, 
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.25)',
    bg: 'bg-violet-500/10 dark:bg-violet-500/10',
    border: 'border-violet-500/20 dark:border-violet-400/20',
    text: 'text-violet-600 dark:text-violet-400',
    desc: 'Find your notes'
  },
  { 
    label: 'Projects', 
    tab: 'projects', 
    icon: GithubIcon, 
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    border: 'border-emerald-500/20 dark:border-emerald-400/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    desc: 'View your projects'
  },
];

const TYPE_CONFIG = {
  course:  { gradient: 'from-sky-500 to-blue-600',     bg: 'bg-sky-500/10',     icon: BookOpen,    text: 'text-sky-500' },
  video:   { gradient: 'from-rose-500 to-red-600',     bg: 'bg-rose-500/10',    icon: Youtube,     text: 'text-rose-500' },
  note:    { gradient: 'from-violet-500 to-purple-600',bg: 'bg-violet-500/10',  icon: FileText,    text: 'text-violet-500' },
  project: { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', icon: GithubIcon,  text: 'text-emerald-500' },
  task:    { gradient: 'from-primary-500 to-cyan-600',  bg: 'bg-primary-500/10', icon: Kanban,      text: 'text-primary-500' },
  doc:     { gradient: 'from-indigo-500 to-blue-600',  bg: 'bg-indigo-500/10',  icon: FileText,    text: 'text-indigo-500' },
};

const GlobalSearch = ({ isOpen, onClose, onSelectTab }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isOpen]);

  const results = useMemo(() => {
    if (!query) return [];
    const allData = StorageService.getAll();
    const searchResults = [];

    (allData.COURSES || []).forEach(c => {
      if (c.title.toLowerCase().includes(query.toLowerCase()))
        searchResults.push({ type: 'course', title: c.title, id: c.id, tab: 'courses' });
    });

    (allData.VIDEOS || []).forEach(v => {
      if (v.title.toLowerCase().includes(query.toLowerCase()))
        searchResults.push({ type: 'video', title: v.title, id: v.id, tab: 'videos' });
    });

    (allData.NOTES || []).forEach(n => {
      if (n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()))
        searchResults.push({ type: 'note', title: n.title, id: n.id, tab: 'notes' });
    });

    (allData.PROJECTS || []).forEach(p => {
      if (p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase()))
        searchResults.push({ type: 'project', title: p.name, id: p.id, tab: 'projects' });

      if (p.board) {
        ['todo', 'doing', 'done'].forEach(col => {
          (p.board[col] || []).forEach(task => {
            if (task.content.toLowerCase().includes(query.toLowerCase()))
              searchResults.push({ type: 'task', title: task.content, subtitle: `In project: ${p.name}`, id: task.id, projectId: p.id, tab: 'workspace' });
          });
        });
      }

      if (p.docs) {
        p.docs.forEach(doc => {
          if (doc.title.toLowerCase().includes(query.toLowerCase()) || doc.content.toLowerCase().includes(query.toLowerCase()))
            searchResults.push({ type: 'doc', title: doc.title, subtitle: `In project: ${p.name}`, id: doc.id, projectId: p.id, tab: 'projects' });
        });
      }
    });

    return searchResults.slice(0, 8);
  }, [query]);

  const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.doc;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onClose(false)}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -24 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative w-full max-w-xl overflow-hidden"
          style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.4))' }}
        >
          {/* Gradient glow behind modal */}
          <div 
            className="absolute -inset-px rounded-[22px] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.4), rgba(139,92,246,0.4), rgba(14,165,233,0.2))',
              filter: 'blur(1px)',
            }}
          />

          {/* Glass shell */}
          <div className="relative rounded-[20px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 overflow-hidden">
            
            {/* Top accent line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-400" />

            {/* Search input row */}
            <div className="relative flex items-center gap-3 px-5 py-4">
              <motion.div
                animate={{ 
                  color: focused ? '#0ea5e9' : '#94a3b8',
                  scale: focused ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                <SearchIcon size={20} strokeWidth={2.5} />
              </motion.div>

              <input
                ref={inputRef}
                autoFocus
                placeholder="Search across courses, videos, notes…"
                className="flex-1 bg-transparent border-none text-base font-medium focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />

              <div className="flex items-center gap-2">
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setQuery('')}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X size={11} className="text-slate-500 dark:text-slate-400" strokeWidth={3} />
                  </motion.button>
                )}
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                  ESC
                </kbd>
                <button
                  onClick={() => onClose(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                  aria-label="Close search"
                >
                  <X size={16} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />

            {/* Body */}
            <div className="max-h-[56vh] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {results.length > 0 ? (
                  /* ── Search Results ── */
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="p-3 space-y-0.5"
                  >
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={10} />
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </p>
                    {results.map((result, i) => {
                      const cfg = getTypeConfig(result.type);
                      const Icon = cfg.icon;
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => { onSelectTab(result.tab); onClose(false); }}
                          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all group text-left"
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                            <Icon size={16} className="text-white" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{result.title}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                              {result.type}
                              {result.subtitle && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
                                  {result.subtitle}
                                </>
                              )}
                            </p>
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all -translate-x-1"
                          />
                        </motion.button>
                      );
                    })}
                  </motion.div>

                ) : query ? (
                  /* ── Empty State ── */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="py-16 text-center px-6"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <SearchIcon size={28} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">No results for "{query}"</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different search term</p>
                  </motion.div>

                ) : (
                  /* ── Category Grid ── */
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="p-3"
                  >
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Browse
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <motion.button
                            key={item.tab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { onSelectTab(item.tab); onClose(false); }}
                            className={`relative flex items-center gap-3 p-3.5 rounded-xl border ${item.bg} ${item.border} hover:scale-[1.02] hover:shadow-md transition-all duration-200 group text-left overflow-hidden`}
                          >
                            {/* Subtle radial glow on hover */}
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                              style={{ background: `radial-gradient(circle at 30% 50%, ${item.glow}, transparent 70%)` }}
                            />
                            <div className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                              <Icon size={16} className="text-white" strokeWidth={2} />
                            </div>
                            <div className="relative">
                              <p className={`text-sm font-bold ${item.text}`}>{item.label}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{item.desc}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-4" />
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">StudyOS Search</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlobalSearch;
