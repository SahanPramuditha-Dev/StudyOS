import React from 'react';
import { 
  MessageSquare, Pin, CornerDownRight, FileText, 
  ExternalLink, Reply, Edit2, Trash2, CheckSquare, 
  Layers, Sparkles, ThumbsUp, Heart, Smile, Flame, Star
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

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

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'hh:mm a');
  } catch {
    return '';
  }
};

const REACTIONS = [
  { key: 'thumbsUp', icon: ThumbsUp, label: 'Thumbs Up', color: 'text-amber-400' },
  { key: 'heart', icon: Heart, label: 'Heart', color: 'text-rose-400' },
  { key: 'laugh', icon: Smile, label: 'Smile', color: 'text-amber-300' },
  { key: 'fire', icon: Flame, label: 'Fire', color: 'text-orange-400' },
  { key: 'star', icon: Star, label: 'Star', color: 'text-yellow-400' }
];

const RenderMessageText = ({ text = '' }) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'plaintext',
      content: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return (
    <>
      {parts.map((p, idx) => {
        if (p.type === 'code') {
          return (
            <div key={idx} className="my-2 rounded-xl bg-slate-950 border border-slate-800 text-xs overflow-hidden font-mono shadow-inner">
              <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                <span>{p.lang}</span>
                <span className="text-[9px] text-slate-500">Terminal Code</span>
              </div>
              <pre className="p-3 text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                <code>{p.content}</code>
              </pre>
            </div>
          );
        }
        return <span key={idx}>{p.content}</span>;
      })}
    </>
  );
};

