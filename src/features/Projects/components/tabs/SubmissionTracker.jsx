import React, { useState } from 'react';
import {
  Plus,
  FileUp,
  Trash2,
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  Lock,
  File,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { generateGeminiResponse } from '../../../../services/aiService';
import Select from '../../../../components/ui/Select';
import { formatStorage } from '../../../../services/storageService.js';

const STATUSES = ['Submitted', 'Needs Revision', 'Graded', 'Approved'];

const SubmissionTracker = ({ project, onUpdate, onActivityAdd }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [submissions, setSubmissions] = useState(project.submissions || []);
  const [newSubmission, setNewSubmission] = useState({
    title: '',
    file: null,
    link: '',
    notes: ''
  });

  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAiChecking, setIsAiChecking] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewSubmission({ ...newSubmission, file });
    }
  };

  const handleAiCheck = async () => {
    if (!newSubmission.title.trim()) {
      toast.error('Provide a title to run the pre-flight check.');
      return;
    }
    
    setIsAiChecking(true);
    setAiFeedback(null);
    try {
      const prompt = `You are a virtual Teaching Assistant reviewing a student's submission pre-flight check.
Title: ${newSubmission.title}
File attached: ${newSubmission.file ? newSubmission.file.name : 'None'}
External Link: ${newSubmission.link || 'None'}
Notes provided: ${newSubmission.notes || 'None'}

Give a short, friendly 1-2 sentence response validating if this looks like a complete submission, or if they might be forgetting something (like notes or a file).`;
      
      const response = await generateGeminiResponse(prompt);
      setAiFeedback(response);
    } catch (error) {
      toast.error('AI Check failed: ' + error.message);
    } finally {
      setIsAiChecking(false);
    }
  };

  const handleUploadSubmission = () => {
    if (!newSubmission.title.trim()) {
      toast.error('Please provide a title');
      return;
    }
    if (!newSubmission.file && !newSubmission.link) {
      toast.error('Please provide either a file or an external link');
      return;
    }

    const submission = {
      id: nanoid(),
      title: newSubmission.title,
      fileName: newSubmission.file?.name || null,
      fileSize: newSubmission.file?.size || 0,
      fileUrl: newSubmission.file ? URL.createObjectURL(newSubmission.file) : null,
      link: newSubmission.link,
      notes: newSubmission.notes,
      version: (submissions.filter(s => s.title === newSubmission.title).length || 0) + 1,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      feedback: ''
    };

    const updated = [submission, ...submissions];
    setSubmissions(updated);
    onUpdate({ ...project, submissions: updated });
    onActivityAdd('submission_uploaded', `Submitted: ${newSubmission.title} (v${submission.version})`);
    toast.success('Submission uploaded successfully');

    setNewSubmission({ title: '', file: null, link: '', notes: '' });
    setAiFeedback(null);
    setIsUploading(false);
  };

  const handleDeleteSubmission = (submissionId) => {
    const updated = submissions.filter(s => s.id !== submissionId);
    setSubmissions(updated);
    onUpdate({ ...project, submissions: updated });
    toast.success('Submission removed');
  };

  const handleUpdateStatus = (submissionId, newStatus) => {
    const updated = submissions.map(s => s.id === submissionId ? { ...s, status: newStatus } : s);
    setSubmissions(updated);
    onUpdate({ ...project, submissions: updated });
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleUpdateFeedback = (submissionId, feedback) => {
    const updated = submissions.map(s => s.id === submissionId ? { ...s, feedback } : s);
    setSubmissions(updated);
    onUpdate({ ...project, submissions: updated });
  };

  const formatFileSize = (bytes) => {
    return formatStorage(bytes);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Graded': return 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'Needs Revision': return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'Approved': return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      default: return 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400';
    }
  };

  const groupedByTitle = submissions.reduce((acc, sub) => {
    if (!acc[sub.title]) acc[sub.title] = [];
    acc[sub.title].push(sub);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <AnimatePresence>
        {isUploading ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary-200 dark:border-primary-500/30 shadow-xl space-y-4 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-xl text-slate-900 dark:text-white">New Submission</h3>
              <button
                onClick={handleAiCheck}
                disabled={isAiChecking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <Sparkles size={14} className={isAiChecking ? "animate-pulse" : ""} />
                {isAiChecking ? 'Checking...' : 'AI Pre-Flight Check'}
              </button>
            </div>

            {aiFeedback && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-indigo-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 leading-relaxed">{aiFeedback}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Submission Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newSubmission.title}
                onChange={(e) => setNewSubmission({ ...newSubmission, title: e.target.value })}
                placeholder="e.g., Assignment 1 Final, Project Report v2"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none border border-transparent focus:border-primary-500 transition-colors font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><FileUp size={12}/> Select File</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white file:bg-primary-500 file:text-white file:font-bold file:border-0 file:rounded-lg file:px-3 file:py-1 file:cursor-pointer file:mr-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><LinkIcon size={12}/> External Link (Optional)</label>
                <input
                  type="url"
                  value={newSubmission.link}
                  onChange={(e) => setNewSubmission({ ...newSubmission, link: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none border border-transparent focus:border-primary-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><MessageSquare size={12}/> Notes for Reviewer (Optional)</label>
              <textarea
                value={newSubmission.notes}
                onChange={(e) => setNewSubmission({ ...newSubmission, notes: e.target.value })}
                placeholder="Add any comments or context for the person reviewing this submission..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none border border-transparent focus:border-primary-500 transition-colors text-sm min-h-[100px] resize-y custom-scrollbar"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsUploading(false);
                  setNewSubmission({ title: '', file: null, link: '', notes: '' });
                  setAiFeedback(null);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmission}
                className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                <FileUp size={18} />
                Submit Assignment
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsUploading(true)}
            className="w-full px-6 py-4 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
          >
            <Plus size={20} />
            New Submission
          </button>
        )}
      </AnimatePresence>

      {/* Submissions List */}
      {Object.keys(groupedByTitle).length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
             <FileUp size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">No submissions yet</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Start by uploading your first assignment or draft.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByTitle).map(([title, versions], groupIdx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h4 className="font-black text-xl text-slate-900 dark:text-white">{title}</h4>
                  <p className="text-sm font-bold text-slate-400 mt-1">{versions.length} version{versions.length !== 1 ? 's' : ''} submitted</p>
                </div>
                <CheckCircle2 className="text-green-500" size={28} />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {versions
                  .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                  .map((submission, idx) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIdx * 0.1 + idx * 0.05 }}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-1">
                            {submission.fileUrl ? <File size={20} /> : <LinkIcon size={20} />}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-black text-lg text-slate-900 dark:text-white mb-1 flex items-center gap-3">
                              v{submission.version}
                              
                              <select
                                value={submission.status}
                                onChange={(e) => handleUpdateStatus(submission.id, e.target.value)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer appearance-none ${getStatusColor(submission.status)}`}
                              >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </h5>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(submission.submittedAt).toLocaleString()}</span>
                              {submission.fileSize > 0 && <span>• {formatFileSize(submission.fileSize)}</span>}
                            </div>
                            
                            {submission.notes && (
                              <div className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-black text-slate-400 uppercase block mb-1">Notes</span>
                                {submission.notes}
                              </div>
                            )}

                            {submission.status !== 'Submitted' && (
                              <div className="mt-3">
                                <textarea 
                                  placeholder="Add reviewer feedback here..."
                                  value={submission.feedback || ''}
                                  onChange={(e) => handleUpdateFeedback(submission.id, e.target.value)}
                                  className="w-full text-sm font-medium text-slate-700 dark:text-slate-300 bg-yellow-50 dark:bg-yellow-500/5 p-3 rounded-lg border border-yellow-200 dark:border-yellow-500/20 outline-none focus:border-yellow-400 transition-colors min-h-[60px] resize-y custom-scrollbar"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {submission.link && (
                            <a
                              href={submission.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all tooltip relative group"
                            >
                              <LinkIcon size={16} />
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Open Link</span>
                            </a>
                          )}
                          {submission.fileUrl && (
                            <a
                              href={submission.fileUrl}
                              download={submission.fileName}
                              className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all tooltip relative group"
                            >
                              <Download size={16} />
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Download File</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteSubmission(submission.id)}
                            className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-all tooltip relative group"
                          >
                            <Trash2 size={16} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submission Guidelines */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
        <h4 className="font-black text-slate-900 dark:text-white mb-3">📋 Submission Guidelines</h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <li>✓ Keep versions organized with clear naming</li>
          <li>✓ Add external links for deployed apps or Figma files</li>
          <li>✓ Use the AI Pre-Flight Check before submitting</li>
          <li>✓ Check back for graded feedback from reviewers</li>
        </ul>
      </div>
    </div>
  );
};

export default SubmissionTracker;
