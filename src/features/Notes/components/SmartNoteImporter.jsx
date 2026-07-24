import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileText, Loader2, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { summarizeDocument } from '../../../services/aiService';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const SmartNoteImporter = ({ isOpen, onClose, onImportComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          // Only read first 20 pages max to save tokens/time
          const maxPages = Math.min(pdf.numPages, 20);
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const extractTextFromTextFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processFile = async (file) => {
    if (!file) return;
    
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');

    if (!isPDF && !isText) {
      toast.error('Only PDF, Markdown, or Text files are supported.');
      return;
    }

    setLoading(true);
    try {
      setStatus(`Extracting text from ${file.name}...`);
      let rawText = '';
      if (isPDF) {
        rawText = await extractTextFromPDF(file);
      } else {
        rawText = await extractTextFromTextFile(file);
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error("Could not extract any text from the file.");
      }

      setStatus('Analyzing and Summarizing with Orion AI...');
      const summary = await summarizeDocument(rawText);

      const newNote = {
        id: `note-${nanoid()}`,
        title: `AI Summary: ${file.name.replace(/\.[^/.]+$/, "")}`,
        content: `> **Source File:** ${file.name}\n\n${summary}`,
        tags: ['ai-summary'],
        courseId: '',
        videoId: '',
        folderId: '',
        pinned: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      toast.success('Document summarized successfully!');
      onImportComplete(newNote);
      onClose();
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process document: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-500">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Smart Importer</h2>
              <p className="text-xs text-slate-400 mt-0.5">Upload a PDF or Markdown file to summarize</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Loader2 size={40} className="text-primary-500 animate-spin" />
              <h3 className="font-bold text-slate-800 dark:text-white">Working its magic...</h3>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          ) : (
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <UploadCloud size={48} className={`mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Click or drag file to upload</h3>
              <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
                Supports .pdf, .md, and .txt files. Orion will extract the text and generate a smart summary.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                className="hidden" 
                accept=".pdf,.md,.txt,text/*,application/pdf"
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default SmartNoteImporter;
