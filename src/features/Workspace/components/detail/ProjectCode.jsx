import React, { useState, useEffect } from 'react';
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

const ProjectCode = ({ project, onUpdate }) => {
  const [snippets, setSnippets] = useState(project.snippets || []);
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '', language: 'javascript' });
  const [githubData, setGithubData] = useState(null);
  const [loadingGithub, setLoadingGithub] = useState(false);

  // Mock GitHub Fetch
  useEffect(() => {
    if (project.repo) {
      setLoadingGithub(true);
      // Simulate API call to GitHub
      setTimeout(() => {
        setGithubData({
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
        });
        setLoadingGithub(false);
      }, 1500);
    }
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
          <div className="card p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Github size={120} />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/10 text-white">
                    <Github size={24} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest">GitHub Insight</h3>
                </div>
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/20 transition-all">
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>

              {project.repo ? (
                loadingGithub ? (
                  <div className="py-12 flex flex-col items-center gap-4 opacity-50">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Fetching Repository Data...</p>
                  </div>
                ) : githubData ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <GitBranch size={16} className="text-primary-400" />
                        <span className="text-sm font-bold text-slate-300">{githubData.branch}</span>
                      </div>
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <div className="flex items-center gap-2 text-primary-400">
                          <GitCommit size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Latest Commit</span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed">{githubData.lastCommit.message}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[10px] font-bold text-slate-500">{githubData.lastCommit.author}</span>
                          <span className="text-[10px] font-bold text-slate-500">{githubData.lastCommit.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Stars', val: githubData.stats.stars },
                        { label: 'Forks', val: githubData.stats.forks },
                        { label: 'Issues', val: githubData.stats.issues }
                      ].map(stat => (
                        <div key={stat.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-xl font-black">{stat.val}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              ) : (
                <div className="py-12 text-center space-y-4 opacity-50">
                  <p className="text-sm font-medium text-slate-400">No repository connected to this project architectural plan.</p>
                  <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors">Connect Repository</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
              <Code size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Local Snippets</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{snippets.length}</p>
            </div>
          </div>
        </div>

        {/* Snippets Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Code Archive</h3>
            <button 
              onClick={() => setIsAddingSnippet(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95"
            >
              <Plus size={14} />
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
                <div className="card p-8 bg-white dark:bg-slate-900 border-primary-500/30 shadow-xl shadow-primary-500/5 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary-500">Capture Fragment</h4>
                    <button onClick={() => setIsAddingSnippet(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <input 
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold" 
                      placeholder="Snippet Title (e.g. Auth Middleware)"
                      value={newSnippet.title}
                      onChange={e => setNewSnippet({...newSnippet, title: e.target.value})}
                    />
                    <div className="relative">
                      <textarea 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-xs font-mono min-h-[200px] resize-none" 
                        placeholder="Paste code here..."
                        value={newSnippet.code}
                        onChange={e => setNewSnippet({...newSnippet, code: e.target.value})}
                      />
                      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-slate-900 text-[8px] font-black text-white uppercase tracking-widest">
                        Markdown Supported
                      </div>
                    </div>
                    <button 
                      onClick={handleAddSnippet}
                      className="w-full py-4 rounded-2xl bg-primary-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 group"
                    >
                      <Save size={16} className="group-hover:scale-110 transition-transform" />
                      Save to Archive
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {snippets.length > 0 ? (
              snippets.map(snippet => (
                <div key={snippet.id} className="card bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm group">
                  <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400">
                        <Terminal size={16} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{snippet.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyCode(snippet.code)}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => deleteSnippet(snippet.id)}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50/50 dark:bg-[#020617] relative">
                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto custom-scrollbar leading-relaxed">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center space-y-4 opacity-30">
                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Code size={32} className="text-slate-300" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">No code fragments captured yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCode;
