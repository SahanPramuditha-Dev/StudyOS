import React, { useState } from 'react';
import { FileText, Edit2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const OverviewTab = ({ assignment, onUpdate }) => {
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [briefText, setBriefText] = useState(assignment.brief || '');

  const handleSaveBrief = () => {
    onUpdate({
      ...assignment,
      brief: briefText
    });
    setIsEditingBrief(false);
  };

  return (
    <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Brief Section */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <FileText size={28} className="text-blue-500" />
              Assignment Brief
            </h2>
            <button
              onClick={() => setIsEditingBrief(!isEditingBrief)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit brief"
            >
              <Edit2 size={20} className="text-slate-500" />
            </button>
          </div>

          {isEditingBrief ? (
            <div className="space-y-4">
              <textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                placeholder="Enter assignment brief and instructions..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsEditingBrief(false);
                    setBriefText(assignment.brief || '');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveBrief}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all flex items-center gap-2"
                >
                  <Check size={16} />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {briefText ? (
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                  {briefText}
                </div>
              ) : (
                <p className="text-slate-400 italic py-12 text-center">
                  No brief added yet. Click edit to add assignment details.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Assignment Info */}
      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Status</p>
          <div className={`inline-block px-4 py-2 rounded-lg font-black uppercase tracking-widest text-xs ${
            assignment.status === 'Submitted' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' :
            assignment.status === 'In Progress' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
            assignment.status === 'Late' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            {assignment.status}
          </div>
        </div>

        {/* Deadline Card */}
        {assignment.deadline && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Deadline</p>
            <p className="font-black text-slate-800 dark:text-white text-lg">
              {new Date(assignment.deadline).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {new Date(assignment.deadline).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {/* Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
          {assignment.subject && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Subject</p>
              <p className="font-bold text-slate-800 dark:text-white">{assignment.subject}</p>
            </div>
          )}
          {assignment.lecturer && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Lecturer</p>
              <p className="font-bold text-slate-800 dark:text-white">{assignment.lecturer}</p>
            </div>
          )}
          {assignment.marks && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Marks</p>
              <p className="font-bold text-slate-800 dark:text-white text-lg">{assignment.marks}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2">Submissions</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-300">
              {assignment.submissions?.length || 0}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 border border-purple-100 dark:border-purple-500/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 mb-2">Tasks</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-300">
              {assignment.tasks?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OverviewTab;
