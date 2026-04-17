import React, { useState } from 'react';
import { X, FileText, Play, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResourcePreview = ({ isOpen, onClose, resource, url }) => {
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  const getPreviewContent = () => {
    const ext = resource?.name?.split('.').pop()?.toLowerCase();
    const isPdf = resource?.type === 'PDF' || ext === 'pdf';
    const isVideo = resource?.type === 'Video' || ['mp4', 'webm', 'ogg'].includes(ext);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

    if (isPdf) {
      // Note: For full PDF viewer, integrate react-pdf later. Show placeholder for now.
      return (
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <FileText size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">PDF Preview</p>
            <p className="text-sm text-slate-500 mt-1">Click to download full document</p>
          </div>
        </div>
      );
    }

    if (isVideo && url) {
      return (
        <video
          src={url}
          controls
          muted
          className="w-full h-96 rounded-xl object-contain bg-slate-900"
          onLoadedData={() => setLoading(false)}
          onError={() => setLoading(false)}
        >
          <track default kind="captions" />
        </video>
      );
    }

    if (isImage && url) {
      return (
        <img
          src={url}
          alt={resource?.name}
          className="w-full h-96 rounded-xl object-contain bg-slate-50 dark:bg-slate-900"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      );
    }

    // Default: Link thumbnail
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-8 text-center">
        <LinkIcon size={48} className="mx-auto mb-4 text-blue-400" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{resource?.name}</p>
        <p className="text-sm text-slate-500 mt-2 max-w-md">{resource?.description || 'External resource'}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
              {resource?.type || 'Link'}
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 dark:text-white truncate max-w-xs">{resource?.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{resource?.description || 'No description'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-all"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-b-3xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          )}
          {getPreviewContent()}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex gap-3 justify-end">
          <a
            href={url || resource?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-primary-500/25"
          >
            Open Full {resource?.type === 'PDF' ? 'Document' : 'Resource'}
          </a>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-black uppercase tracking-wider text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResourcePreview;

