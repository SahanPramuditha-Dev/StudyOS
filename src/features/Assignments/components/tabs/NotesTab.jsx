import React, { useState } from 'react';
import { Plus, Trash2, Edit2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

const NotesTab = ({ assignment, onUpdate }) => {
  const [notes, setNotes] = useState(assignment.notes || []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSaveNote = (id) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (editingId) {
      const updated = notes.map(n =>
        n.id === id
          ? { ...n, title, content, updatedAt: new Date().toISOString() }
          : n
      );
      setNotes(updated);
      onUpdate({
        ...assignment,
        notes: updated
      });
      toast.success('Note updated');
    } else {
      const newNote = {
        id: nanoid(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [newNote, ...notes];
      setNotes(updated);
      onUpdate({
        ...assignment,
        notes: updated
      });
      toast.success('Note created');
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setIsCreating(true);
  };

  const handleDelete = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    onUpdate({
      ...assignment,
      notes: updated
    });
    toast.success('Note deleted');
  };

  return (
    <motion.div className="space-y-8">
      {/* Add Note Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-blue-500/20 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Add Note
        </button>
      )}

      {/* Note Editor */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg space-y-6"
          >
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              {editingId ? 'Edit Note' : 'New Note'}
            </h3>

            {/* Title Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Note Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Research findings, Key points..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white"
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your draft notes, ideas, research findings..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">Markdown formatting is supported</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={resetForm}
                className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNote(editingId)}
                className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all"
              >
                {editingId ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-500/10 dark:to-yellow-600/10 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-500/20 shadow-md hover:shadow-lg group transition-all min-h-[280px] flex flex-col"
            >
              {/* Note Header */}
              <div className="mb-4">
                <h3 className="font-black text-slate-800 dark:text-white text-lg mb-2 line-clamp-2">
                  {note.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(note.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Note Content */}
              <div className="flex-1 mb-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-5 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-4 border-t border-yellow-300 dark:border-yellow-500/30">
                <button
                  onClick={() => handleEdit(note)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-200 dark:bg-yellow-500/20 hover:bg-yellow-300 dark:hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 font-bold text-sm transition-all"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm transition-all"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {notes.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700"
        >
          <FileText size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold">No notes yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first note to draft answers and ideas</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotesTab;
