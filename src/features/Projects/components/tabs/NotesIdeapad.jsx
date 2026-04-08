import React, { useState } from 'react';
import {
  Plus,
  Lightbulb,
  Trash2,
  Edit3,
  X,
  Search,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const NotesIdeapad = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [notes, setNotes] = useState(project.notes || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: ''
  });

  const handleSaveNote = () => {
    if (!newNote.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingId) {
      const updated = notes.map(n =>
        n.id === editingId
          ? { ...n, ...newNote, updatedAt: new Date().toISOString() }
          : n
      );
      setNotes(updated);
      onUpdate({ ...project, notes: updated });
      onActivityAdd('note_updated', `Updated note: ${newNote.title}`);
      toast.success('Note updated');
    } else {
      const note = {
        id: nanoid(),
        ...newNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes([note, ...notes]);
      onUpdate({ ...project, notes: [note, ...notes] });
      onActivityAdd('note_created', `Created note: ${newNote.title}`);
      toast.success('Note created');
    }

    setNewNote({ title: '', content: '' });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEditNote = (note) => {
    setNewNote({ title: note.title, content: note.content });
    setEditingId(note.id);
    setIsCreating(true);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    onUpdate({ ...project, notes: updated });
    toast.success('Note deleted');
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <Lightbulb size={20} />
                  {editingId ? 'Edit Note' : 'Quick Note'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setNewNote({ title: '', content: '' });
                  }}
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
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="e.g., Important insight, TODO, Idea"
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Content</label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Write your thoughts, ideas, notes..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px] resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingId(null);
                      setNewNote({ title: '', content: '' });
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
                  >
                    {editingId ? 'Update' : 'Save'} Note
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Button */}
      <button
        onClick={() => {
          setNewNote({ title: '', content: '' });
          setEditingId(null);
          setIsCreating(true);
        }}
        className="w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Add Quick Note
      </button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
        >
          <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold mb-2">No notes yet</p>
          <p className="text-sm text-slate-400">Your idea dump for this project</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-500/10 dark:to-amber-500/10 p-5 rounded-xl border border-yellow-100 dark:border-yellow-500/30 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Lightbulb className="text-yellow-600 dark:text-yellow-400" size={20} />
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-1.5 rounded-lg bg-yellow-200 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-300 transition-all"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 rounded-lg bg-red-200 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-300 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{note.title}</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-4 mb-3">
                {note.content}
              </p>

              <p className="text-xs text-slate-500">
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesIdeapad;
