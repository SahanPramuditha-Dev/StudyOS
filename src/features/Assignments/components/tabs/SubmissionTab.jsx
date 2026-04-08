import React, { useState } from 'react';
import { Upload, Download, Trash2, Plus, FileUp, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

const SubmissionTab = ({ assignment, onUpdate }) => {
  const [submissions, setSubmissions] = useState(assignment.submissions || []);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('Draft');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = () => {
    if (!uploadTitle.trim() || !uploadFile) {
      toast.error('Please add a title and select a file');
      return;
    }

    const newSubmission = {
      id: nanoid(),
      title: uploadTitle,
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileUrl: URL.createObjectURL(uploadFile),
      version: submissionType === 'Final' ? 'Final' : `v${submissions.filter(s => s.title === uploadTitle && s.version !== 'Final').length + 1}`,
      submissionType: submissionType,
      submittedAt: new Date().toISOString(),
      status: submissionType === 'Final' ? 'Submitted' : 'Draft'
    };

    const updated = [...submissions, newSubmission];
    setSubmissions(updated);
    onUpdate({
      ...assignment,
      submissions: updated
    });

    setUploadTitle('');
    setUploadFile(null);
    setSubmissionType('Draft');
    setIsUploadOpen(false);
    toast.success('File uploaded successfully');
  };

  const handleDelete = (id) => {
    const updated = submissions.filter(s => s.id !== id);
    setSubmissions(updated);
    onUpdate({
      ...assignment,
      submissions: updated
    });
    toast.success('Submission deleted');
  };

  const groupedSubmissions = submissions.reduce((acc, sub) => {
    const key = sub.title;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {});

  return (
    <motion.div className="space-y-8">
      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-blue-500/20 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Add Submission
        </button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg space-y-6"
          >
            <h3 className="text-xl font-black text-slate-800 dark:text-white">Upload Submission</h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Submission Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Assignment Draft v1"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Type
                </label>
                <select
                  value={submissionType}
                  onChange={(e) => setSubmissionType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Final">Final Submission</option>
                </select>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer group"
              onClick={() => document.getElementById('fileInput').click()}>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileUp size={32} className="mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <p className="font-bold text-slate-800 dark:text-white mb-1">
                {uploadFile ? uploadFile.name : 'Click to select file or drag and drop'}
              </p>
              <p className="text-sm text-slate-500">(Max 50MB)</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadTitle('');
                  setUploadFile(null);
                }}
                className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all flex items-center gap-2"
              >
                <Upload size={16} />
                Upload File
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions List */}
      {Object.keys(groupedSubmissions).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedSubmissions).map(([title, subs]) => (
            <div key={title} className="space-y-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">{title}</h3>
              <div className="space-y-3">
                {subs.map((submission, idx) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      submission.status === 'Submitted'
                        ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                        : 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        submission.status === 'Submitted'
                          ? 'bg-green-200 dark:bg-green-500/20'
                          : 'bg-yellow-200 dark:bg-yellow-500/20'
                      }`}>
                        {submission.status === 'Submitted' ? (
                          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                        ) : (
                          <FileUp size={20} className="text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-slate-800 dark:text-white">{submission.fileName}</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                            submission.status === 'Submitted'
                              ? 'bg-green-200 dark:bg-green-500/30 text-green-700 dark:text-green-300'
                              : 'bg-yellow-200 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {submission.version}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(submission.fileSize)} • {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={submission.fileUrl}
                        download={submission.fileName}
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Download"
                      >
                        <Download size={18} className="text-slate-500" />
                      </a>
                      <button
                        onClick={() => handleDelete(submission.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
          <FileUp size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold">No submissions yet</p>
          <p className="text-sm text-slate-400 mt-1">Upload your first submission to get started</p>
        </div>
      )}
    </motion.div>
  );
};

export default SubmissionTab;
