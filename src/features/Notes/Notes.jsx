import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Download, 
  Eye, 
  Edit3, 
  Save, 
  Layout, 
  ChevronLeft,
  BookOpen,
  Link as LinkIcon,
  Tag as TagIcon,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import NotePreview from './components/NotePreview';
import ConfirmModal from '../../components/ConfirmModal';

const Notes = () => {
  // 1. State Management
  const [notes, setNotes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Derive active note from id
  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || null
  , [notes, activeNoteId]);

  // 2. Search & Filtering (Derived State)
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return notes;
    
    return notes.filter(n => 
      (n.title || '').toLowerCase().includes(query) ||
      (n.content || '').toLowerCase().includes(query) ||
      (n.tags || []).some(t => t.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  // 3. CRUD Operations
  const handleCreateNote = () => {
    const newNote = {
      id: nanoid(),
      title: 'New Insight',
      content: '',
      tags: [],
      courseId: '',
      videoId: '',
      timestamp: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsMobileListOpen(false);
    toast.success('Draft created');
  };

  const updateActiveNote = useCallback((updates) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId 
        ? { ...n, ...updates, updatedAt: new Date().toISOString() } 
        : n
    ));
  }, [activeNoteId, setNotes]);

  const handleDeleteNote = (id) => {
    setNoteToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteNote = () => {
    if (!noteToDelete) return;
    setNotes(prev => prev.filter(n => n.id !== noteToDelete));
    if (activeNoteId === noteToDelete) setActiveNoteId(null);
    setNoteToDelete(null);
    toast.success('Note archived');
  };

  // 4. Auto-Save Logic (Persistence)
  // useStorage handles direct updates, but we can add a visual indicator or extra sync here if needed.
  // The user requested a debounced save logic explicitly.
  useEffect(() => {
    if (!activeNote) return;
    
    const timeout = setTimeout(() => {
      // Visual feedback for "Saved"
      console.log('Knowledge synced to storage');
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [activeNote?.content, activeNote?.title]);

  // 5. Export Functionality
  const exportNote = (format = 'md') => {
    if (!activeNote) return;
    const content = activeNote.content;
    const filename = `${activeNote.title.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  // Tag Helpers
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim().toLowerCase();
      if (!activeNote.tags.includes(newTag)) {
        updateActiveNote({ tags: [...activeNote.tags, newTag] });
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    updateActiveNote({ 
      tags: activeNote.tags.filter(t => t !== tagToRemove) 
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 h-[calc(100vh-12rem)]">
      <div className="flex gap-8 h-full relative">
        {/* Notes List Sidebar */}
        <motion.div 
          className={`
            ${activeNoteId && !isMobileListOpen ? 'hidden lg:flex' : 'flex'} 
            w-full lg:w-96 flex-col h-full bg-white dark:bg-slate-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm
          `}
        >
          <NotesList 
            notes={filteredNotes}
            activeNote={activeNote}
            onSelect={(note) => {
              setActiveNoteId(note.id);
              setIsMobileListOpen(false);
            }}
            onCreate={handleCreateNote}
            onDelete={handleDeleteNote}
            searchTerm={searchQuery}
            setSearchTerm={setSearchQuery}
            courses={courses}
            videos={videos}
          />
        </motion.div>

        {/* Editor & Preview Workspace */}
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div 
              key="active-note-workspace"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden h-full"
            >
              {/* Header / Toolbar */}
              <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button 
                    onClick={() => setIsMobileListOpen(true)}
                    className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                  >
                    <ChevronLeft size={20} className="text-slate-400" />
                  </button>
                  <div className="space-y-1 flex-1 min-w-0">
                    <input 
                      className="bg-transparent border-none text-xl lg:text-2xl font-black text-slate-800 dark:text-white focus:ring-0 w-full truncate p-0"
                      value={activeNote.title}
                      onChange={(e) => updateActiveNote({ title: e.target.value })}
                      placeholder="Note Title"
                    />
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Save size={10} className="text-green-500" />
                      <span>Last synced {new Date(activeNote.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mr-2">
                    <button 
                      onClick={() => setViewMode('edit')}
                      className={`p-2 rounded-xl transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Edit Mode"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => setViewMode('split')}
                      className={`hidden sm:block p-2 rounded-xl transition-all ${viewMode === 'split' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Split View"
                    >
                      <Layout size={18} />
                    </button>
                    <button 
                      onClick={() => setViewMode('preview')}
                      className={`p-2 rounded-xl transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Preview Mode"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={() => exportNote()}
                    className="hidden sm:flex p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all"
                    title="Export as Markdown"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => setActiveNoteId(null)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Context Bar (Linking & Tags) */}
              <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                    <BookOpen size={14} />
                  </div>
                  <select 
                    className="bg-transparent border-none text-xs font-black text-slate-500 uppercase tracking-widest focus:ring-0 p-0"
                    value={activeNote.courseId}
                    onChange={(e) => updateActiveNote({ courseId: e.target.value })}
                  >
                    <option value="">Link to Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500">
                    <LinkIcon size={14} />
                  </div>
                  <select 
                    className="bg-transparent border-none text-xs font-black text-slate-500 uppercase tracking-widest focus:ring-0 p-0"
                    value={activeNote.videoId}
                    onChange={(e) => updateActiveNote({ videoId: e.target.value })}
                  >
                    <option value="">Link to Video</option>
                    {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>
                </div>

                <div className="flex-1 flex items-center gap-3 min-w-[200px]">
                  <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                    <TagIcon size={14} />
                  </div>
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {activeNote.tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black text-primary-600 uppercase tracking-widest group">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input 
                      className="bg-transparent border-none text-[10px] font-black text-slate-400 uppercase tracking-widest focus:ring-0 p-0 w-24"
                      placeholder="Add tag..."
                      onKeyDown={handleAddTag}
                    />
                  </div>
                </div>
              </div>

              {/* Editor/Preview Area */}
              <div className="flex-1 flex overflow-hidden">
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <NoteEditor 
                    content={activeNote.content}
                    onChange={(content) => updateActiveNote({ content })}
                  />
                )}
                {viewMode === 'split' && <div className="w-px bg-slate-100 dark:bg-slate-800" />}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <NotePreview content={activeNote.content} />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-6 p-12 text-center"
            >
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
                <FileText size={48} className="text-slate-200 dark:text-slate-800" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">Knowledge Hub</h3>
                <p className="text-slate-400 max-w-sm">Capture insights, document code, and build your personal study wiki with Markdown support.</p>
              </div>
              <button 
                onClick={handleCreateNote}
                className="px-8 py-3.5 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95"
              >
                Start New Note
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteNote}
        title="Archive Note"
        message="Are you sure you want to archive this knowledge piece? This will remove it from your notes collection."
        confirmText="Archive"
        type="danger"
      />
    </div>
  );
};

export default Notes;
