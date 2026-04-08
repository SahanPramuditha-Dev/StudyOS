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
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const SubmissionTracker = ({ project, onUpdate, onActivityAdd }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [submissions, setSubmissions] = useState(project.submissions || []);
  const [newSubmission, setNewSubmission] = useState({
    title: '',
    file: null
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewSubmission({ ...newSubmission, file });
    }
  };

  const handleUploadSubmission = () => {
    if (!newSubmission.title.trim() || !newSubmission.file) {
      toast.error('Please provide a title and select a file');
      return;
    }

    const submission = {
      id: nanoid(),
      title: newSubmission.title,
      fileName: newSubmission.file.name,
      fileSize: newSubmission.file.size,
      fileUrl: URL.createObjectURL(newSubmission.file),
      version: (submissions.length || 0) + 1,
      submittedAt: new Date().toISOString(),
      status: 'Submitted'
    };

    const updated = [submission, ...submissions];
    setSubmissions(updated);
    onUpdate({ ...project, submissions: updated });
    onActivityAdd('submission_uploaded', `Submitted: ${newSubmission.title} (v${submission.version})`);
    toast.success('Submission uploaded successfully');

    setNewSubmission({ title: '', file: null });
    setIsUploading(false);
  };

  const handleDeleteSubmission = (submissionId) => {
    const updated = submissions.filter(s => s.id !== submissionId);
    setSubmissions(updated);
    onUpdate({ ...project, submissions: updated });
    toast.success('Submission removed');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary-200 dark:border-primary-500/30 space-y-4"
          >
            <h3 className="font-black text-slate-900 dark:text-white">New Submission</h3>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Submission Title</label>
              <input
                type="text"
                value={newSubmission.title}
                onChange={(e) => setNewSubmission({ ...newSubmission, title: e.target.value })}
                placeholder="e.g., Assignment 1 Final, Project Report v2"
                className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Select File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white file:bg-primary-500 file:text-white file:font-bold file:border-0 file:rounded-lg file:px-3 file:py-1 file:cursor-pointer"
              />
              {newSubmission.file && (
                <p className="text-sm text-slate-500 mt-2">
                  File: {newSubmission.file.name} ({formatFileSize(newSubmission.file.size)})
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsUploading(false);
                  setNewSubmission({ title: '', file: null });
                }}
                className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmission}
                className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
              >
                <FileUp size={16} />
                Upload Submission
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsUploading(true)}
            className="w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
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
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
        >
          <FileUp size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold mb-2">No submissions yet</p>
          <p className="text-sm text-slate-400">Start by uploading your first submission</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByTitle).map(([title, versions], groupIdx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-lg text-slate-900 dark:text-white">{title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{versions.length} version{versions.length !== 1 ? 's' : ''}</p>
                </div>
                <CheckCircle2 className="text-green-500" size={24} />
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
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <File size={20} />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            v{submission.version}
                            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold">
                              {submission.status}
                            </span>
                          </h5>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={12} />
                            {new Date(submission.submittedAt).toLocaleString()}
                            <span>•</span>
                            {formatFileSize(submission.fileSize)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <a
                          href={submission.fileUrl}
                          download={submission.fileName}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-all"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submission Guidelines */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h4 className="font-black text-slate-900 dark:text-white mb-3">📋 Submission Guidelines</h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>✓ Keep versions organized with clear naming</li>
          <li>✓ Include submission date and version number in title</li>
          <li>✓ Upload final deliverables here</li>
          <li>✓ Maintain a version history for accountability</li>
        </ul>
      </div>
    </div>
  );
};

export default SubmissionTracker;
