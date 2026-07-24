import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Flag, CalendarDays, ListTodo } from 'lucide-react';
import Select from '../../../components/ui/Select';
import { nanoid } from 'nanoid';

const TaskForm = ({
  isOpen,
  onClose,
  onSave,
  task = null,
  availableSubjects = []
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('notes');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [marks, setMarks] = useState('');
  const [submissionMethod, setSubmissionMethod] = useState('Online');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setSubject(task.subject || '');
      setType(task.type || 'notes');
      setPriority(task.priority || 'Medium');
      setDeadline(task.deadline || '');
      setDescription(task.description || '');
      setSubtasks(task.subtasks || []);
      setEstimatedHours(task.estimatedHours || '');
      setMarks(task.marks || '');
      setSubmissionMethod(task.submissionMethod || 'Online');
    } else {
      setTitle('');
      setSubject('');
      setType('notes');
      setPriority('Medium');
      setDeadline('');
      setDescription('');
      setSubtasks([]);
      setEstimatedHours('');
      setMarks('');
      setSubmissionMethod('Online');
    }
  }, [task, isOpen]);

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { id: nanoid(), title: '', completed: false }]);
  };

  const handleUpdateSubtask = (id, newTitle) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleDeleteSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    const payload = {
      title: title.trim(),
      subject: subject.trim(),
      type,
      priority,
      deadline,
      description: description.trim(),
      estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
      marks: marks ? Number(marks) : 0,
      submissionMethod,
      subtasks: subtasks.filter(s => s.title.trim() !== '')
    };

    onSave(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
              {task ? 'Edit Task' : 'New Task'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete math worksheet"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Subject / Module</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics, SE"
                    list="subjects-list"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
                  />
                  <datalist id="subjects-list">
                    {availableSubjects.map(subj => (
                      <option key={subj} value={subj} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Type</label>
                  <Select
                    value={type}
                    onChange={setType}
                    options={[
                      { label: 'Notes', value: 'notes' },
                      { label: 'Assignment', value: 'assignment' },
                      { label: 'Revision', value: 'revision' },
                      { label: 'Project', value: 'project' }
                    ]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Priority</label>
                  <Select
                    value={priority}
                    onChange={setPriority}
                    options={[
                      { label: 'Low', value: 'Low' },
                      { label: 'Medium', value: 'Medium' },
                      { label: 'High', value: 'High' },
                      { label: 'Critical', value: 'Critical' }
                    ]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Deadline Date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Marks Allocated</label>
                  <input
                    type="number"
                    min="0"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Submission Method</label>
                  <Select
                    value={submissionMethod}
                    onChange={setSubmissionMethod}
                    options={[
                      { label: 'Online Upload', value: 'Online' },
                      { label: 'In-Person Paper', value: 'In-Person' },
                      { label: 'Email Submission', value: 'Email' }
                    ]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task instructions, links, or helpful guidelines..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Subtasks (Checklist)</label>
                <div className="space-y-2 mb-3">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 group animate-in fade-in slide-in-from-left duration-250">
                      <div className="w-4 h-4 rounded text-primary-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600 flex items-center justify-center">
                        {st.completed && <Check size={12} className="text-primary-500" />}
                      </div>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => handleUpdateSubtask(st.id, e.target.value)}
                        placeholder="Checklist item title..."
                        className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none border-slate-200 dark:border-slate-700 focus:border-primary-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 w-full justify-center"
                >
                  <Plus size={16} /> Add Checklist Item
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <div className="flex-1"></div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 active:scale-95"
                >
                  Save Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskForm;
