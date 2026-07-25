import React, { useState } from 'react';
import {
  Upload, FileText, Image as ImageIcon, Archive, Trash2, Download, Folder, Tag, Search, Filter, Plus, Eye, MoreVertical, Link2, BookOpen, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { uploadFile, deleteFile, generateFilePath } from '../../../../services/firebaseStorage';
import { useAuth } from '../../../../context/AuthContext';
import { useStorage } from '../../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../../services/storage';
import Select from '../../../../components/ui/Select';
import { formatStorage, validateStorageSize } from '../../../../services/storageService.js';

const ResourcesTab = ({ project, onUpdate, onActivityAdd }) => {
  const { user } = useAuth();
  const [globalResources, setGlobalResources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  
  // State
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'Documentation'
  });

  const categories = ['Documentation', 'Articles', 'Tutorials', 'Lecture Materials', 'References', 'Project File'];

  // All resources for this project (Files + Links)
  const projectResources = globalResources.filter(r => 
    r.associatedType === 'Project' && 
    r.associatedId === project.id
  );

  const handleFileUpload = async (e) => {
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles = [];

      for (const file of files) {
        const storagePath = generateFilePath(user.uid, project.id, file.name);
        const downloadURL = await uploadFile(file, storagePath);

        const newFile = {
          id: nanoid(),
          name: file.name,
          type: 'File',
          fileType: file.type,
          size: file.size,
          category: 'Project File',
          createdAt: new Date().toISOString(),
          storagePath,
          url: downloadURL,
          associatedType: 'Project',
          associatedId: project.id,
        };

        uploadedFiles.push(newFile);
        onActivityAdd('file_upload', `Uploaded file "${file.name}"`);
      }

      setGlobalResources(prev => [...uploadedFiles, ...prev]);
      toast.success(`${files.length} file(s) added to Knowledge Base`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    const newResource = {
      id: nanoid(),
      name: formData.name,
      url: formData.url,
      type: 'Link',
      description: formData.description,
      category: formData.category,
      associatedType: 'Project',
      associatedId: project.id,
      createdAt: new Date().toISOString(),
    };

    setGlobalResources([newResource, ...globalResources]);
    setFormData({ name: '', url: '', description: '', category: 'Documentation' });
    setIsAddingLink(false);
    toast.success(`Link added to Knowledge Base`);
    onActivityAdd?.('resource_added', `Added link "${formData.name}"`);
  };

  const handleDelete = async (resourceId) => {
    const resource = projectResources.find(r => r.id === resourceId);
    if (!resource) return;

    try {
      if (resource.type === 'File' && resource.storagePath) {
        await deleteFile(resource.storagePath);
      }
      setGlobalResources(prev => prev.filter(r => r.id !== resourceId));
      toast.success('Resource removed from Knowledge Base');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resource.');
    }
  };

  const filteredResources = projectResources.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType = '') => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('presentation') || fileType.includes('slide')) return '🎞️';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    return formatStorage(bytes);
  };

  const totalStorageBytes = projectResources
    .filter(r => r.type !== 'Link')
    .reduce((acc, f) => acc + validateStorageSize(f.sizeBytes ?? f.size), 0);
  const storageMB = formatStorage(totalStorageBytes);

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Upload Dropzone */}
        <motion.div className="flex-1 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-6 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-500/30 text-center relative overflow-hidden group">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
            disabled={isUploading}
          />
          <Upload size={24} className="mx-auto text-blue-500 mb-2 group-hover:-translate-y-1 transition-transform" />
          <h3 className="font-black text-slate-900 dark:text-white mb-1">
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </h3>
          <p className="text-xs text-slate-500">Drag & drop or click</p>
        </motion.div>

        {/* Add Link Button */}
        <motion.button 
          onClick={() => setIsAddingLink(true)}
          className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 p-6 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-500/30 text-center hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all group"
        >
          <Link2 size={24} className="mx-auto text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-slate-900 dark:text-white mb-1">Add Web Link</h3>
          <p className="text-xs text-slate-500">Paste URL, video, or doc</p>
        </motion.button>
      </div>

      {/* Add Link Form */}
      <AnimatePresence>
        {isAddingLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg space-y-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Add Web Link</h3>
              <form onSubmit={handleAddLink} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Title *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Resource title"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none font-medium text-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">URL *</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none font-medium text-slate-800 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Category</label>
                    <Select
                      value={formData.category}
                      onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none font-medium text-slate-800 dark:text-white"
                      options={categories.map(cat => ({ label: cat, value: cat }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none font-medium text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsAddingLink(false)} className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all">Save Link</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search files and links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all group flex items-start gap-4"
              >
                <div className="text-2xl mt-1 shrink-0">
                  {resource.type === 'Link' ? '🌐' : getFileIcon(resource.fileType || resource.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white truncate mb-1" title={resource.name}>
                    {resource.name}
                  </h4>
                  
                  {resource.type === 'Link' && resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block mb-2 font-medium">
                      {resource.url}
                    </a>
                  )}

                  {resource.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {resource.category}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    {resource.type !== 'Link' && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] font-black text-slate-400">{formatFileSize(resource.size)}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    title={resource.type !== 'Link' ? "View / Download File" : "Open Link"}
                  >
                    {resource.type !== 'Link' ? <Eye size={16} /> : <Link2 size={16} />}
                  </a>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold">No resources found</p>
          <p className="text-sm text-slate-400 mt-1">Upload a file or add a web link to get started</p>
        </motion.div>
      )}

      {/* Storage Meter */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h4 className="font-black text-slate-900 dark:text-white mb-4">Storage Usage</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{storageMB} MB used</span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">100 MB limit</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(totalStorageBytes / (1024 * 1024)) / 100 * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesTab;
