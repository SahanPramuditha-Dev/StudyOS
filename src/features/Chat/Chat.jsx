import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { useReminders } from '../../context/ReminderContext';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { FirestoreService } from '../../services/firestore';
import { getChatAttachmentLimitBytes, uploadChatAttachment, isValidChatAttachmentFile } from '../../services/chatMedia';
import { rtdb } from '../../services/firebase';
import { onValue, ref, remove, set } from 'firebase/database';
import { chatMessageNotification, chatMentionNotification, chatSharedContentNotification } from '../../utils/notificationBuilders';
import { useOrion } from '../../context/OrionContext';

import ConversationList from './components/ConversationList';
import RoomHeader from './components/RoomHeader';
import MessageList from './components/MessageList';
import MessageComposer from './components/MessageComposer';
import ThreadPanel from './components/ThreadPanel';
import RoomDetailsPanel from './components/RoomDetailsPanel';
import CreateRoomModal from './components/CreateRoomModal';

const PRESENCE_STALE_MS = 90 * 1000;

const getItemTitle = (item) => item?.title || item?.name || item?.message || item?.subject || 'Untitled';
const getItemSubtitle = (item) => item?.description || item?.category || item?.type || item?.status || '';

const getDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toDateString();
};

const formatDateSeparator = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfTarget) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric'
  });
};

const normalizeEmailList = (emails = []) => [...new Set((emails || [])
  .map((email) => FirestoreService.normalizeChatEmail(email))
  .filter(Boolean))];

