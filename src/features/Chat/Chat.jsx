import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Send, MessageSquare, Users, Link as LinkIcon, Hash, NotebookText, Paperclip, Reply, Smile, X, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { FirestoreService } from '../../services/firestore';
import { getChatAttachmentLimitBytes, uploadChatAttachment, isValidChatAttachmentFile } from '../../services/chatMedia';

const CONTEXT_TYPES = [
  { key: 'general', label: 'General' },
  { key: 'project', label: 'Project' },
  { key: 'assignment', label: 'Assignment' },
  { key: 'note', label: 'Note' },
  { key: 'resource', label: 'Resource' }
];

const ROOM_TYPES = [
  { key: 'group', label: 'Group chat' },
  { key: 'direct', label: 'Direct message' }
];

const REACTIONS = [
  { key: 'thumbsUp', emoji: '👍', label: 'Like' },
  { key: 'heart', emoji: '❤️', label: 'Heart' },
  { key: 'laugh', emoji: '😂', label: 'Laugh' }
];

const getItemTitle = (item) => item?.title || item?.name || item?.message || item?.subject || 'Untitled';
const getItemSubtitle = (item) => item?.description || item?.category || item?.type || item?.status || '';
const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const Chat = () => {
  const { user, profile } = useAuth();
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [contextType, setContextType] = useState('general');
  const [contextId, setContextId] = useState('');
  const [roomType, setRoomType] = useState('group');
  const [replyTarget, setReplyTarget] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const messageEndRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const currentEmail = FirestoreService.normalizeChatEmail(user?.email);
  const currentEmailKey = FirestoreService.chatEmailKey(user?.email);
  const attachmentLimitBytes = getChatAttachmentLimitBytes(profile?.plan, profile?.role);

  const contextItems = useMemo(() => ({
    project: projects || [],
    assignment: assignments || [],
    note: notes || [],
    resource: resources || []
  }), [projects, assignments, notes, resources]);

  const contextOptions = useMemo(() => {
    return (contextItems[contextType] || []).map((item) => ({
      value: item.id || item._id || item.key || getItemTitle(item),
      label: getItemTitle(item),
      subtitle: getItemSubtitle(item)
    }));
  }, [contextItems, contextType]);

  const selectedContextMeta = useMemo(() => {
    if (contextType === 'general' || !contextId) return null;
    const items = contextItems[contextType] || [];
    return items.find((item) => String(item.id || item._id || item.key || '') === String(contextId)) || null;
  }, [contextItems, contextType, contextId]);

  const messageById = useMemo(() => {
    const map = new Map();
    messages.forEach((message) => map.set(message.id, message));
    return map;
  }, [messages]);

  const filteredRooms = useMemo(() => {
    const term = roomSearch.trim().toLowerCase();
    if (!term) return rooms;
    return rooms.filter((room) => {
      const haystack = [
        room.title,
        room.contextLabel,
        room.lastMessage,
        ...(room.memberEmails || [])
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [rooms, roomSearch]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  useEffect(() => {
    if (!currentEmail) return undefined;
    const unsubscribe = FirestoreService.subscribeToMyChatRooms(currentEmail, setRooms);
    return () => unsubscribe?.();
  }, [currentEmail]);

  useEffect(() => {
    if (rooms.length === 0) {
      setActiveRoomId('');
      setMessages([]);
      return;
    }

    if (!activeRoomId || !rooms.some((room) => room.id === activeRoomId)) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return undefined;
    }

    setLoadingMessages(true);
    const unsubscribe = FirestoreService.subscribeToChatMessages(activeRoomId, (nextMessages) => {
      setMessages(nextMessages);
      setLoadingMessages(false);
    });

    FirestoreService.markChatRoomRead(activeRoomId, currentEmail).catch((error) => {
      console.warn('[Chat] Failed to mark room as read:', error);
    });

    return () => {
      setLoadingMessages(false);
      unsubscribe?.();
    };
  }, [activeRoomId, currentEmail]);

  useEffect(() => {
    setReplyTarget(null);
    setPendingAttachments([]);
    setMessageDraft('');
  }, [activeRoomId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  const isRoomUnread = (room) => {
    if (!room || !currentEmailKey) return false;
    const lastRead = room.lastReadAtByEmail?.[currentEmailKey];
    const lastMessageAt = room.lastMessageAt;
    if (!lastMessageAt) return false;
    if (!lastRead) return true;
    return new Date(lastMessageAt).getTime() > new Date(lastRead).getTime();
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to create a chat room');
      return;
    }

    const invitedEmails = memberEmails
      .split(/[,\n]/g)
      .map((email) => FirestoreService.normalizeChatEmail(email))
      .filter(Boolean);

    const members = [...new Set([currentEmail, ...invitedEmails])];
    if (roomType === 'direct' && members.length !== 2) {
      toast.error('Direct messages need exactly one other person');
      return;
    }
    if (roomType === 'group' && members.length < 2) {
      toast.error('Add at least one other member email');
      return;
    }

    let contextLabel = roomType === 'direct' ? 'Direct message' : 'General';
    if (roomType !== 'direct' && contextType !== 'general' && selectedContextMeta) {
      contextLabel = getItemTitle(selectedContextMeta);
    }

    try {
      setCreating(true);
      const room = await FirestoreService.createChatRoom({
        title: roomTitle || (roomType === 'direct' ? 'Direct message' : contextLabel) || 'Study Group',
        memberEmails: members,
        createdByUid: user.id,
        createdByEmail: user.email,
        roomType,
        contextType,
        contextId,
        contextLabel
      });

      setIsCreateOpen(false);
      setRoomTitle('');
      setMemberEmails('');
      setRoomType('group');
      setContextType('general');
      setContextId('');
      setActiveRoomId(room.id);
      toast.success('Chat room created');
    } catch (error) {
      console.error('[Chat] Failed to create room:', error);
      toast.error(error?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!activeRoomId || !messageDraft.trim()) return;
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to send messages');
      return;
    }

    try {
      setSending(true);
      await FirestoreService.sendChatMessage(activeRoomId, {
        text: messageDraft.trim(),
        senderUid: user.id,
        senderEmail: user.email,
        senderName: user.name || profile?.name || user.email,
        senderAvatar: user.avatar || profile?.avatar || '',
        attachments: pendingAttachments,
        replyToMessageId: replyTarget?.id || '',
        replyToText: replyTarget?.text || '',
        replyToSenderName: replyTarget?.senderName || '',
        replyToSenderEmail: replyTarget?.senderEmail || ''
      });
      setMessageDraft('');
      setPendingAttachments([]);
      setReplyTarget(null);
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      toast.error(error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyTarget(message);
    toast.success(`Replying to ${message.senderName || message.senderEmail || 'message'}`);
  };

  const handleToggleReaction = async (messageId, reactionKey) => {
    if (!activeRoomId) return;
    try {
      await FirestoreService.toggleChatReaction(activeRoomId, messageId, reactionKey, user?.email);
    } catch (error) {
      console.error('[Chat] Failed to toggle reaction:', error);
      toast.error(error?.message || 'Failed to update reaction');
    }
  };

  const handleAttachmentPick = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !activeRoomId) return;
    if (!user?.id) {
      toast.error('Please sign in to upload attachments');
      return;
    }

    const usableFiles = files.filter((file) => {
      if (!isValidChatAttachmentFile(file)) {
        toast.error(`${file.name} is not supported`);
        return false;
      }
      if (file.size > attachmentLimitBytes) {
        toast.error(`${file.name} is too large for your plan`);
        return false;
      }
      return true;
    });

    if (!usableFiles.length) return;

    try {
      setAttachmentUploading(true);
      const uploaded = [];
      for (const file of usableFiles) {
        const result = await uploadChatAttachment({ file, userId: user.id, roomId: activeRoomId });
        uploaded.push({
          name: result.fileName,
          url: result.downloadURL,
          storagePath: result.storagePath,
          mimeType: result.mimeType,
          size: result.size
        });
      }
      setPendingAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} attachment${uploaded.length > 1 ? 's' : ''} added`);
    } catch (error) {
      console.error('[Chat] Attachment upload failed:', error);
      toast.error(error?.message || 'Attachment upload failed');
    } finally {
      setAttachmentUploading(false);
      event.target.value = '';
    }
  };

  const handleRemovePendingAttachment = (index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const previewIconForMime = (mimeType = '') => {
    if (String(mimeType).startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const currentRoomMessages = messages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-[10px] font-black uppercase tracking-[0.3em]">
            <MessageSquare size={12} />
            Collaborative Chat
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
            Study rooms, group discussion, and project talk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Create invite-only rooms for notes, resources, projects, or assignments and keep the conversation tied to the work.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:opacity-95"
        >
          <Plus size={16} />
          New Room
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <aside className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms..."
                className="w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {rooms.length} room{rooms.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="max-h-[72vh] overflow-y-auto custom-scrollbar">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No rooms yet</p>
                  <p className="text-xs text-slate-400 mt-1">Create your first study room and invite people by email.</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredRooms.map((room) => {
                  const unread = isRoomUnread(room);
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        room.id === activeRoomId
                          ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-900/50'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 dark:text-slate-100 truncate">{room.title || 'Study Room'}</p>
                            {unread && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 truncate">
                            {(room.roomType === 'direct' ? 'Direct message' : room.contextLabel) || 'General room'}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
                          <Users size={14} />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                        <span className="truncate">
                          {room.lastMessage || 'No messages yet'}
                        </span>
                        <span className="whitespace-nowrap">
                          {room.lastMessageAt ? formatTime(room.lastMessageAt) : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[70vh]">
          {!activeRoom ? (
            <div className="flex-1 flex items-center justify-center p-10 text-center">
              <div className="max-w-md space-y-4">
                <div className="mx-auto w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <Hash size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Pick a room or create a new one</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Group chats work best when you link them to a project, assignment, note, or resource.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <LinkIcon size={12} />
                      {activeRoom.roomType === 'direct' ? 'direct message' : (activeRoom.contextType || 'general')}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                      {activeRoom.title || 'Study Room'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(activeRoom.roomType === 'direct' ? 'Direct message' : activeRoom.contextLabel) || 'General conversation'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(activeRoom.memberEmails || []).map((email) => (
                      <span
                        key={email}
                        className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-300"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/20">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    Loading messages...
                  </div>
                ) : currentRoomMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="max-w-sm space-y-3">
                      <div className="mx-auto w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <NotebookText size={24} />
                      </div>
                      <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">No messages yet</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Start the discussion and keep your study conversation in one place.
                      </p>
                    </div>
                  </div>
                ) : (
                  currentRoomMessages.map((message) => {
                    const mine = FirestoreService.normalizeChatEmail(message.senderEmail) === currentEmail;
                    const replySource = message.replyToMessageId ? messageById.get(message.replyToMessageId) : null;
                    const fileAttachments = Array.isArray(message.attachments) ? message.attachments : [];
                    const reactionCounts = message.reactions || {};
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-[1.75rem] px-4 py-3 shadow-sm border ${mine ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800'}`}>
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-75">
                              {mine ? 'You' : (message.senderName || message.senderEmail || 'Member')}
                            </span>
                            <span className="text-[10px] font-semibold opacity-60 whitespace-nowrap">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          {replySource && (
                            <div className={`mb-3 p-3 rounded-2xl text-xs border ${mine ? 'bg-white/10 border-white/10 text-white/80' : 'bg-slate-50 dark:bg-slate-800/70 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300'}`}>
                              <p className="font-black uppercase tracking-widest text-[9px] mb-1 opacity-70">
                                Replying to {replySource.senderName || replySource.senderEmail || 'message'}
                              </p>
                              <p className="line-clamp-2 whitespace-pre-wrap break-words">{replySource.text}</p>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                          {fileAttachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {fileAttachments.map((attachment) => {
                                const AttachmentIcon = previewIconForMime(attachment.mimeType);
                                return (
                                  <a
                                    key={attachment.storagePath || attachment.url || attachment.name}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-3 p-3 rounded-2xl border ${mine ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-50 dark:bg-slate-800/70 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                                  >
                                    <AttachmentIcon size={16} />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate">{attachment.name}</p>
                                      <p className="text-[10px] opacity-70">
                                        {attachment.size ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB` : 'Attachment'}
                                      </p>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReplyToMessage(message)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${mine ? 'bg-white/10 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}
                            >
                              <Reply size={12} />
                              Reply
                            </button>
                            {REACTIONS.map((reaction) => {
                              const reactionUsers = Array.isArray(reactionCounts[reaction.key]) ? reactionCounts[reaction.key] : [];
                              const reacted = reactionUsers.includes(currentEmail);
                              return (
                                <button
                                  key={reaction.key}
                                  type="button"
                                  onClick={() => handleToggleReaction(message.id, reaction.key)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${mine ? 'border-white/10 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300'} ${reacted ? (mine ? 'bg-white/20' : 'bg-primary-50 dark:bg-primary-500/10') : (mine ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800')}`}
                                >
                                  <Smile size={12} />
                                  <span>{reaction.emoji}</span>
                                  <span>{reactionUsers.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                {replyTarget && (
                  <div className="mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Replying to</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {replyTarget.senderName || replyTarget.senderEmail || 'message'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {replyTarget.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {pendingAttachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment, index) => {
                      const Icon = previewIconForMime(attachment.mimeType);
                      return (
                        <div key={`${attachment.storagePath}-${index}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <Icon size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{attachment.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingAttachment(index)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
                    title="Attach files"
                    disabled={attachmentUploading}
                  >
                    {attachmentUploading ? <Upload size={18} className="animate-pulse" /> : <Paperclip size={18} />}
                  </button>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    onChange={handleAttachmentPick}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <textarea
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      placeholder="Write a message..."
                      rows={2}
                      className="w-full resize-none rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !messageDraft.trim()}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary-500 text-white font-bold disabled:opacity-50"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  Attachments up to {(attachmentLimitBytes / (1024 * 1024)).toFixed(0)} MB for your plan.
                </p>
              </form>
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4"
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Create chat room</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Invite people by email and optionally link the room to one of your study items.
                </p>
              </div>

              <form onSubmit={handleCreateRoom} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Room type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Room title</label>
                  <input
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder={roomType === 'direct' ? 'Optional direct message title' : 'Project Phoenix, Calculus Group, etc.'}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Invite emails</label>
                  <textarea
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    placeholder={roomType === 'direct' ? 'friend@example.com' : 'friend@example.com, teammate@example.com'}
                    rows={4}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[11px] text-slate-400">
                    {roomType === 'direct'
                      ? 'Direct messages need exactly one other email. You will always be included.'
                      : 'Separate emails with commas or new lines. You will always be included.'}
                  </p>
                </div>

                {roomType !== 'direct' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Context type</label>
                      <select
                        value={contextType}
                        onChange={(e) => {
                          setContextType(e.target.value);
                          setContextId('');
                        }}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                      >
                        {CONTEXT_TYPES.map((type) => (
                          <option key={type.key} value={type.key}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Linked item</label>
                      <select
                        value={contextId}
                        onChange={(e) => setContextId(e.target.value)}
                        disabled={contextType === 'general'}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100 disabled:opacity-50"
                      >
                        <option value="">No linked item</option>
                        {contextOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedContextMeta && (
                  <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-900/40">
                    <p className="text-xs font-black uppercase tracking-widest text-primary-500">Linked preview</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{getItemTitle(selectedContextMeta)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getItemSubtitle(selectedContextMeta)}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-3 rounded-2xl bg-primary-500 text-white font-bold disabled:opacity-50"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
