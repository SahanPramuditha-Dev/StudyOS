import React, { useState } from 'react';
import {
  Plus,
  Lightbulb,
  Trash2,
  Edit3,
  X,
  Search,
  Zap,
  Pin,
  Sparkles,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { useStorage } from '../../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../../services/storage';
import { generateGeminiResponse } from '../../../../services/aiService';

const NotesIdeapad = ({ project, onUpdate, onActivityAdd }) => {
  const [globalNotes, setGlobalNotes] = useStorage(STORAGE_KEYS.NOTES, []);
  
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: '',
    isPinned: false
  });

  React.useEffect(() => {
    if (project.notes && project.notes.length > 0) {
      const migratedNotes = project.notes.map(n => ({
        ...n,
        projectId: project.id,
        folderId: null,
        isPinned: false,
        tags: ''
      }));
      setGlobalNotes(prev => [...migratedNotes, ...prev]);
      onUpdate({ ...project, notes: [] });
      toast.success('Migrated project notes to global Knowledge Base');
    }
  }, [project, globalNotes, setGlobalNotes, onUpdate]);

  const projectNotes = globalNotes.filter(n => n.projectId === project.id);

  const handleSaveNote = () => {
    if (!newNote.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingId) {
      setGlobalNotes(prev => prev.map(n =>
        n.id === editingId
          ? { ...n, ...newNote, updatedAt: new Date().toISOString() }
          : n
      ));
      onActivityAdd('note_updated', `Updated note: ${newNote.title}`);
      toast.success('Note updated in Knowledge Base');
    } else {
      const note = {
        id: nanoid(),
        ...newNote,
        projectId: project.id,
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setGlobalNotes(prev => [note, ...prev]);
      onActivityAdd('note_created', `Created note: ${newNote.title}`);
      toast.success('Note created in Knowledge Base');
    }

    setNewNote({ title: '', content: '', tags: '', isPinned: false });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEditNote = (note) => {
    setNewNote({ 
      title: note.title, 
      content: note.content, 
      tags: note.tags || '', 
      isPinned: note.isPinned || false 
    });
    setEditingId(note.id);
    setIsCreating(true);
  };

  const handleDeleteNote = (noteId) => {
    setGlobalNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId: 'deleted' } : n));
    toast.success('Note removed from project');
  };

  const handleTogglePin = (noteId) => {
    setGlobalNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  const handleAiAssist = async (action) => {
    if (!newNote.content.trim()) {
      toast.error('Write some content first before using AI assist.');
      return;
    }
    
    setIsAiProcessing(true);
    let prompt = '';
    
    if (action === 'expand') {
      prompt = `Expand upon this note, adding more detail, structure, and relevant thoughts. Keep it in markdown format.\n\nNote Content:\n${newNote.content}`;
    } else if (action === 'summarize') {
      prompt = `Summarize this note into a concise paragraph or bullet points.\n\nNote Content:\n${newNote.content}`;
    } else if (action === 'polish') {
      prompt = `Rewrite this note to be more professional, clear, and well-structured. Fix any grammar issues.\n\nNote Content:\n${newNote.content}`;
    }

    try {
      const response = await generateGeminiResponse(prompt);
      setNewNote(prev => ({ ...prev, content: response }));
      toast.success(`Note ${action}ed successfully`);
    } catch (error) {
      toast.error('AI processing failed');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const filteredNotes = projectNotes
    .filter(n =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
       if (a.isPinned === b.isPinned) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
       }
       return a.isPinned ? -1 : 1;
    });

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
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Lightbulb size={24} className="text-yellow-500" />
                  {editingId ? 'Edit Note' : 'Quick Note'}
                </h3>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewNote({ ...newNote, isPinned: !newNote.isPinned })}
                    className={`p-2 rounded-xl transition-all ${newNote.isPinned ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Pin this note"
                  >
                    <Pin size={20} className={newNote.isPinned ? "fill-current" : ""} />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingId(null);
                      setNewNote({ title: '', content: '', tags: '', isPinned: false });
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Title</label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="e.g., Important insight, TODO, Idea"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><Tag size={12}/> Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={newNote.tags}
                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                    placeholder="e.g., planning, meeting, ideas"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black text-slate-400 uppercase">Content</label>
                    <div className="flex gap-2">
                       <button onClick={() => handleAiAssist('expand')} disabled={isAiProcessing} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"><Sparkles size={12}/> Expand</button>
                       <button onClick={() => handleAiAssist('summarize')} disabled={isAiProcessing} className="flex items-center gap-1 px-2 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors disabled:opacity-50"><Sparkles size={12}/> Summarize</button>
                       <button onClick={() => handleAiAssist('polish')} disabled={isAiProcessing} className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"><Sparkles size={12}/> Polish</button>
                    </div>
                  </div>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Write your thoughts, ideas, notes..."
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 min-h-[300px] resize-y custom-scrollbar ${isAiProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setNewNote({ title: '', content: '', tags: '', isPinned: false });
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={isAiProcessing}
                  className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                >
                  {editingId ? 'Update' : 'Save'} Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search notes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all font-medium shadow-sm"
          />
        </div>
        
        <button
          onClick={() => {
            setNewNote({ title: '', content: '', tags: '', isPinned: false });
            setEditingId(null);
            setIsCreating(true);
          }}
          className="px-6 py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
        >
          <Plus size={20} />
          New Note
        </button>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
             <Lightbulb size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">No notes found</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Your idea dump for this project is empty. Start writing down some thoughts!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
              className={`p-6 rounded-2xl border hover:shadow-xl transition-all group flex flex-col relative overflow-hidden ${note.isPinned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5 border-amber-200 dark:border-amber-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-500/30'}`}
            >
              {note.isPinned && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 rounded-bl-full flex items-start justify-end p-3">
                   <Pin size={14} className="text-amber-600 dark:text-amber-400 fill-current" />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-black text-lg text-slate-900 dark:text-white pr-8">{note.title}</h4>
              </div>
              
              {note.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                   {note.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"><Tag size={10}/> {tag}</span>
                   ))}
                </div>
              )}

              <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-6 mb-6 whitespace-pre-wrap flex-1">
                {note.content}
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <p className="text-xs font-bold text-slate-400">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTogglePin(note.id)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    title={note.isPinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin size={16} className={note.isPinned ? "fill-current text-amber-500" : ""} />
                  </button>
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                    title="Edit note"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesIdeapad;
