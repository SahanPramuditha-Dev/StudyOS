import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const AssignmentForm = ({ formData, setFormData, onSubmit, onClose, isEditing, courses = [] }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            {isEditing ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {/* Title and Status Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter assignment title"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
                <option value="Late">Late</option>
              </select>
            </div>
          </div>

          {/* Course Selection */}
          {courses.length > 0 && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Course (Optional)
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject and Lecturer Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science 101"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Lecturer
              </label>
              <input
                type="text"
                name="lecturer"
                value={formData.lecturer}
                onChange={handleInputChange}
                placeholder="e.g., Dr. John Smith"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Deadline and Marks Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Deadline
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Marks/Grade
              </label>
              <input
                type="text"
                name="marks"
                value={formData.marks}
                onChange={handleInputChange}
                placeholder="e.g., 100 marks"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the assignment..."
              rows="4"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all resize-none"
            />
          </div>

          {/* Brief/Instructions */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Brief / Instructions
            </label>
            <textarea
              name="brief"
              value={formData.brief}
              onChange={handleInputChange}
              placeholder="Detailed assignment brief and instructions..."
              rows="5"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-white transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              {isEditing ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AssignmentForm;
