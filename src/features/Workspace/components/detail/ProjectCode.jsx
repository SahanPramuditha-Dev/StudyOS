import React, { useState, useMemo } from 'react';
import { 
  Github, 
  Code, 
  Plus, 
  Copy, 
  ExternalLink, 
  GitBranch, 
  GitCommit, 
  Clock,
  ChevronRight,
  Terminal,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../../../../components/EmptyState';

const ProjectCode = ({ project, onUpdate }) => {
  const [snippets, setSnippets] = useState(project.snippets || []);
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '', language: 'javascript' });
  const githubData = useMemo(() => {
    if (!project.repo) return null;
    return {
      branch: 'main',
      lastCommit: {
        message: 'Refactor auth context and update storage hooks',
        author: 'Sahan Pramuditha',
        time: '2 hours ago'
      },
      stats: {
        stars: 12,
        forks: 4,
        issues: 2
      }
    };
  }, [project.repo]);

  const handleAddSnippet = (e) => {
    e.preventDefault();
    const snippet = { ...newSnippet, id: Date.now().toString() };
    const updated = [...snippets, snippet];
    setSnippets(updated);
    onUpdate({ snippets: updated });
    setNewSnippet({ title: '', code: '', language: 'javascript' });
    setIsAddingSnippet(false);
    toast.success('Code snippet archived');
  };

  const deleteSnippet = (id) => {
    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    onUpdate({ snippets: updated });
    toast.success('Snippet removed');
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GitHub Integration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 lg:p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Github size={100} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-white">
                    <Github size={20} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">GitHub Insight</h3>
                </div>
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/20 transition-all">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {project.repo ? (
                githubData ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-primary-400" />
                        <span className="text-xs font-bold text-slate-350">{githubData.branch}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-primary-400">
                          <GitCommit size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Latest Commit</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed">{githubData.lastCommit.message}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[8px] font-bold text-slate-500">{githubData.lastCommit.author}</span>
                          <span className="text-[8px] font-bold text-slate-500">{githubData.lastCommit.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Stars', val: githubData.stats.stars },
                        { label: 'Forks', val: githubData.stats.forks },
                        { label: 'Issues', val: githubData.stats.issues }
                      ].map(stat => (
                        <div key={stat.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-base font-black">{stat.val}</p>
                          <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-[8px] font-black uppercase tracking-widest text-slate-500">
                    GitHub data unavailable
                  </div>
                )
              ) : (
                <div className="py-8 text-center space-y-3 opacity-50">
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">No repository connected to this project architectural plan.</p>
                  <button className="text-[9px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors">Connect Repository</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-3xl p-5 border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
              <Code size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-450 mb-1">Local Snippets</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{snippets.length}</p>
            </div>
          </div>
        </div>

        {/* Snippets Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-4">Code Archive</h3>
            <button 
              onClick={() => setIsAddingSnippet(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-black text-[9px] uppercase tracking-widest shadow-md shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95"
            >
              <Plus size={12} />
              New Snippet
            </button>
          </div>

          <AnimatePresence>
            {isAddingSnippet && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 border border-primary-500/30 shadow-xl space-y-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary-500">Capture Fragment</h4>
                    <button onClick={() => setIsAddingSnippet(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <input 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 outline-none text-xs font-bold" 
                      placeholder="Snippet Title (e.g. Auth Middleware)"
                      value={newSnippet.title}
                      onChange={e => setNewSnippet({...newSnippet, title: e.target.value})}
                    />
                    <div className="relative">
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 outline-none text-xs font-mono min-h-[160px] resize-none" 
                        placeholder="Paste code here..."
                        value={newSnippet.code}
                        onChange={e => setNewSnippet({...newSnippet, code: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={handleAddSnippet}
                      className="w-full py-3 rounded-xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 group"
                    >
                      <Save size={14} />
                      Save to Archive
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {snippets.length > 0 ? (
              snippets.map(snippet => (
                <div key={snippet.id} className="glass rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850/80 overflow-hidden shadow-sm group">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/20 dark:bg-slate-900/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-850 text-slate-400">
                        <Terminal size={14} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{snippet.title}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => copyCode(snippet.code)}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => deleteSnippet(snippet.id)}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50/50 dark:bg-[#020617]/50 relative">
                    <pre className="text-xs font-mono text-slate-650 dark:text-slate-400 overflow-x-auto custom-scrollbar leading-relaxed">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                compact
                icon={<Code size={32} />}
                title="No snippets archived"
                description="Store local snippets or script configurations in this module for quick workspace access."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCode;
