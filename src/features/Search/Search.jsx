import React, { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  X, 
  BookOpen, 
  Youtube, 
  FileText, 
  Github as GithubIcon, 
  Layout as Kanban,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../../services/storage';

const GlobalSearch = ({ isOpen, onClose, onSelectTab }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose(false); // Toggle logic handled by parent
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const allData = StorageService.getAll();
    const searchResults = [];

    // Search Courses
    (allData.COURSES || []).forEach(c => {
      if (c.title.toLowerCase().includes(query.toLowerCase())) {
        searchResults.push({ type: 'course', title: c.title, id: c.id, tab: 'courses' });
      }
    });

    // Search Videos
    (allData.VIDEOS || []).forEach(v => {
      if (v.title.toLowerCase().includes(query.toLowerCase())) {
        searchResults.push({ type: 'video', title: v.title, id: v.id, tab: 'videos' });
      }
    });

    // Search Notes
    (allData.NOTES || []).forEach(n => {
      if (n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase())) {
        searchResults.push({ type: 'note', title: n.title, id: n.id, tab: 'notes' });
      }
    });

    // Search Projects
    (allData.PROJECTS || []).forEach(p => {
      if (p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())) {
        searchResults.push({ type: 'project', title: p.name, id: p.id, tab: 'projects' });
      }
      
      // Search Tasks within Projects
      if (p.board) {
        ['todo', 'doing', 'done'].forEach(col => {
          (p.board[col] || []).forEach(task => {
            if (task.content.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({ 
                type: 'task', 
                title: task.content, 
                subtitle: `In project: ${p.name}`,
                id: task.id, 
                projectId: p.id,
                tab: 'workspace' 
              });
            }
          });
        });
      }
    });

    setResults(searchResults.slice(0, 8));
  }, [query]);

  const getIcon = (type) => {
    switch (type) {
      case 'course': return <BookOpen size={18} className="text-blue-500" />;
      case 'video': return <Youtube size={18} className="text-red-500" />;
      case 'note': return <FileText size={18} className="text-purple-500" />;
      case 'project': return <GithubIcon size={18} className="text-slate-700" />;
      case 'task': return <Kanban size={18} className="text-primary-500" />;
      default: return <SearchIcon size={18} className="text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <SearchIcon className="text-primary-500" size={24} />
          <input 
            autoFocus
            placeholder="Search across courses, videos, notes..."
            className="flex-1 bg-transparent border-none text-lg font-medium focus:ring-0 text-slate-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-400">ESC</kbd>
            <button onClick={() => onClose(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} className="text-slate-300" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {results.length > 0 ? (
            <div className="p-2 space-y-1">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</p>
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelectTab(result.tab);
                    onClose(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-bold text-slate-700">{result.title}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{result.type}</p>
                      {result.subtitle && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{result.subtitle}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-200 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                <SearchIcon size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Courses', tab: 'courses', icon: BookOpen, color: 'text-blue-500' },
                { label: 'Videos', tab: 'videos', icon: Youtube, color: 'text-red-500' },
                { label: 'Notes', tab: 'notes', icon: FileText, color: 'text-purple-500' },
                { label: 'Projects', tab: 'projects', icon: GithubIcon, color: 'text-slate-700' },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    onSelectTab(item.tab);
                    onClose(false);
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm transition-all text-left"
                >
                  <item.icon size={18} className={item.color} />
                  <span className="text-sm font-bold text-slate-600">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">↵</kbd>
              <span>Select</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">StudyOs Search</p>
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalSearch;
