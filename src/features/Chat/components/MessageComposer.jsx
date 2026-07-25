import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Smile, Sparkles, X, FileText, 
  CornerDownRight, Code, Command, Zap, CheckSquare, 
  Bell, Calendar, HelpCircle, Terminal, Bot
} from 'lucide-react';
import toast from 'react-hot-toast';

const COMMAND_ITEMS = [
  {
    cmd: '/task',
    label: '/task [title]',
    desc: 'Create a new study task',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10'
  },
  {
    cmd: '/note',
    label: '/note [title]',
    desc: 'Save text as a study note',
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    cmd: '/summary',
    label: '/summary',
    desc: 'Generate Orion AI summary of room',
    icon: Sparkles,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10'
  },
  {
    cmd: '/code',
    label: '/code [snippet]',
    desc: 'Format code block with syntax theme',
    icon: Code,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
  {
    cmd: '/poll',
    label: '/poll [question]',
    desc: 'Create a quick group poll',
    icon: CheckSquare,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  {
    cmd: '/remind',
    label: '/remind [time]',
    desc: 'Schedule a study reminder',
    icon: Bell,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10'
  }
];

export const MessageComposer = ({
  messageDraft,
  setMessageDraft,
  handleSendMessage,
  sending,
  replyTarget,
  setReplyTarget,
  pendingAttachments = [],
  handleRemovePendingAttachment,
  handleAttachmentPick,
  attachmentUploading,
  attachmentInputRef,
  onOrionAiAssistant
}) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSlashCommand = (item) => {
    setShowSlashMenu(false);
    if (item.cmd === '/summary') {
      onOrionAiAssistant && onOrionAiAssistant('summary');
      setMessageDraft('');
    } else if (item.cmd === '/code') {
      setMessageDraft('```javascript\n// write your code here\n```');
    } else if (item.cmd === '/poll') {
      setMessageDraft('📊 Poll: ');
    } else {
      setMessageDraft(`${item.cmd} `);
    }
  };

  return (
    <div className="shrink-0 p-3 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md select-none relative">
      {/* Hidden File Input */}
      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAttachmentPick}
      />

      {/* Reply Banner */}
      <AnimatePresence>
        {replyTarget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 p-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-500/20 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300 min-w-0">
              <CornerDownRight size={14} className="shrink-0 text-primary-500" />
              <span className="font-bold shrink-0">Replying to {replyTarget.senderName || 'message'}:</span>
              <span className="truncate">{replyTarget.text}</span>
            </div>
            <button
              onClick={() => setReplyTarget(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Attachments List */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((att, i) => (
            <div 
              key={i} 
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2"
            >
              <FileText size={14} className="text-primary-500" />
              <span className="truncate max-w-[120px] font-bold text-slate-700 dark:text-slate-300">{att.name}</span>
              <button
                onClick={() => handleRemovePendingAttachment(i)}
                className="text-slate-400 hover:text-rose-500"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sleek Dark Glassmorphism Command Popover */}
      <AnimatePresence>
        {showSlashMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 left-3 w-72 p-2 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-xl z-30 space-y-1"
          >
            <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Command size={12} className="text-primary-400" /> Slash Commands
              </span>
              <button 
                onClick={() => setShowSlashMenu(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
            </div>

            {COMMAND_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.cmd}
                  onClick={() => handleSlashCommand(item)}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/90 text-left flex items-center gap-2.5 transition-colors group"
                >
                  <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={14} className={item.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Pill Shortcuts (React Icons, No raw emojis) */}
      <div className="mb-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5 text-[11px]">
        <button
          type="button"
          onClick={() => onOrionAiAssistant && onOrionAiAssistant('summary')}
          className="px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 font-bold hover:bg-primary-500/20 transition-all flex items-center gap-1 shrink-0"
        >
          <Sparkles size={12} className="text-primary-400" /> AI Summarize
        </button>
        <button
          type="button"
          onClick={() => setMessageDraft('/task ')}
          className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold hover:bg-slate-700 transition-all flex items-center gap-1 shrink-0"
        >
          <Zap size={12} className="text-amber-400" /> /task
        </button>
        <button
          type="button"
          onClick={() => setMessageDraft('/note ')}
          className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold hover:bg-slate-700 transition-all flex items-center gap-1 shrink-0"
        >
          <FileText size={12} className="text-emerald-400" /> /note
        </button>
        <button
          type="button"
          onClick={() => setShowSlashMenu(!showSlashMenu)}
          className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold hover:bg-slate-700 hover:text-slate-200 transition-all flex items-center gap-1 shrink-0"
        >
          <Command size={12} className="text-primary-400" /> Commands
        </button>
      </div>

      {/* Text Area Form Container */}
      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-primary-500/40 transition-all">
          {/* Text Input */}
          <textarea
            value={messageDraft}
            onChange={(e) => {
              const val = e.target.value;
              setMessageDraft(val);
              if (val.startsWith('/')) {
                setShowSlashMenu(true);
              } else if (!val) {
                setShowSlashMenu(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message your team... (Use / for commands or Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[32px] py-1.5 px-2 font-medium"
          />

          {/* Buttons Toolbar */}
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              disabled={attachmentUploading}
              title="Attach files or media"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <Paperclip size={16} />
            </button>

            {/* Orion AI Companion Button */}
            {onOrionAiAssistant && (
              <button
                type="button"
                onClick={() => onOrionAiAssistant('prompt')}
                title="Ask Orion AI Companion"
                className="p-1.5 rounded-xl text-primary-500 hover:bg-primary-500/10 transition-colors"
              >
                <Sparkles size={16} />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || attachmentUploading || (!messageDraft.trim() && pendingAttachments.length === 0)}
              className="p-2 rounded-xl bg-primary-500 text-white shadow-md hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageComposer;
