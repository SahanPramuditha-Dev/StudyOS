import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  FileText,
  Clock,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const DocumentationEditor = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [docs, setDocs] = useState(project.docs || []);
  const [newDoc, setNewDoc] = useState({ title: '', content: '' });

  const handleSaveDoc = () => {
    if (!newDoc.title.trim() || !newDoc.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (editingId) {
      const updated = docs.map(d =>
        d.id === editingId
          ? {
              ...d,
              ...newDoc,
              version: (d.version || 1) + 1,
              updatedAt: new Date().toISOString()
            }
          : d
      );
      setDocs(updated);
      onActivityAdd('doc_updated', `Updated documentation: ${newDoc.title}`);
      toast.success('Documentation updated');
    } else {
      const doc = {
        id: nanoid(),
        ...newDoc,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDocs([doc, ...docs]);
      onActivityAdd('doc_created', `Created documentation: ${newDoc.title}`);
      toast.success('Documentation created');
    }

    onUpdate({ ...project, docs: editingId ? docs : [{ id: nanoid(), ...newDoc, version: 1, createdAt: new Date().toISOString() }, ...docs] });
    setNewDoc({ title: '', content: '' });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (doc) => {
    setNewDoc({ title: doc.title, content: doc.content });
    setEditingId(doc.id);
    setIsCreating(true);
  };

  const handleDelete = (id) => {
    const filtered = docs.filter(d => d.id !== id);
    setDocs(filtered);
    onUpdate({ ...project, docs: filtered });
    onActivityAdd('doc_deleted', 'Deleted a documentation');
    toast.success('Documentation deleted');
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Modal */}
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
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingId ? 'Edit Documentation' : 'Create New Documentation'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setNewDoc({ title: '', content: '' });
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Title</label>
                  <input
                    type="text"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="e.g., System Requirements Specification"
                    className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Content (Markdown Supported)</label>
                  <textarea
                    value={newDoc.content}
                    onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                    placeholder="# Heading&#10;## Subheading&#10;Write your documentation..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500 min-h-[300px] resize-none font-mono text-sm"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">📝 Markdown Tips:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div><code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded"># Heading 1</code></div>
                    <div><code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">**Bold**</code></div>
                    <div><code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">## Heading 2</code></div>
                    <div><code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">*Italic*</code></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingId(null);
                      setNewDoc({ title: '', content: '' });
                    }}
                    className="flex-1 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDoc}
                    className="flex-1 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingId ? 'Update' : 'Create'}
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
          setNewDoc({ title: '', content: '' });
          setEditingId(null);
          setIsCreating(true);
        }}
        className="w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Create Documentation
      </button>

      {/* Documentation List */}
      {docs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
        >
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold mb-2">No documentation yet</p>
          <p className="text-sm text-slate-400">Create SRS, reports, and research notes</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} />
                    <span>v{doc.version}</span>
                    <span>•</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEdit(doc)}
                    className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                {doc.content.substring(0, 200)}
                {doc.content.length > 200 && '...'}
              </div>

              <button
                onClick={() => handleEdit(doc)}
                className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                <Eye size={14} />
                View Full Documentation
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentationEditor;