export const MessageList = ({
  messages = [],
  currentEmail,
  loadingMessages,
  loadingOlder,
  hasMoreMessages,
  loadOlderMessages,
  onReply,
  onToggleReaction,
  onStartEdit,
  onDelete,
  onTogglePin,
  onOpenThread,
  onConvertToTask,
  onConvertToNote,
  onAskOrion,
  setLightboxMedia,
  editingMessageId,
  editingText,
  setEditingText,
  onSaveEdit,
  messageEndRef,
  messageContainerRef
}) => {
  return (
    <div 
      ref={messageContainerRef}
      className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-950/60"
    >
      {/* Load Older Messages Trigger */}
      {hasMoreMessages && (
        <div className="flex justify-center my-2">
          <button
            onClick={loadOlderMessages}
            disabled={loadingOlder}
            className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            {loadingOlder ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}

      {loadingMessages && messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading chat history...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-16 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
            <MessageSquare size={26} className="text-primary-400" />
          </div>
          <p className="text-sm font-bold text-slate-200">No messages here yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Start the conversation by typing a message below, uploading course files, or asking Orion AI.
          </p>
        </div>
      ) : (
        messages.map((entry) => {
          if (entry.type === 'separator') {
            return (
              <div key={entry.key} className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/70 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                  {entry.label}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            );
          }

          const message = entry.message;
          if (!message) return null;

          const isSelf = message.senderEmail === currentEmail;
          const isGrouped = entry.groupedWithPrev;
          const isEditing = editingMessageId === message.id;

          const [avatarBg, avatarText] = getAvatarColor(message.senderEmail || message.senderName);

          return (
            <div
              key={message.id}
              className={`group relative flex items-start gap-3 transition-colors ${
                isSelf ? 'flex-row-reverse' : 'flex-row'
              } ${isGrouped ? 'mt-1' : 'mt-4'} ${
                message.pinned ? 'bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30' : ''
              }`}
            >
              {/* Sender Avatar */}
              {!isGrouped ? (
                message.senderAvatar ? (
                  <img 
                    src={message.senderAvatar} 
                    alt={message.senderName} 
                    className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md mt-0.5 border border-slate-700/60" 
                  />
                ) : (
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md mt-0.5"
                    style={{ backgroundColor: avatarBg, color: avatarText }}
                  >
                    {getInitials(message.senderName || message.senderEmail)}
                  </div>
                )
              ) : (
                <div className="w-9 shrink-0 text-center text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTimeOnly(message.createdAt)}
                </div>
              )}

              {/* Content Area (Left vs Right Alignment) */}
              <div className={`flex flex-col min-w-0 flex-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                {/* Header (Sender & Time) */}
                {!isGrouped && (
                  <div className={`flex items-center gap-2 mb-1.5 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs font-black truncate ${isSelf ? 'text-primary-400' : 'text-slate-100'}`}>
                      {message.senderName || message.senderEmail}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatTimeOnly(message.createdAt)}
                    </span>
                    {message.edited && (
                      <span className="text-[9px] text-slate-500 italic">(edited)</span>
                    )}
                    {message.pinned && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-bold">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble Box (Right aligned for Self, Left for Others) */}
                <div className={`w-fit max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-md border transition-all ${
                  isSelf
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 border-primary-500/40 text-white rounded-tr-xs ml-auto'
                    : 'bg-slate-800/90 border-slate-700/70 text-slate-100 rounded-tl-xs mr-auto'
                }`}>
                  {/* Reply Quote Banner */}
                  {message.replyToText && (
                    <div className="mb-2 p-2 rounded-xl bg-slate-900/80 border-l-3 border-primary-500 text-[11px] text-slate-300 flex items-center gap-2">
                      <CornerDownRight size={12} className="text-primary-400 shrink-0" />
                      <span className="font-bold shrink-0">{message.replyToSenderName || 'Reply'}:</span>
                      <span className="truncate italic text-slate-400">{message.replyToText}</span>
                    </div>
                  )}

                  {/* Body Text or Edit Input */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-primary-500 text-xs text-white focus:outline-none"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onSaveEdit}
                          className="px-3 py-1 rounded-lg bg-primary-500 text-white text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => onStartEdit(null)}
                          className="px-3 py-1 rounded-lg bg-slate-700 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="break-words whitespace-pre-wrap font-medium">
                      <RenderMessageText text={message.text} />
                    </div>
                  )}

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {message.attachments.map((att, i) => {
                        const isImg = String(att.mimeType || '').startsWith('image/');
                        return (
                          <div 
                            key={i} 
                            onClick={() => isImg && setLightboxMedia && setLightboxMedia(att.url)}
                            className={`p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center gap-2 max-w-xs ${isImg ? 'cursor-pointer hover:opacity-90' : ''}`}
                          >
                            {isImg ? (
                              <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center shrink-0">
                                <FileText size={16} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-slate-200">{att.name}</p>
                              <a 
                                href={att.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] text-primary-400 hover:underline flex items-center gap-0.5 mt-0.5 font-bold"
                              >
                                Download <ExternalLink size={8} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* React Icon Reactions Pill Bar */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <div className={`mt-1.5 flex flex-wrap gap-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(message.reactions).map(([key, users]) => {
                      if (!Array.isArray(users) || users.length === 0) return null;
                      const reactObj = REACTIONS.find(r => r.key === key);
                      const IconComponent = reactObj?.icon || ThumbsUp;
                      const hasReacted = users.includes(currentEmail);

                      return (
                        <button
                          key={key}
                          onClick={() => onToggleReaction(message.id, key)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border transition-all ${
                            hasReacted
                              ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <IconComponent size={12} className={reactObj?.color || 'text-amber-400'} />
                          <span>{users.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sleek Floating Action Bar with React Icons */}
              <div className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-0.5 p-1 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md z-10 ${
                isSelf ? 'left-2' : 'right-2'
              }`}>
                {REACTIONS.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.key}
                      onClick={() => onToggleReaction(message.id, r.key)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title={r.label}
                    >
                      <Icon size={14} className={r.color} />
                    </button>
                  );
                })}

                <div className="w-px h-4 bg-slate-700 mx-0.5" />

                <button
                  onClick={() => onReply(message)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                  title="Reply"
                >
                  <Reply size={14} />
                </button>
                <button
                  onClick={() => onOpenThread(message)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                  title="Reply in thread"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  onClick={() => onConvertToTask(message)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 text-xs"
                  title="Convert to Task"
                >
                  <CheckSquare size={14} />
                </button>
                <button
                  onClick={() => onConvertToNote(message)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 text-xs"
                  title="Convert to Note"
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={() => onTogglePin(message.id, message.pinned)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 text-xs"
                  title={message.pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin size={14} />
                </button>
                {isSelf && (
                  <>
                    <button
                      onClick={() => onStartEdit(message)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-800 text-xs"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(message.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
