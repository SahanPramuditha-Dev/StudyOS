import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  BarChart3,
  Clock,
  Layers,
  Tag as TagIcon,
  Link as LinkIcon,
  Calendar,
  Flag,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Select from '../../../components/ui/Select';
import { generateCourseSyllabus } from '../../../services/aiService';

const FieldLabel = ({ icon: Icon, text }) => (
  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1 flex items-center gap-1.5">
    {Icon ? <Icon size={12} className="text-primary-500" /> : null}
    {text}
  </label>
);

const CourseForm = ({ editingCourse, formData, setFormData, onSubmit, onClose }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateSyllabus = async () => {
    if (!formData.title) {
      toast.error('Please enter a Course Title first');
      return;
    }
    setIsGenerating(true);
    try {
      const syllabus = await generateCourseSyllabus(formData.title);
      setFormData({ ...formData, syllabus });
      toast.success('Syllabus generated successfully!');
    } catch (e) {
      toast.error('Failed to generate syllabus');
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary-500/10 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {editingCourse ? 'Update Course Hub' : 'Create Course Hub'}
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
              {editingCourse ? 'Keep your learning stream in sync' : 'Add structure to your learning path'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-95 shadow-sm">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FieldLabel text="Course Title" />
              <input
                required
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="e.g. Advanced System Architecture"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <FieldLabel text="Platform" />
              <input
                required
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="Coursera, Udemy, YouTube"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel text="Category" />
              <input
                required
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="Programming, Cloud, Math"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <FieldLabel text="Difficulty" />
              <Select
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-bold cursor-pointer shadow-inner dark:shadow-none"
                value={formData.difficulty}
                onChange={(val) => setFormData({ ...formData, difficulty: val })}
                options={[
                  { label: 'Beginner', value: 'Beginner' },
                  { label: 'Intermediate', value: 'Intermediate' },
                  { label: 'Advanced', value: 'Advanced' }
                ]}
              />
            </div>

            <div>
              <FieldLabel icon={Flag} text="Priority" />
              <Select
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-bold cursor-pointer shadow-inner dark:shadow-none"
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                options={[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                  { label: 'Critical', value: 'Critical' }
                ]}
              />
            </div>

            <div>
              <FieldLabel text="Status" />
              <Select
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-bold cursor-pointer shadow-inner dark:shadow-none"
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Paused', value: 'Paused' },
                  { label: 'Completed', value: 'Completed' }
                ]}
              />
            </div>

            <div>
              <FieldLabel icon={Clock} text="Course Hours" />
              <input
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="e.g. 45h, 2.5h"
                value={formData.courseHours || ''}
                onChange={(e) => setFormData({ ...formData, courseHours: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <FieldLabel icon={FileText} text="Course Syllabus / Outline" />
              <button
                type="button"
                onClick={handleGenerateSyllabus}
                disabled={isGenerating}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
              >
                {isGenerating ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Sparkles size={12} />}
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none min-h-[120px] custom-scrollbar"
              placeholder="Paste or generate a course syllabus outline here..."
              value={formData.syllabus || ''}
              onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={LinkIcon} text="Course URL" />
              <input
                type="url"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="https://..."
                value={formData.courseUrl}
                onChange={(e) => setFormData({ ...formData, courseUrl: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel icon={LinkIcon} text="Playlist URL" />
              <input
                type="url"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="https://..."
                value={formData.playlistUrl}
                onChange={(e) => setFormData({ ...formData, playlistUrl: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel icon={LinkIcon} text="Certificate URL" />
              <input
                type="url"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-inner dark:shadow-none"
                placeholder="https://..."
                value={formData.certificateUrl}
                onChange={(e) => setFormData({ ...formData, certificateUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div>
              <FieldLabel icon={Calendar} text="Start Date" />
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200 text-sm shadow-inner dark:shadow-none focus:border-primary-500"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel icon={Calendar} text="Target Date" />
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200 text-sm shadow-inner dark:shadow-none focus:border-primary-500"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel icon={Calendar} text="Exam Date" />
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200 text-sm shadow-inner dark:shadow-none focus:border-primary-500"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel icon={Calendar} text="Cert Deadline" />
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200 text-sm shadow-inner dark:shadow-none focus:border-primary-500"
                value={formData.certificateDeadline}
                onChange={(e) => setFormData({ ...formData, certificateDeadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <FieldLabel text="Tracking Method" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'percentage', label: 'Manual %', icon: BarChart3 },
                { id: 'time', label: 'Time Spent', icon: Clock },
                { id: 'modules', label: 'Modules', icon: Layers }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, trackingType: method.id })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    formData.trackingType === method.id
                      ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30 text-primary-500 shadow-inner'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <method.icon size={18} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.trackingType === 'time' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <FieldLabel text="Current Time" />
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-mono text-center"
                  placeholder="HH:MM:SS"
                  value={formData.timeTracking.current}
                  onChange={(e) => setFormData({
                    ...formData,
                    timeTracking: { ...formData.timeTracking, current: e.target.value }
                  })}
                />
              </div>
              <div>
                <FieldLabel text="Total Time" />
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-mono text-center"
                  placeholder="HH:MM:SS"
                  value={formData.timeTracking.total}
                  onChange={(e) => setFormData({
                    ...formData,
                    timeTracking: { ...formData.timeTracking, total: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {formData.trackingType === 'modules' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <FieldLabel text="Completed" />
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-black text-center"
                  value={formData.moduleTracking.completed}
                  onChange={(e) => setFormData({
                    ...formData,
                    moduleTracking: { ...formData.moduleTracking, completed: parseInt(e.target.value, 10) || 0 }
                  })}
                />
              </div>
              <div>
                <FieldLabel text="Total" />
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-black text-center"
                  value={formData.moduleTracking.total}
                  onChange={(e) => setFormData({
                    ...formData,
                    moduleTracking: { ...formData.moduleTracking, total: parseInt(e.target.value, 10) || 1 }
                  })}
                />
              </div>
            </div>
          )}

          {formData.trackingType === 'percentage' && (
            <div className="p-5 rounded-2xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-3">
                <FieldLabel text="Progress" />
                <span className="text-xl font-black text-primary-500">{formData.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-500 shadow-inner"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          )}

          <div>
            <FieldLabel icon={TagIcon} text="Tags (comma separated)" />
            <input
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium"
              placeholder="React, Docker, Algorithms"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/30 transition-all active:scale-95"
            >
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

export default CourseForm;
