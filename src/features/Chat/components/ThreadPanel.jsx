import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, CornerDownRight, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const getInitials = (value = '') => {
  const parts = String(value)
    .replace(/[@._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getAvatarColor = (value = '') => {
  const palette = [
    ['#0f766e', '#ccfbf1'],
    ['#2563eb', '#dbeafe'],
    ['#7c3aed', '#ede9fe'],
    ['#ea580c', '#ffedd5'],
    ['#db2777', '#fce7f3'],
    ['#0891b2', '#cffafe']
  ];
  const key = String(value || '').toLowerCase();
  const hash = [...key].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export const ThreadPanel = ({
  threadMessage,
  onCloseThread,
  onSendThreadReply,
  currentEmail
}) => {
  const [threadDraft, setThreadDraft] = useState('');

  if (!threadMessage) return null;

  const [avatarBg, avatarText] = getAvatarColor(threadMessage.senderEmail || threadMessage.senderName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!threadDraft.trim()) return;
    if (onSendThreadReply) {
      onSendThreadReply(threadMessage, threadDraft.trim());
      setThreadDraft('');
      toast.success('Thread reply sent');
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="w-80 lg:w-96 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-20"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary-500" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Thread Reply
          </h3>
        </div>
        <button
          onClick={onCloseThread}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={16} />
        </button>
      </div>

      {/* Parent Message Card */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
            style={{ backgroundColor: avatarBg, color: avatarText }}
          >
            {getInitials(threadMessage.senderName || threadMessage.senderEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {threadMessage.senderName || threadMessage.senderEmail}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {threadMessage.text}
            </p>
          </div>
        </div>
      </div>

      {/* Thread Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-center">
          Replies
        </p>
        <p className="text-xs text-slate-400 italic text-center py-4">
          Start typing below to reply directly in this thread.
        </p>
      </div>

      {/* Thread Reply Composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={threadDraft}
          onChange={(e) => setThreadDraft(e.target.value)}
          placeholder="Reply in thread..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!threadDraft.trim()}
          className="p-2 rounded-xl bg-primary-500 text-white disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </form>
    </motion.div>
  );
};

export default ThreadPanel;