const Chat = () => {
  const { user, profile } = useAuth();
  const { addNotification } = useReminders();
  const { sendMessage: sendOrionMessage, openPanel: openOrionPanel } = useOrion();

  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [notes, setNotes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [tasks, setTasks] = useStorage(STORAGE_KEYS.TASKS, []);

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [olderMessages, setOlderMessages] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
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
  const [roomMemberProfiles, setRoomMemberProfiles] = useState([]);
  const [presenceByUid, setPresenceByUid] = useState({});
  const [typingByUid, setTypingByUid] = useState({});
  const [roomDetailsOpen, setRoomDetailsOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1280 : false);
  const [groupMemberDraft, setGroupMemberDraft] = useState('');
  const [addingGroupMembers, setAddingGroupMembers] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('rooms');
  const [inviteLinkState, setInviteLinkState] = useState({ loading: false, value: '', copied: false });
  const [memberActionPending, setMemberActionPending] = useState('');
  const [joiningInviteLink, setJoiningInviteLink] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [threadMessage, setThreadMessage] = useState(null);

  const messageContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const profileCacheRef = useRef(new Map());
  const inviteJoinAttemptRef = useRef('');
  const roomNotificationHistoryRef = useRef(new Map());

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

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const invitedEmails = useMemo(
    () => normalizeEmailList(memberEmails.split(/[,\n]/g)),
    [memberEmails]
  );

  const groupMemberEmails = useMemo(
    () => normalizeEmailList([currentEmail, ...invitedEmails]),
    [currentEmail, invitedEmails]
  );

  const activeRoomMemberEmails = useMemo(
    () => normalizeEmailList(activeRoom?.memberEmails || []),
    [activeRoom?.memberEmails]
  );

  const activeRoomMemberProfiles = useMemo(() => {
    const memberEmailSet = new Set(activeRoomMemberEmails);
    return roomMemberProfiles.filter((member) => memberEmailSet.has(FirestoreService.normalizeChatEmail(member.email)));
  }, [roomMemberProfiles, activeRoomMemberEmails]);

  const isGroupRoom = useMemo(
    () => Boolean(activeRoom) && activeRoom.roomType !== 'direct',
    [activeRoom]
  );

  const activeRoomAdminEmails = useMemo(() => normalizeEmailList([
    ...(activeRoom?.roomAdminEmails || []),
    activeRoom?.createdByEmail
  ]), [activeRoom?.createdByEmail, activeRoom?.roomAdminEmails]);

  const activeRoomInviteCode = useMemo(
    () => (isGroupRoom ? String(activeRoom?.inviteCode || '').trim() : ''),
    [activeRoom?.inviteCode, isGroupRoom]
  );

  const activeRoomInviteLink = useMemo(() => {
    if (!activeRoom || !isGroupRoom) return '';
    if (inviteLinkState.value) return inviteLinkState.value;
    return activeRoomInviteCode ? FirestoreService.buildChatInviteLink(activeRoom.id, activeRoomInviteCode) : '';
  }, [activeRoom, activeRoomInviteCode, inviteLinkState.value, isGroupRoom]);

  const isActiveRoomAdmin = useMemo(() => {
    if (!activeRoom) return false;
    return activeRoomAdminEmails.includes(currentEmail) || activeRoom.createdByUid === user?.id;
  }, [activeRoom, activeRoomAdminEmails, currentEmail, user?.id]);

  const groupMemberDraftEmails = useMemo(
    () => normalizeEmailList(groupMemberDraft.split(/[,\n]/g)),
    [groupMemberDraft]
  );

  const getPresenceForMember = useCallback((member) => {
    const key = member?.id || member?.uid;
    if (key && presenceByUid?.[key]) {
      return presenceByUid[key];
    }
    const memberEmail = FirestoreService.normalizeChatEmail(member?.email);
    if (!memberEmail) return null;
    const profilePresence = member?.presence;
    const lastActiveAt = member?.lastActiveAt;
    if (profilePresence?.state === 'online') {
      return {
        state: 'online',
        email: memberEmail,
        lastChanged: new Date(profilePresence.updatedAt || lastActiveAt || Date.now()).getTime()
      };
    }
    return Object.values(presenceByUid || {}).find((entry) => {
      const entryEmail = FirestoreService.normalizeChatEmail(entry?.email);
      return entryEmail && entryEmail === memberEmail;
    }) || null;
  }, [presenceByUid]);

  const getPresenceTimestamp = useCallback((member) => {
    const presence = getPresenceForMember(member);
    const profilePresence = member?.presence;
    const lastActiveAt = member?.lastActiveAt;
    const candidate = presence?.lastChanged || new Date(profilePresence?.updatedAt || lastActiveAt || '').getTime();
    return Number.isFinite(candidate) ? candidate : 0;
  }, [getPresenceForMember]);

  const isMemberCurrentlyOnline = useCallback((member) => {
    const presence = getPresenceForMember(member);
    const timestamp = getPresenceTimestamp(member);
    if (!timestamp) return false;
    const hasFreshSignal = Date.now() - timestamp <= PRESENCE_STALE_MS;
    return hasFreshSignal && Boolean(presence?.state === 'online' || member?.presence?.state === 'online');
  }, [getPresenceForMember, getPresenceTimestamp]);

  const activeOnlineProfiles = useMemo(() => {
    return activeRoomMemberProfiles.filter((member) => {
      const key = member.id || member.uid;
      return isMemberCurrentlyOnline(member) && key !== user?.id;
    });
  }, [activeRoomMemberProfiles, user?.id, isMemberCurrentlyOnline]);

  const activeRoomOnlineCount = activeOnlineProfiles.length;

  const allMessages = useMemo(() => {
    const map = new Map();
    olderMessages.forEach(m => map.set(m.id, m));
    messages.forEach(m => map.set(m.id, m));
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [olderMessages, messages]);

  const filteredMessages = useMemo(() => {
    const term = inChatSearchQuery.trim().toLowerCase();
    if (!term) return allMessages;
    return allMessages.filter((m) => {
      const textMatch = (m.text || '').toLowerCase().includes(term);
      const senderMatch = (m.senderName || m.senderEmail || '').toLowerCase().includes(term);
      return textMatch || senderMatch;
    });
  }, [allMessages, inChatSearchQuery]);

  const messagesWithSeparators = useMemo(() => {
    const items = [];
    let previousDateKey = '';
    filteredMessages.forEach((message) => {
      const dateKey = getDateKey(message.createdAt || message.updatedAt);
      if (dateKey && dateKey !== previousDateKey) {
        items.push({
          type: 'separator',
          key: `date-${dateKey}-${message.id}`,
          label: formatDateSeparator(message.createdAt || message.updatedAt)
        });
        previousDateKey = dateKey;
      }
      items.push({ type: 'message', key: message.id, message });
    });
    return items;
  }, [filteredMessages]);

  const messageTimelineEntries = useMemo(() => {
    return messagesWithSeparators.map((entry, index, array) => {
      if (entry.type !== 'message') return entry;
      let previousMessage = null;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (array[i].type === 'message') {
          previousMessage = array[i].message;
          break;
        }
        if (array[i].type === 'separator') break;
      }
      const senderEmail = FirestoreService.normalizeChatEmail(entry.message.senderEmail);
      const prevSenderEmail = previousMessage ? FirestoreService.normalizeChatEmail(previousMessage.senderEmail) : '';
      return {
        ...entry,
        groupedWithPrev: Boolean(previousMessage && prevSenderEmail === senderEmail)
      };
    });
  }, [messagesWithSeparators]);

  // Profile Cache Subscription
  const allRoomMemberEmails = useMemo(() => {
    const emailSet = new Set();
    rooms.forEach(r => (r.memberEmails || []).forEach(e => {
      const norm = FirestoreService.normalizeChatEmail(e);
      if (norm) emailSet.add(norm);
    }));
    return [...emailSet];
  }, [rooms]);

  const [userProfilesByEmail, setUserProfilesByEmail] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (!allRoomMemberEmails.length) return undefined;

    const missingEmails = allRoomMemberEmails.filter(e => !profileCacheRef.current.has(e));
    
    const updateProfilesState = () => {
      const map = {};
      allRoomMemberEmails.forEach(e => {
        if (profileCacheRef.current.has(e)) {
          map[e] = profileCacheRef.current.get(e);
        }
      });
      setUserProfilesByEmail(map);
      const activeCombined = activeRoomMemberEmails.map(e => profileCacheRef.current.get(e)).filter(Boolean);
      setRoomMemberProfiles(activeCombined);
    };

    if (missingEmails.length === 0) {
      updateProfilesState();
      return undefined;
    }

    FirestoreService.getUsersByEmails(missingEmails)
      .then((fetchedMembers) => {
        if (cancelled) return;
        fetchedMembers.forEach(m => {
          if (m.email) profileCacheRef.current.set(FirestoreService.normalizeChatEmail(m.email), m);
        });
        updateProfilesState();
      })
      .catch((error) => {
        console.warn('[Chat] Failed to load member profiles:', error);
      });

    return () => { cancelled = true; };
  }, [allRoomMemberEmails, activeRoomMemberEmails]);

  // Realtime Typing update
  useEffect(() => {
    if (!activeRoomId || !user?.id) return undefined;
    const typingRef = ref(rtdb, `typing/${activeRoomId}/${user.id}`);
    const trimmed = messageDraft.trim();
    if (!trimmed) {
      remove(typingRef).catch(() => void 0);
      return undefined;
    }
    const timeout = setTimeout(() => {
      set(typingRef, {
        state: 'typing',
        name: user.name || profile?.name || currentEmail || 'StudyOS User',
        email: currentEmail,
        lastChanged: Date.now()
      }).catch(() => void 0);
    }, 500);

    return () => clearTimeout(timeout);
  }, [messageDraft, activeRoomId, user?.id, user?.name, profile?.name, currentEmail]);

  // Realtime Typing subscription
  useEffect(() => {
    if (!activeRoomId) {
      setTypingByUid({});
      return undefined;
    }
    const typingRef = ref(rtdb, `typing/${activeRoomId}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      setTypingByUid(snapshot.val() || {});
    });
    return () => unsubscribe?.();
  }, [activeRoomId]);

  // Subscribe to My Chat Rooms
  useEffect(() => {
    if (!currentEmail) return undefined;
    const unsubscribe = FirestoreService.subscribeToMyChatRooms(currentEmail, (nextRooms) => {
      setRooms(nextRooms);
      let cacheUpdated = false;
      nextRooms.forEach((r) => {
        const normSender = FirestoreService.normalizeChatEmail(r.lastMessageSenderEmail);
        if (normSender && r.lastMessageSenderAvatar) {
          const existing = profileCacheRef.current.get(normSender) || {};
          if (existing.avatar !== r.lastMessageSenderAvatar) {
            profileCacheRef.current.set(normSender, {
              ...existing,
              email: normSender,
              name: r.lastMessageSenderName || existing.name || normSender,
              avatar: r.lastMessageSenderAvatar
            });
            cacheUpdated = true;
          }
        }
      });
      if (cacheUpdated) {
        const map = {};
        allRoomMemberEmails.forEach((e) => {
          if (profileCacheRef.current.has(e)) {
            map[e] = profileCacheRef.current.get(e);
          }
        });
        setUserProfilesByEmail(map);
      }
    });
    return () => unsubscribe?.();
  }, [currentEmail, allRoomMemberEmails]);

  // Active Room state sync
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

  // Subscribe to Chat Messages for active room
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      setOlderMessages([]);
      return undefined;
    }

    setLoadingMessages(true);
    const unsubscribe = FirestoreService.subscribeToChatMessages(activeRoomId, (nextMessages) => {
      setMessages(nextMessages);
      setLoadingMessages(false);

      // Hydrate profileCacheRef with avatar URLs from message senders
      let cacheUpdated = false;
      nextMessages.forEach((m) => {
        const normEmail = FirestoreService.normalizeChatEmail(m.senderEmail);
        if (normEmail && m.senderAvatar) {
          const existing = profileCacheRef.current.get(normEmail) || {};
          if (existing.avatar !== m.senderAvatar) {
            profileCacheRef.current.set(normEmail, {
              ...existing,
              email: normEmail,
              name: m.senderName || existing.name || normEmail,
              avatar: m.senderAvatar
            });
            cacheUpdated = true;
          }
        }
      });

      if (cacheUpdated) {
        const map = {};
        allRoomMemberEmails.forEach((e) => {
          if (profileCacheRef.current.has(e)) {
            map[e] = profileCacheRef.current.get(e);
          }
        });
        setUserProfilesByEmail(map);
      }
    });

    FirestoreService.markChatRoomRead(activeRoomId, currentEmail).catch((error) => {
      console.warn('[Chat] Failed to mark room read:', error);
    });

    return () => {
      setLoadingMessages(false);
      unsubscribe?.();
    };
  }, [activeRoomId, currentEmail]);

  // Reset inputs on room switch
  useEffect(() => {
    setReplyTarget(null);
    setPendingAttachments([]);
    setMessageDraft('');
    setRoomDetailsOpen(false);
    setGroupMemberDraft('');
    setAddingGroupMembers(false);
    setInviteLinkState({ loading: false, value: '', copied: false });
    setMemberActionPending('');
    setJoiningInviteLink(false);
    setOlderMessages([]);
    setHasMoreMessages(true);
    setThreadMessage(null);
  }, [activeRoomId]);

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMoreMessages || allMessages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldestMessage = allMessages[0];
      const more = await FirestoreService.getMoreChatMessages(activeRoomId, oldestMessage.createdAt);
      if (more.length < 50) setHasMoreMessages(false);
      if (more.length > 0) setOlderMessages((prev) => [...more, ...prev]);
    } finally {
      setLoadingOlder(false);
    }
  };

  const isRoomUnread = (room) => {
    if (!room || !currentEmailKey) return false;
    const lastRead = room.lastReadAtByEmail?.[currentEmailKey];
    const lastMessageAt = room.lastMessageAt;
    if (!lastMessageAt) return false;
    if (!lastRead) return true;
    return new Date(lastMessageAt).getTime() > new Date(lastRead).getTime();
  };

  const getDirectPeerEmail = useCallback((room) => {
    const members = normalizeEmailList(room?.memberEmails);
    return members.find((email) => email !== currentEmail) || '';
  }, [currentEmail]);

  const getRoomTitle = useCallback((room) => {
    if (!room) return 'Study Room';
    if (room.roomType === 'direct') {
      const peerEmail = getDirectPeerEmail(room);
      return room.title && room.title !== 'Direct message'
        ? room.title
        : peerEmail || 'Direct message';
    }
    return room.title || 'Study Room';
  }, [getDirectPeerEmail]);

  const openCreateRoom = (type = 'group') => {
    setRoomType(type);
    if (type === 'direct') {
      setRoomTitle('');
      setContextType('general');
      setContextId('');
    }
    setIsCreateOpen(true);
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to create a chat room');
      return;
    }
    const members = [...groupMemberEmails];
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
      setActiveRoomId(room.id);
      toast.success(room.existed ? 'Opened existing direct message' : 'Chat room created');
    } catch (error) {
      toast.error(error?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const trimmedMessage = messageDraft.trim();
    const hasAttachments = pendingAttachments.length > 0;
    if (!activeRoomId || (!trimmedMessage && !hasAttachments)) return;
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to send messages');
      return;
    }
    try {
      setSending(true);
      await FirestoreService.sendChatMessage(activeRoomId, {
        text: trimmedMessage,
        senderUid: user.id,
        senderEmail: user.email,
        senderName: user.name || profile?.name || user.email,
        senderAvatar: user.avatar || profile?.avatar || '',
        attachments: pendingAttachments,
        replyToMessageId: replyTarget?.id || '',
        replyToText: replyTarget?.text || '',
        replyToSenderName: replyTarget?.senderName || '',
        replyToSenderEmail: replyTarget?.senderEmail || '',
        roomContext: activeRoom
      });
      setMessageDraft('');
      setPendingAttachments([]);
      setReplyTarget(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (messageId, reactionKey) => {
    if (!activeRoomId) return;
    try {
      await FirestoreService.toggleChatReaction(activeRoomId, messageId, reactionKey, user?.email);
    } catch (error) {
      toast.error('Failed to update reaction');
    }
  };

  const handleStartEditMessage = (message) => {
    if (!message) {
      setEditingMessageId(null);
      setEditingText('');
      return;
    }
    setEditingMessageId(message.id);
    setEditingText(message.text || '');
  };

  const handleSaveEditMessage = async () => {
    if (!editingMessageId || !activeRoomId || !editingText.trim()) return;
    try {
      await FirestoreService.updateChatMessage(activeRoomId, editingMessageId, editingText);
      setEditingMessageId(null);
      setEditingText('');
      toast.success('Message updated');
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!activeRoomId || !messageId) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      await FirestoreService.deleteChatMessage(activeRoomId, messageId);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleTogglePinMessage = async (message) => {
    if (!activeRoomId || !message?.id) return;
    try {
      await FirestoreService.togglePinChatMessage(activeRoomId, message.id, message.pinned);
      toast.success(message.pinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  const handleAttachmentPick = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !activeRoomId) return;
    const usableFiles = files.filter((file) => {
      if (!isValidChatAttachmentFile(file)) {
        toast.error(`${file.name} is not supported`);
        return false;
      }
      if (file.size > attachmentLimitBytes) {
        toast.error(`${file.name} is too large`);
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
      toast.success(`${uploaded.length} attachment(s) added`);
    } catch (error) {
      toast.error(error?.message || 'Attachment upload failed');
    } finally {
      setAttachmentUploading(false);
      event.target.value = '';
    }
  };

  const handleRemovePendingAttachment = (index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddGroupMembers = async (event) => {
    event.preventDefault();
    if (!activeRoom || !isGroupRoom) return;
    const existingMembers = new Set(activeRoomMemberEmails);
    const nextMembers = groupMemberDraftEmails.filter((email) => email !== currentEmail && !existingMembers.has(email));
    if (nextMembers.length === 0) {
      toast.error('Add at least one new email');
      return;
    }
    try {
      setAddingGroupMembers(true);
      await FirestoreService.addChatRoomMembers(activeRoom.id, nextMembers);
      setGroupMemberDraft('');
      toast.success(`Added ${nextMembers.length} member(s)`);
    } catch (error) {
      toast.error('Failed to add members');
    } finally {
      setAddingGroupMembers(false);
    }
  };

  const handleCreateInviteLink = async () => {
    if (!activeRoom || !isGroupRoom) return;
    try {
      setInviteLinkState((prev) => ({ ...prev, loading: true }));
      const inviteCode = await FirestoreService.ensureChatRoomInviteCode(activeRoom.id);
      const value = FirestoreService.buildChatInviteLink(activeRoom.id, inviteCode);
      setInviteLinkState({ loading: false, value, copied: false });
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setInviteLinkState((prev) => ({ ...prev, copied: true }));
        toast.success('Invite link copied');
      }
    } catch (error) {
      setInviteLinkState((prev) => ({ ...prev, loading: false }));
      toast.error('Failed to create invite link');
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLinkState.value) return;
    try {
      await navigator.clipboard.writeText(inviteLinkState.value);
      setInviteLinkState((prev) => ({ ...prev, copied: true }));
      toast.success('Invite link copied');
    } catch (error) {
      toast.error('Could not copy invite link');
    }
  };

  const handlePromoteMember = async (member) => {
    const memberEmail = FirestoreService.normalizeChatEmail(member?.email);
    if (!memberEmail) return;
    try {
      await FirestoreService.promoteChatRoomMember(activeRoom.id, memberEmail);
      toast.success(`${member.name || member.email} promoted to admin`);
    } catch (error) {
      toast.error('Failed to promote member');
    }
  };

  const handleRemoveMember = async (member) => {
    const memberEmail = FirestoreService.normalizeChatEmail(member?.email);
    if (!memberEmail) return;
    try {
      await FirestoreService.removeChatRoomMember(activeRoom.id, memberEmail);
      toast.success(`${member.name || member.email} removed from group`);
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  // Convert Message to Task
  const handleConvertToTask = (message) => {
    const newTask = {
      id: `task_${Date.now()}`,
      title: `Task: ${message.text?.slice(0, 40) || 'Study item'}`,
      description: `Created from room discussion: "${message.text}"`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setTasks((prev) => [...prev, newTask]);
    toast.success('Converted message to Study Task!');
  };

  // Convert Message to Note
  const handleConvertToNote = (message) => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: `Note: ${message.text?.slice(0, 30)}`,
      content: message.text,
      createdAt: new Date().toISOString()
    };
    setNotes((prev) => [...prev, newNote]);
    toast.success('Saved message to Notes!');
  };

  // Ask Orion AI about message or summarize conversation
  const handleAskOrion = (messageOrAction) => {
    openOrionPanel && openOrionPanel();
    if (typeof messageOrAction === 'string' && messageOrAction === 'summary') {
      const summaryText = allMessages.slice(-20).map(m => `${m.senderName || m.senderEmail}: ${m.text}`).join('\n');
      sendOrionMessage && sendOrionMessage(`Please summarize the following study group discussion and list action items:\n\n${summaryText}`);
    } else if (messageOrAction?.text) {
      sendOrionMessage && sendOrionMessage(`Please explain or answer this message from our chat:\n\n"${messageOrAction.text}"`);
    }
  };

  const pinnedMessages = useMemo(() => allMessages.filter((m) => m.pinned), [allMessages]);

  const groupInviteCount = groupMemberEmails.filter((email) => email !== currentEmail).length;
  const directInviteCount = normalizeEmailList(memberEmails.split(/[,\n]/g)).filter((email) => email !== currentEmail).length;
  const canCreateRoom = roomType === 'direct' ? directInviteCount === 1 : groupInviteCount >= 1;

  return (
    <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* 4-COLUMN WORKSPACE CONTAINER */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* COL 2: CONVERSATION LIST SIDEBAR */}
        <aside className={`w-80 lg:w-80 shrink-0 h-full flex flex-col ${mobilePanel === 'rooms' ? 'w-full flex' : 'hidden md:flex'}`}>
          <ConversationList
            rooms={rooms}
            activeRoomId={activeRoomId}
            setActiveRoomId={setActiveRoomId}
            roomSearch={roomSearch}
            setRoomSearch={setRoomSearch}
            openCreateRoom={openCreateRoom}
            currentEmail={currentEmail}
            userProfilesByEmail={userProfilesByEmail}
            isRoomUnread={isRoomUnread}
            presenceByUid={presenceByUid}
            typingByUid={typingByUid}
            getDirectPeerEmail={getDirectPeerEmail}
            getRoomTitle={getRoomTitle}
            setMobilePanel={setMobilePanel}
          />
        </aside>

        {/* COL 3: MAIN CONVERSATION STREAM */}
        <main className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-950 min-w-0 ${mobilePanel === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          {/* Sticky Header */}
          <RoomHeader
            activeRoom={activeRoom}
            getRoomTitle={getRoomTitle}
            getDirectPeerEmail={getDirectPeerEmail}
            userProfilesByEmail={userProfilesByEmail}
            activeRoomOnlineCount={activeRoomOnlineCount}
            activeRoomMemberProfiles={activeRoomMemberProfiles}
            inChatSearchOpen={inChatSearchOpen}
            setInChatSearchOpen={setInChatSearchOpen}
            inChatSearchQuery={inChatSearchQuery}
            setInChatSearchQuery={setInChatSearchQuery}
            roomDetailsOpen={roomDetailsOpen}
            setRoomDetailsOpen={setRoomDetailsOpen}
            pinnedCount={pinnedMessages.length}
            onSummarizeClick={() => handleAskOrion('summary')}
            setMobilePanel={setMobilePanel}
          />

          {/* Messages Feed */}
          <MessageList
            messages={messageTimelineEntries}
            currentEmail={currentEmail}
            loadingMessages={loadingMessages}
            loadingOlder={loadingOlder}
            hasMoreMessages={hasMoreMessages}
            loadOlderMessages={loadOlderMessages}
            onReply={(m) => setReplyTarget(m)}
            onToggleReaction={handleToggleReaction}
            onStartEdit={handleStartEditMessage}
            onDelete={handleDeleteMessage}
            onTogglePin={handleTogglePinMessage}
            onOpenThread={(m) => setThreadMessage(m)}
            onConvertToTask={handleConvertToTask}
            onConvertToNote={handleConvertToNote}
            onAskOrion={handleAskOrion}
            setLightboxMedia={setLightboxMedia}
            editingMessageId={editingMessageId}
            editingText={editingText}
            setEditingText={setEditingText}
            onSaveEdit={handleSaveEditMessage}
            messageEndRef={messageEndRef}
            messageContainerRef={messageContainerRef}
          />

          {/* Composer */}
          <MessageComposer
            messageDraft={messageDraft}
            setMessageDraft={setMessageDraft}
            handleSendMessage={handleSendMessage}
            sending={sending}
            replyTarget={replyTarget}
            setReplyTarget={setReplyTarget}
            pendingAttachments={pendingAttachments}
            handleRemovePendingAttachment={handleRemovePendingAttachment}
            handleAttachmentPick={handleAttachmentPick}
            attachmentUploading={attachmentUploading}
            attachmentInputRef={attachmentInputRef}
            onOrionAiAssistant={(type) => handleAskOrion(type)}
          />
        </main>

        {/* COL 4: SLACK-STYLE RIGHT THREAD PANEL */}
        <AnimatePresence>
          {threadMessage && (
            <ThreadPanel
              threadMessage={threadMessage}
              onCloseThread={() => setThreadMessage(null)}
              onSendThreadReply={(msg, replyText) => {
                handleSendMessage({
                  preventDefault: () => {},
                  text: replyText
                });
              }}
              currentEmail={currentEmail}
            />
          )}
        </AnimatePresence>

        {/* COL 5 / DETAILS SIDEBAR */}
        <AnimatePresence>
          {roomDetailsOpen && activeRoom && !threadMessage && (
            <RoomDetailsPanel
              activeRoom={activeRoom}
              activeRoomMemberProfiles={activeRoomMemberProfiles}
              currentEmail={currentEmail}
              user={user}
              isActiveRoomAdmin={isActiveRoomAdmin}
              isGroupRoom={isGroupRoom}
              setRoomDetailsOpen={setRoomDetailsOpen}
              groupMemberDraft={groupMemberDraft}
              setGroupMemberDraft={setGroupMemberDraft}
              handleAddGroupMembers={handleAddGroupMembers}
              addingGroupMembers={addingGroupMembers}
              handleCreateInviteLink={handleCreateInviteLink}
              handleCopyInviteLink={handleCopyInviteLink}
              inviteLinkState={inviteLinkState}
              handlePromoteMember={handlePromoteMember}
              handleRemoveMember={handleRemoveMember}
              pinnedMessages={pinnedMessages}
              allMessages={allMessages}
              onOrionAiAssistant={handleAskOrion}
            />
          )}
        </AnimatePresence>
      </div>

      {/* CREATE ROOM MODAL */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        roomType={roomType}
        setRoomType={setRoomType}
        roomTitle={roomTitle}
        setRoomTitle={setRoomTitle}
        memberEmails={memberEmails}
        setMemberEmails={setMemberEmails}
        contextType={contextType}
        setContextType={setContextType}
        contextId={contextId}
        setContextId={setContextId}
        contextOptions={contextOptions}
        handleCreateRoom={handleCreateRoom}
        creating={creating}
        canCreateRoom={canCreateRoom}
        directInviteError={roomType === 'direct' && directInviteCount !== 1 ? 'Add exactly one other email.' : ''}
        groupInviteError={roomType === 'group' && groupInviteCount < 1 ? 'Add at least one member email.' : ''}
      />

      {/* LIGHTBOX MEDIA PREVIEW */}
      <AnimatePresence>
        {lightboxMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={24} />
            </button>
            <img src={lightboxMedia} alt="Media preview" className="max-w-full max-h-full object-contain rounded-2xl" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
