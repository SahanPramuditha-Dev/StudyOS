import React, { useState } from 'react';
import {
  Plus,
  Code2,
  Trash2,
  Copy,
  X,
  Search,
  Filter,
  Copy as CopyIcon,
  Check,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const CodeSnippets = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [snippets, setSnippets] = useState(project.snippets || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    code: '',
    language: 'javascript',
    description: ''
  });

  const languages = ['javascript', 'python', 'java', 'cpp', 'sql', 'html', 'css', 'react', 'nodejs', 'typescript'];

  const handleCreateSnippet = () => {
    if (!newSnippet.title.trim() || !newSnippet.code.trim()) {
      toast.error('Title and code are required');
      return;
    }

    const snippet = {
      id: nanoid(),
      ...newSnippet,
      createdAt: new Date().toISOString()
    };

    const updated = [snippet, ...snippets];
    setSnippets(updated);
    onUpdate({ ...project, snippets: updated });
    onActivityAdd('snippet_created', `Created snippet: ${newSnippet.title}`);
    toast.success('Snippet saved');

    setNewSnippet({ title: '', code: '', language: 'javascript', description: '' });
    setIsCreating(false);
  };

  const handleDeleteSnippet = (snippetId) => {
    const updated = snippets.filter(s => s.id !== snippetId);
    setSnippets(updated);
    onUpdate({ ...project, snippets: updated });
    toast.success('Snippet removed');
  };

  const handleCopyCode = (code, snippetId) => {
    navigator.clipboard.writeText(code);
    setCopiedId(snippetId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = filterLanguage === 'All' || s.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  const getLanguageColor = (lang) => {
    const colors = {
      'javascript': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
      'python': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      'java': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      'cpp': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
      'sql': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
      'react': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
      'typescript': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
    };
    return colors[lang] || 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 size={20} />
                  Save Code Snippet
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Title</label>
                  <input
                    type="text"
                    value={newSnippet.title}
                    onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                    placeholder="e.g., Firebase Auth Helper"
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={newSnippet.description}
                    onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                    placeholder="What does this code do?"
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Language</label>
                  <select
                    value={newSnippet.language}
                    onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Code</label>
                  <textarea
                    value={newSnippet.code}
                    onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                    placeholder="Paste your code here..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px] resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSnippet}
                    className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
                  >
                    Save Snippet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Button */}
      <button
        onClick={() => setIsCreating(true)}
        className="w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Save Code Snippet
      </button>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {['All', ...languages].map(lang => (
            <button
              key={lang}
              onClick={() => setFilterLanguage(lang)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filterLanguage === lang
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'All' ? 'All' : lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Snippets List */}
      {filteredSnippets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
        >
          <Code2 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold mb-2">No snippets saved</p>
          <p className="text-sm text-slate-400">Save reusable code snippets for quick reference</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredSnippets.map((snippet) => (
            <motion.div
              key={snippet.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{snippet.title}</h4>
                    {snippet.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{snippet.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSnippet(snippet.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${getLanguageColor(snippet.language)}`}>
                  {snippet.language.toUpperCase()}
                </span>

                <pre className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm text-slate-100 font-mono max-h-[200px] overflow-y-auto custom-scrollbar">
                  <code>{snippet.code}</code>
                </pre>

                <button
                  onClick={() => handleCopyCode(snippet.code, snippet.id)}
                  className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {copiedId === snippet.id ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon size={16} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeSnippets;
