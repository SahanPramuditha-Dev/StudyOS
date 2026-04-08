import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  History,
  ChevronRight,
  BookOpen,
  Layout,
  Type,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProjectDocs = ({ project, onUpdate }) => {
  const [docs, setDocs] = useState(project.docs || []);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveDoc = () => {
    if (!activeDoc.title.trim()) {
      toast.error('Document requires a title');
      return;
    }

    let updatedDocs;
    if (activeDoc.id) {
      updatedDocs = docs.map(d => d.id === activeDoc.id ? { ...activeDoc, updatedAt: new Date().toISOString(), version: (d.version || 1) + 1 } : d);
    } else {
      const newDoc = { ...activeDoc, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 };
      updatedDocs = [...docs, newDoc];
    }

    setDocs(updatedDocs);
    onUpdate({ docs: updatedDocs });
    setIsEditing(false);
    setActiveDoc(null);
    toast.success('Documentation version saved');
  };

  const deleteDoc = (id) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    onUpdate({ docs: updated });
    toast.success('Document purged');
  };

  const filteredDocs = docs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8 bg-white dark:bg-slate-900 border-primary-500/20 shadow-2xl space-y-8"
          >
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Drafting Module</h3>
                  <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Structure your project intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveDoc}
                  className="px-8 py-3 rounded-xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all flex items-center gap-2"
                >
                  <Save size={14} />
                  Deploy Version
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <input 
                className="w-full text-3xl font-black bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800"
                placeholder="Document Title (e.g. SRS v1.0)"
                value={activeDoc.title}
                onChange={e => setActiveDoc({...activeDoc, title: e.target.value})}
              />
              <textarea 
                className="w-full min-h-[500px] bg-slate-50/50 dark:bg-[#020617] rounded-[2rem] p-8 border-none outline-none text-slate-600 dark:text-slate-400 leading-relaxed font-medium resize-none custom-scrollbar"
                placeholder="Start drafting your architectural documentation... (Markdown supported)"
                value={activeDoc.content}
                onChange={e => setActiveDoc({...activeDoc, content: e.target.value})}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full max-w-xl relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Search intelligence reports..."
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:border-primary-500/20 focus:ring-4 ring-primary-500/5 transition-all text-sm font-medium"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <button 
                onClick={() => {
                  setActiveDoc({ title: '', content: '' });
                  setIsEditing(true);
                }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 group"
              >
                <Plus size={18} />
                Draft Document
              </button>
            </div>

            {/* Docs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDocs.length > 0 ? (
                filteredDocs.map(doc => (
                  <div key={doc.id} className="card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-500/20 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all group">
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            setActiveDoc(doc);
                            setIsEditing(true);
                          }}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteDoc(doc.id)}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2 line-clamp-1">{doc.title}</h4>
                    <p className="text-sm font-medium text-slate-400 line-clamp-3 mb-8 leading-relaxed">
                      {doc.content || 'Empty intelligence fragment...'}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <History size={12} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v{doc.version || 1}.0</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-40 text-center space-y-6 opacity-30">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <BookOpen size={40} className="text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-widest">Intelligence Void</p>
                    <p className="text-xs font-medium">No documentation has been drafted for this project.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDocs;
