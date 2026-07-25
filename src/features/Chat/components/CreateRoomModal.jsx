import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Users, FolderKanban, BookOpen, Layers } from 'lucide-react';
import Select from '../../../components/ui/Select';

export const CreateRoomModal = ({
  isOpen,
  onClose,
  roomType,
  setRoomType,
  roomTitle,
  setRoomTitle,
  memberEmails,
  setMemberEmails,
  contextType,
  setContextType,
  contextId,
  setContextId,
  contextOptions = [],
  handleCreateRoom,
  creating,
  canCreateRoom,
  directInviteError,
  groupInviteError
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold">
                <MessageSquare size={16} />
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {roomType === 'direct' ? 'Start Direct Message' : 'Create Study Room'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateRoom} className="p-5 space-y-4">
            {/* Room Type Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setRoomType('group')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  roomType === 'group'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users size={14} /> Study Room
              </button>
              <button
                type="button"
                onClick={() => setRoomType('direct')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  roomType === 'direct'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare size={14} /> Direct Message
              </button>
            </div>

            {/* Group Title (Group only) */}
            {roomType === 'group' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="e.g. CS101 Study Group, Final Project..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
              </div>
            )}

            {/* Member Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {roomType === 'direct' ? 'Recipient Email' : 'Member Emails (comma separated)'}
              </label>
              <input
                type="text"
                required
                value={memberEmails}
                onChange={(e) => setMemberEmails(e.target.value)}
                placeholder={roomType === 'direct' ? 'partner@email.com' : 'user1@email.com, user2@email.com'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
              {roomType === 'direct' && directInviteError && (
                <p className="text-[11px] text-rose-500 mt-1">{directInviteError}</p>
              )}
              {roomType === 'group' && groupInviteError && (
                <p className="text-[11px] text-rose-500 mt-1">{groupInviteError}</p>
              )}
            </div>

            {/* Context Linkage (Group only) */}
            {roomType === 'group' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Link Context
                  </label>
                  <select
                    value={contextType}
                    onChange={(e) => {
                      setContextType(e.target.value);
                      setContextId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                  >
                    <option value="general">General</option>
                    <option value="project">Project</option>
                    <option value="assignment">Assignment</option>
                    <option value="note">Note</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>

                {contextType !== 'general' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Item
                    </label>
                    <select
                      value={contextId}
                      onChange={(e) => setContextId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none truncate"
                    >
                      <option value="">Select item...</option>
                      {contextOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !canCreateRoom}
                className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-lg shadow-primary-500/20 hover:opacity-95 disabled:opacity-40"
              >
                {creating ? 'Creating...' : roomType === 'direct' ? 'Start DM' : 'Create Room'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateRoomModal;
