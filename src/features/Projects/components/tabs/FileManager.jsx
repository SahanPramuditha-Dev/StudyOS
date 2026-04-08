import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Image,
  Archive,
  Trash2,
  Download,
  Folder,
  Tag,
  Search,
  Filter,
  Plus,
  Eye,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const FileManager = ({ project, onUpdate, onActivityAdd }) => {
  const [activeFolder, setActiveFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterTag, setFilterTag] = useState('All');

  const folders = ['Notes', 'Assignments', 'Resources', 'Submissions'];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const newFile = {
        id: nanoid(),
        name: file.name,
        type: file.type,
        size: file.size,
        folder: 'Notes',
        tag: 'General',
        createdAt: new Date().toISOString(),
        url: URL.createObjectURL(file)
      };
      onUpdate({
        ...project,
        files: [newFile, ...(project.files || [])]
      });
      onActivityAdd('file_upload', `Uploaded ${file.name}`);
    });
    toast.success('Files uploaded successfully');
  };

  const handleDeleteFile = (fileId) => {
    onUpdate({
      ...project,
      files: project.files.filter(f => f.id !== fileId)
    });
    toast.success('File removed');
  };

  const handleUpdateFileTag = (fileId, newTag) => {
    onUpdate({
      ...project,
      files: project.files.map(f =>
        f.id === fileId ? { ...f, tag: newTag } : f
      )
    });
  };

  const filteredFiles = (project.files || [])
    .filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = activeFolder === 'All' || f.folder === activeFolder;
      const matchesTag = filterTag === 'All' || f.tag === filterTag;
      return matchesSearch && matchesFolder && matchesTag;
    });

  const allTags = ['General', 'Exam', 'Assignment', 'Revision', 'Reference'];

  const getFileIcon = (type) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('presentation') || type.includes('slide')) return '🎞️';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-8 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-500/30 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-500">
            <Upload size={32} />
          </div>
        </div>
        <h3 className="font-black text-slate-900 dark:text-white mb-2">Upload Study Materials</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Drag and drop files or click to upload. Supports PDF, DOCX, PPT, images, and more.
        </p>
        <label className="inline-block">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
          />
          <span className="px-6 py-3 bg-blue-500 text-white font-black rounded-xl hover:bg-blue-600 cursor-pointer transition-all inline-block">
            Choose Files
          </span>
        </label>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
          {[...folders, 'All'].map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeFolder === folder
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Folder className="inline mr-2" size={14} />
              {folder}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative group">
            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-all">
              <Filter size={20} />
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg p-3 z-10 space-y-2 border border-slate-100 dark:border-slate-800">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filterTag === tag
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                onClick={() => setFilterTag('All')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                  filterTag === 'All' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                All Tags
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold mb-2">No files found</p>
            <p className="text-sm text-slate-400">Upload your first study material to get started</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredFiles.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group flex items-center gap-4"
              >
                <div className="text-2xl">{getFileIcon(file.type)}</div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate mb-1">{file.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative group/tag">
                    <button className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
                      {file.tag}
                    </button>
                    <div className="hidden group-hover/tag:block absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 rounded-lg shadow-lg p-2 z-10 space-y-1 border border-slate-100 dark:border-slate-800">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleUpdateFileTag(file.id, tag)}
                          className="w-full text-left px-2 py-1 text-xs rounded hover:bg-primary-100 dark:hover:bg-primary-500/10 font-semibold"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <a
                    href={file.url}
                    download={file.name}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-all"
                  >
                    <Download size={16} />
                  </a>

                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
        <h4 className="font-black text-slate-900 dark:text-white mb-4">Storage Usage</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {(
                (project.files || []).reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)
              ).toFixed(2)} MB used
            </span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">100 MB limit</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500"
              style={{
                width: `${(
                  ((project.files || []).reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)) / 100
                ) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
