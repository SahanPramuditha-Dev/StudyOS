import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Search, 
  Filter, 
  Star, 
  CheckCircle2, 
  Layers,
  FileSearch,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import PaperItem from './components/PaperItem';
import PaperForm from './components/PaperForm';
import ConfirmModal from '../../components/ConfirmModal';

const Papers = () => {
  // 1. State Management
  const [papers, setPapers] = useStorage(STORAGE_KEYS.PAPERS, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });

  const [paperForm, setPaperForm] = useState({
    name: '',
    url: '',
    type: 'PDF',
    pages: 1,
    readPages: 0,
    important: false,
    completed: false,
    summary: ''
  });

  // 2. Search & Filtering (Derived State)
  const filteredPapers = papers.filter(paper => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = paper.name.toLowerCase().includes(query) || (paper.summary || '').toLowerCase().includes(query);
    const matchesFilter = filterType === 'All' || 
                         (filterType === 'Important' && paper.important) || 
                         (filterType === 'Completed' && paper.completed) ||
                         (filterType === 'Active' && !paper.completed);
    return matchesSearch && matchesFilter;
  });

  // 3. CRUD Handlers
  const handlePaperSubmit = (e) => {
    e.preventDefault();
    if (!paperForm.name || !paperForm.url) return;

    const newPaper = {
      ...paperForm,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPapers([newPaper, ...papers]);
    toast.success('Reading track launched');
    closeModal();
  };

  const deletePaper = (id) => {
    setConfirmConfig({
      isOpen: true,
      message: 'Terminate this reading track? All summary data will be lost.',
      onConfirm: () => {
        setPapers(papers.filter(p => p.id !== id));
        toast.success('Track archived');
      }
    });
  };

  const toggleProperty = (id, prop) => {
    setPapers(papers.map(p => p.id === id ? { ...p, [prop]: !p[prop], updatedAt: new Date().toISOString() } : p));
  };

  const updateProgress = (id, readPages) => {
    setPapers(papers.map(p => {
      if (p.id === id) {
        const completed = readPages >= p.pages;
        if (completed && !p.completed) toast.success('Knowledge Mastery Achieved!');
        return { ...p, readPages, completed, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  };

  const updateSummary = (id, summary) => {
    setPapers(papers.map(p => p.id === id ? { ...p, summary, updatedAt: new Date().toISOString() } : p));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPaperForm({
      name: '', url: '', type: 'PDF', pages: 1, readPages: 0, important: false, completed: false, summary: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Title Section */}
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
          <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
            <BookOpen size={32} />
          </div>
          Reading Library
        </h1>
        <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs">Analyze papers and track academic progress</p>
      </div>

      {/* Filter and Actions */}
      <div className="flex flex-col gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search papers, lectures, or summaries..."
              className="w-full pl-12 pr-4 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-4 ring-primary-500/10 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mr-2">
              {['All', 'Active', 'Important', 'Completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterType === f 
                      ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform" />
              New Paper
            </button>
          </div>
        </div>
      </div>

      {/* Paper List Display */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredPapers.map(paper => (
            <PaperItem 
              key={paper.id}
              paper={paper}
              onDelete={deletePaper}
              onToggleImportant={(id) => toggleProperty(id, 'important')}
              onToggleCompleted={(id) => toggleProperty(id, 'completed')}
              onUpdateProgress={updateProgress}
              onUpdateSummary={updateSummary}
              isExpanded={expandedId === paper.id}
              onToggleExpand={() => setExpandedId(expandedId === paper.id ? null : paper.id)}
            />
          ))}
        </AnimatePresence>

        {filteredPapers.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <FileSearch size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Empty Archive</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Upload research papers or lecture slides to start documenting your academic journey.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
            >
              Onboard First Document
            </button>
          </motion.div>
        )}
      </div>

      {/* Paper Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <PaperForm 
            paperForm={paperForm}
            setPaperForm={setPaperForm}
            onSubmit={handlePaperSubmit}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title="Archive Paper"
      />
    </div>
  );
};

export default Papers;
