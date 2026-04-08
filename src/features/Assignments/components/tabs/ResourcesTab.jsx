import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Award, Link2, FileDown, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

const ResourcesTab = ({ assignment, onUpdate }) => {
  const [resources, setResources] = useState(assignment.resources || []);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Articles',
    description: '',
    url: '',
    type: 'Link'
  });

  const categories = ['Articles', 'Tutorials', 'Lecture Materials', 'Documentation', 'References', 'Tools'];

  const handleAddResource = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Resource title is required');
      return;
    }

    if (formData.type === 'Link' && !formData.url.trim()) {
      toast.error('URL is required for links');
      return;
    }

    const newResource = {
      id: nanoid(),
      title: formData.title,
      category: formData.category,
      description: formData.description,
      url: formData.url,
      type: formData.type,
      createdAt: new Date().toISOString()
    };

    const updated = [newResource, ...resources];
    setResources(updated);
    onUpdate({
      ...assignment,
      resources: updated
    });

    setFormData({
      title: '',
      category: 'Articles',
      description: '',
      url: '',
      type: 'Link'
    });
    setIsAdding(false);
    toast.success('Resource added');
  };

  const handleDelete = (id) => {
    const updated = resources.filter(r => r.id !== id);
    setResources(updated);
    onUpdate({
      ...assignment,
      resources: updated
    });
    toast.success('Resource deleted');
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'Articles': 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400',
      'Tutorials': 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400',
      'Lecture Materials': 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      'Documentation': 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400',
      'References': 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400',
      'Tools': 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400'
    };
    return colors[category] || colors.Articles;
  };

  return (
    <motion.div className="space-y-8">
      {/* Add Resource Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-blue-500/20 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Add Resource
        </button>
      )}

      {/* Add Resource Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg space-y-6"
          >
            <h3 className="text-xl font-black text-slate-800 dark:text-white">Add Resource</h3>

            <form onSubmit={handleAddResource} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Resource title"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the resource"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setFormData({ title: '', category: 'Articles', description: '', url: '', type: 'Link' });
                  }}
                  className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-xl p-6 border transition-all group hover:shadow-lg flex flex-col ${getCategoryColor(resource.category)}`}
              >
                {/* Category Tag */}
                <div className="mb-3">
                  <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getCategoryColor(resource.category)}`}>
                    {resource.category}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="font-black text-slate-800 dark:text-white mb-2 line-clamp-2">
                  {resource.title}
                </h3>
                {resource.description && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                    {resource.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-current opacity-60">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-current hover:opacity-80 text-white opacity-0 group-hover:opacity-100 font-bold text-sm transition-all"
                  >
                    <Link2 size={14} />
                    Open
                  </a>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 font-bold text-sm transition-all"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700"
        >
          <Award size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold">No resources added</p>
          <p className="text-sm text-slate-400 mt-1">
            {resources.length === 0 ? 'Add resources, links, and references for this assignment' : 'No resources match your search'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResourcesTab;
