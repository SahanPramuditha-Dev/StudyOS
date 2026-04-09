import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Zap, Tag, Bell, Repeat, Link as LinkIcon, FileText, AlertCircle, Volume2, Upload, BellOff, Music } from 'lucide-react';

const categoryOptions = ['Study', 'Assignment', 'Exam', 'Project', 'Personal'];
const reminderOptions = [5, 15, 60, 120];
const recurringOptions = ['None', 'Daily', 'Weekly', 'Monthly', 'Custom'];

// Attractive field label component
const FieldLabel = ({ icon: Icon, label, description }) => (
  <div className="flex items-center gap-2">
    {Icon && <Icon size={14} className="text-primary-500" />}
    <div>
      <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{label}</p>
      {description && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{description}</p>}
    </div>
  </div>
);

const EventModal = ({
  formData,
  setFormData,
  onSubmit,
  onClose,
  onDelete,
  isEditing,
  courses,
  projects,
  assignments,
  videos,
  onSoundUpload,
  soundUploadState
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {isEditing ? 'Edit Event' : 'Create Event'}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              Calendar based reminder and planning
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Event title"
              className="md:col-span-2 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none"
            />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
              rows={3}
              className="md:col-span-2 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none resize-none"
            />
            <div className="space-y-2">
              <FieldLabel icon={Calendar} label="Date" description="When is this event?" />
              <input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                title="Select the event date"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Clock} label="Time" description="What time?" />
              <input
                type="time"
                value={formData.time}
                disabled={formData.allDay}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                title="Select the event time"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none disabled:opacity-50 transition"
              />
            </div>
            <label className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-100 dark:border-primary-900/30 cursor-pointer hover:border-primary-300 transition" title="Mark this event as all-day">
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              />
              <span className="text-sm font-bold text-primary-700 dark:text-primary-300">All-day event</span>
            </label>
            <div className="space-y-2">
              <FieldLabel icon={Zap} label="Duration" description="How long?" />
              <input
                type="number"
                min="15"
                step="15"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) || 60 })}
                title="Set event duration in minutes"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition"
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Tag} label="Category" description="Event type" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                title="Choose a category for this event"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={AlertCircle} label="Priority" description="How urgent?" />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                title="Set the priority for this event"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
              >
                {['Low', 'Medium', 'High'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Bell} label="Reminder" description="Notify before" />
              <select
                value={formData.reminderOffsetMinutes}
                onChange={(e) => setFormData({ ...formData, reminderOffsetMinutes: Number(e.target.value) })}
                title="Choose how long before the event you want a reminder"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
              >
                {reminderOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>{minutes} min before</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Repeat} label="Recurrence" description="Repeat pattern" />
              <select
                value={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.value })}
                title="Choose a recurrence schedule for this event"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
              >
                {recurringOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {formData.recurring === 'Custom' && (
              <div className="space-y-2">
                <FieldLabel label="Repeat every X days" description="Custom interval" />
                <input
                  type="number"
                  min="1"
                  value={formData.recurringIntervalDays}
                  onChange={(e) => setFormData({ ...formData, recurringIntervalDays: Number(e.target.value) || 1 })}
                  title="Number of days between recurring events"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition"
                  placeholder="7"
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Related to</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FieldLabel icon={LinkIcon} label="Course" description="Link a course" />
                <select
                  value={formData.relatedCourseId}
                  onChange={(e) => setFormData({ ...formData, relatedCourseId: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
                >
                  <option value="">No course linked</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel icon={LinkIcon} label="Assignment" description="Link an assignment" />
                <select
                  value={formData.relatedAssignmentId}
                  onChange={(e) => setFormData({ ...formData, relatedAssignmentId: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
                >
                  <option value="">No assignment linked</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel icon={LinkIcon} label="Video" description="Link a video" />
                <select
                  value={formData.relatedVideoId}
                  onChange={(e) => setFormData({ ...formData, relatedVideoId: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
                >
                  <option value="">No video linked</option>
                  {videos.map((video) => (
                    <option key={video.id} value={video.id}>{video.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel icon={LinkIcon} label="Project" description="Link a project" />
                <select
                  value={formData.relatedProjectId}
                  onChange={(e) => setFormData({ ...formData, relatedProjectId: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none transition cursor-pointer"
                >
                  <option value="">No project linked</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
              <input
                type="checkbox"
                checked={formData.snoozeEnabled}
                onChange={(e) => setFormData({ ...formData, snoozeEnabled: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Snooze</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
              <input
                type="checkbox"
                checked={formData.sendEmail}
                onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Email alert</span>
            </label>
          </div>

          <div className="space-y-4 p-5 rounded-[2rem] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Alarm Sound Override</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Choose a custom sound, mute this reminder, or inherit the global alarm sound.</p>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Music size={14} />
                Per reminder
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'inherit', label: 'Inherit' },
                { key: 'custom', label: 'Custom' },
                { key: 'mute', label: 'Mute' }
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, soundMode: option.key })}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                    formData.soundMode === option.key
                      ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'bg-white dark:bg-slate-900 border-transparent text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {formData.soundMode === 'custom' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-300 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                      <Upload size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {formData.soundName || 'Upload MP3, WAV, or OGG'}
                      </p>
                      <p className="text-[10px] text-slate-400">Stored securely in Firebase Storage</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                    className="hidden"
                    onChange={(e) => onSoundUpload?.(e.target.files?.[0])}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 whitespace-nowrap">
                    Upload
                  </span>
                </label>

                {soundUploadState?.uploading && (
                  <p className="text-[10px] font-bold text-primary-500">Uploading sound...</p>
                )}
                {soundUploadState?.error && (
                  <p className="text-[10px] font-bold text-red-500">{soundUploadState.error}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Volume2 size={14} /> Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={Number(formData.soundVolume ?? 0.8)}
                  onChange={(e) => setFormData({ ...formData, soundVolume: Number(e.target.value) })}
                  className="w-full"
                  title="Set the alarm volume"
                />
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Quiet</span>
                  <span>{Math.round(Number(formData.soundVolume ?? 0.8) * 100)}%</span>
                  <span>Loud</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Bell size={14} /> Repeat
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setFormData({ ...formData, soundRepeatCount: count })}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        Number(formData.soundRepeatCount || 1) === count
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                          : 'bg-white dark:bg-slate-900 border-transparent text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {count}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={onDelete}
                className="py-3.5 px-5 rounded-2xl border-2 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-black hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-500 font-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black shadow-xl shadow-primary-500/20"
            >
              {isEditing ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EventModal;
