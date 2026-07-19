import React, { useState, useRef, useMemo } from 'react';
import {
  Plus, Edit3, Trash2, Save, X, FileText, Clock, Eye, Sparkles, Printer, Wand2, Tag, Layout as Kanban, Github as GithubIcon, Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { generateGeminiResponse } from '../../../../services/aiService';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = ['General', 'Architecture', 'SRS', 'API', 'Meeting Notes'];

const DocumentationEditor = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  
  const [docs, setDocs] = useState(project?.docs || []);
  const [newDoc, setNewDoc] = useState({ title: '', content: '', category: 'General' });
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiFormatting, setIsAiFormatting] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const textareaRef = useRef(null);

  const availableTasks = useMemo(() => {
    if (!project?.board) return [];
    return [...(project.board.todo || []), ...(project.board.doing || []), ...(project.board.done || [])];
  }, [project]);

  const availableCommits = useMemo(() => {
    return project?.github?.commits || [];
  }, [project]);

  const handleAiBrainstorm = async () => {
    if (!newDoc.title.trim()) {
      toast.error('Please enter a document title first!');
      return;
    }
    setIsAiGenerating(true);
    try {
      const prompt = `You are a technical documentation assistant. The user is writing a document titled "${newDoc.title}".
If they have already written content, expand on it intelligently. If it is empty, create a comprehensive markdown outline or template.
Current content:
"""
${newDoc.content || "(Empty)"}
"""
Please provide a highly professional, well-formatted markdown continuation or outline. Do not wrap everything in a code block.`;
      
      const generatedText = await generateGeminiResponse(prompt);
      let currentContent = newDoc.content;
      if (currentContent && !currentContent.endsWith('\n')) currentContent += '\n\n';
      
      for (let i = 0; i < generatedText.length; i++) {
        currentContent += generatedText[i];
        setNewDoc(prev => ({ ...prev, content: currentContent }));
        await new Promise(r => setTimeout(r, 5));
      }
    } catch (error) {
      toast.error('AI Brainstorm failed: ' + error.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiFormat = async () => {
    if (!newDoc.content.trim()) {
      toast.error('Write some notes first before formatting!');
      return;
    }
    setIsAiFormatting(true);
    try {
      const prompt = `You are an expert Technical Writer. Take the following rough notes/draft and rewrite them into a beautifully structured, highly professional Markdown document. Use appropriate headings, lists, and bold text. Keep the core meaning but make it sound enterprise-ready.
Rough Draft:
"""
${newDoc.content}
"""
Output ONLY the final markdown.`;
      
      const generatedText = await generateGeminiResponse(prompt);
      setNewDoc(prev => ({ ...prev, content: generatedText }));
      toast.success('Document formatted and polished!');
    } catch (error) {
      toast.error('AI Formatting failed: ' + error.message);
    } finally {
      setIsAiFormatting(false);
    }
  };

  const insertTextAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = newDoc.content;
    
    const newVal = currentVal.substring(0, startPos) + text + currentVal.substring(endPos);
    setNewDoc(prev => ({ ...prev, content: newVal }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + text.length, startPos + text.length);
    }, 0);
  };

  const handleSaveDoc = () => {
    if (!newDoc.title.trim() || !newDoc.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (editingId) {
      const updated = docs.map(d =>
        d.id === editingId
          ? { ...d, ...newDoc, version: (d.version || 1) + 1, updatedAt: new Date().toISOString() }
          : d
      );
      setDocs(updated);
      onActivityAdd('doc_updated', `Updated documentation: ${newDoc.title}`);
      toast.success('Documentation updated');
      onUpdate({ ...project, docs: updated });
    } else {
      const doc = {
        id: nanoid(),
        ...newDoc,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [doc, ...docs];
      setDocs(updated);
      onActivityAdd('doc_created', `Created documentation: ${newDoc.title}`);
      toast.success('Documentation created');
      onUpdate({ ...project, docs: updated });
    }
    closeEditor();
  };

  const closeEditor = () => {
    setNewDoc({ title: '', content: '', category: 'General' });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (doc) => {
    setNewDoc({ title: doc.title, content: doc.content, category: doc.category || 'General' });
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

  const handlePrint = () => {
    window.print();
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'SRS': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
      case 'Architecture': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'API': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Meeting Notes': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const markdownRenderers = {
    a: ({ node, ...props }) => {
      if (props.href?.startsWith('task://')) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black tracking-wide border border-blue-200 dark:border-blue-500/20 shadow-sm whitespace-nowrap cursor-pointer hover:bg-blue-100 transition-colors">
            <Kanban size={12} />
            {props.children}
          </span>
        );
      }
      if (props.href?.startsWith('github://')) {
        const sha = props.href.replace('github://', '');
        return (
          <a href={`https://github.com/search?q=${sha}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black tracking-wide border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors no-underline whitespace-nowrap">
            <GithubIcon size={12} />
            {props.children}
          </a>
        );
      }
      return <a {...props} className="text-primary-500 hover:underline font-semibold" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Modal (Split Pane) */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 relative z-20 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {editingId ? 'Edit Documentation' : 'Create New Documentation'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAiBrainstorm}
                      disabled={isAiGenerating || isAiFormatting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={14} className={isAiGenerating ? "animate-pulse" : ""} />
                      {isAiGenerating ? 'Generating...' : 'Brainstorm'}
                    </button>
                    <button
                      onClick={handleAiFormat}
                      disabled={isAiGenerating || isAiFormatting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
                    >
                      <Wand2 size={14} className={isAiFormatting ? "animate-pulse" : ""} />
                      {isAiFormatting ? 'Formatting...' : 'Format & Polish'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={closeEditor} className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-all text-slate-500">
                    <X size={20} />
                  </button>
                  <button onClick={handleSaveDoc} className="px-6 py-2 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center gap-2">
                    <Save size={16} /> Save
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Editor Pane */}
                <div className="w-1/2 flex flex-col border-r border-slate-100 dark:border-slate-800 p-4 gap-4 overflow-y-auto custom-scrollbar relative">
                  
                  {isTaskModalOpen && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-30 flex flex-col p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black flex items-center gap-2"><Kanban size={20} className="text-primary-500"/> Select Task to Link</h4>
                        <button onClick={() => setIsTaskModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16}/></button>
                      </div>
                      <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                        {availableTasks.length === 0 ? <p className="text-sm text-slate-500 font-medium">No tasks found in project.</p> : availableTasks.map(t => (
                          <button key={t.id} onClick={() => { insertTextAtCursor(`[Task: ${t.content}](task://${t.id})`); setIsTaskModalOpen(false); }} className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-50 dark:hover:bg-primary-500/10 border border-transparent hover:border-primary-100 dark:hover:border-primary-500/30 text-sm font-bold transition-all flex items-center gap-3 group">
                            <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:text-primary-500"><Kanban size={14}/></span>
                            {t.content}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isGithubModalOpen && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-30 flex flex-col p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black flex items-center gap-2"><GithubIcon size={20} className="text-slate-700 dark:text-slate-300"/> Select Commit to Link</h4>
                        <button onClick={() => setIsGithubModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16}/></button>
                      </div>
                      <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                        {availableCommits.length === 0 ? <p className="text-sm text-slate-500 font-medium">No commits found. Is GitHub connected?</p> : availableCommits.map(c => (
                          <button key={c.sha} onClick={() => { insertTextAtCursor(`[Commit: ${c.message.split('\n')[0]}](github://${c.sha})`); setIsGithubModalOpen(false); }} className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-sm font-bold transition-all flex flex-col gap-1 group">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{c.sha.substring(0,7)}</span>
                              <span className="truncate">{c.message.split('\n')[0]}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{c.author}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Title</label>
                      <input
                        type="text"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                        placeholder="e.g., System Architecture"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                      />
                    </div>
                    <div className="w-48">
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Category</label>
                      <div className="relative">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={newDoc.category}
                          onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium appearance-none cursor-pointer"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black text-slate-400 uppercase">Content (Markdown)</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-primary-500 transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          <Link size={12}/> Link Task
                        </button>
                        <button onClick={() => setIsGithubModalOpen(true)} className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          <Link size={12}/> Link Commit
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                      placeholder="Write your markdown here... Try linking a task above!"
                      className="flex-1 w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm custom-scrollbar leading-relaxed"
                    />
                  </div>
                </div>
                
                {/* Preview Pane */}
                <div className="w-1/2 p-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#0B1120]">
                  <p className="text-xs font-black text-slate-400 uppercase mb-4">Live Preview</p>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 min-h-full">
                    {newDoc.title && <h1 className="text-3xl font-black mb-6 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">{newDoc.title}</h1>}
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown components={markdownRenderers}>{newDoc.content || '*Nothing to preview yet...*'}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read Mode Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md z-50 overflow-y-auto custom-scrollbar print:bg-white print:p-0"
          >
            <div className="min-h-screen py-12 px-4 print:py-0 print:px-0 flex justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white dark:bg-[#0B1120] rounded-3xl w-full max-w-4xl p-12 shadow-2xl border border-slate-200 dark:border-slate-800 relative print:border-none print:shadow-none print:p-0"
              >
                {/* Actions Bar (Hidden on print) */}
                <div className="absolute top-6 right-6 flex items-center gap-2 print:hidden">
                  <button onClick={handlePrint} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all tooltip group relative">
                    <Printer size={18} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Print / PDF</span>
                  </button>
                  <button onClick={() => { setViewingDoc(null); handleEdit(viewingDoc); }} className="p-2 rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 hover:bg-primary-200 transition-all tooltip group relative">
                    <Edit3 size={18} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Edit Doc</span>
                  </button>
                  <button onClick={() => setViewingDoc(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-10 print:mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(viewingDoc.category)}`}>
                      {viewingDoc.category || 'General'}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Version {viewingDoc.version}</span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">{viewingDoc.title}</h1>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <Clock size={16} /> Last updated on {new Date(viewingDoc.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown components={markdownRenderers}>{viewingDoc.content}</ReactMarkdown>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Actions */}
      <button
        onClick={() => setIsCreating(true)}
        className="w-full px-6 py-4 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
      >
        <Plus size={20} /> Create New Document
      </button>

      {/* Documentation Grid */}
      {docs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">No Documentation Found</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Create beautiful SRS documents, architecture roadmaps, or meeting notes.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setViewingDoc(doc)}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-500/50 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getCategoryColor(doc.category)}`}>
                  {doc.category || 'General'}
                </span>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(doc)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 line-clamp-1 group-hover:text-primary-500 transition-colors">
                {doc.title}
              </h4>
              
              <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1 font-medium">
                {doc.content.replace(/[#*`_>\[\]\(\)]/g, '') || 'Empty document'}
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={14} /> Read
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentationEditor;
