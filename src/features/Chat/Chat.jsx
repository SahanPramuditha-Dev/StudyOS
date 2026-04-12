import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Send, MessageSquare, Users, Hash, NotebookText, Paperclip, Reply, Smile, X, FileText, Image as ImageIcon, Upload, Info, Clock3, CircleDot, PanelRightClose, PanelRightOpen } from 'lucide-react';
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

const PRESENCE_STALE_MS = 90 * 1000;

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

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

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

const normalizeEmailList = (emails = []) => [...new Set((emails || [])
  .map((email) => FirestoreService.normalizeChatEmail(email))
  .filter(Boolean))];

const buildChatMentionTokens = (email = '', name = '') => {
  const tokens = new Set();
  const normalizedEmail = FirestoreService.normalizeChatEmail(email);
  if (normalizedEmail) {
    const localPart = normalizedEmail.split('@')[0] || '';
    const alias = localPart.replace(/[^a-z0-9]+/g, '');
    tokens.add(`@${normalizedEmail}`);
    if (localPart) tokens.add(`@${localPart}`);
    if (alias) tokens.add(`@${alias}`);
  }

  const normalizedName = String(name || '').trim().toLowerCase();
  if (normalizedName) {
    tokens.add(`@${normalizedName}`);
    normalizedName.split(/\s+/).filter(Boolean).forEach((part) => {
      tokens.add(`@${part}`);
    });
  }

  return [...tokens].filter(Boolean);
};

const textMentionsUser = (text = '', email = '', name = '') => {
  const normalizedText = String(text || '').toLowerCase();
  if (!normalizedText) return false;
  if (normalizedText.includes('@all') || normalizedText.includes('@everyone')) return true;
  return buildChatMentionTokens(email, name).some((token) => normalizedText.includes(token));
};

const Chat = () => {
  const { user, profile } = useAuth();
  const { addNotification } = useReminders();
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
  const [roomMemberProfiles, setRoomMemberProfiles] = useState([]);
  const [presenceByUid, setPresenceByUid] = useState({});
  const [typingByUid, setTypingByUid] = useState({});
  const [roomDetailsOpen, setRoomDetailsOpen] = useState(false);
  const [groupMemberDraft, setGroupMemberDraft] = useState('');
  const [addingGroupMembers, setAddingGroupMembers] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('rooms');
  const [inviteLinkState, setInviteLinkState] = useState({ loading: false, value: '', copied: false });
  const [memberActionPending, setMemberActionPending] = useState('');
  const [joiningInviteLink, setJoiningInviteLink] = useState(false);

  const messageEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
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

  const invitedEmails = useMemo(
    () => normalizeEmailList(memberEmails.split(/[,\n]/g)),
    [memberEmails]
  );

  const groupMemberEmails = useMemo(
    () => normalizeEmailList([currentEmail, ...invitedEmails]),
    [currentEmail, invitedEmails]
  );

  const directRooms = useMemo(
    () => rooms.filter((room) => room.roomType === 'direct'),
    [rooms]
  );

  const groupRooms = useMemo(
    () => rooms.filter((room) => room.roomType !== 'direct'),
    [rooms]
  );

  const recentContacts = useMemo(() => {
    const contacts = new Map();
    rooms
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .forEach((room) => {
        normalizeEmailList(room?.memberEmails)
          .filter((email) => email && email !== currentEmail)
          .forEach((email) => {
            if (!contacts.has(email)) {
              const roomTitle = room.roomType === 'direct'
                ? `Direct message with ${normalizeEmailList(room?.memberEmails).find((memberEmail) => memberEmail !== currentEmail) || email}`
                : (room.title || room.contextLabel || 'Study Room');
              contacts.set(email, {
                email,
                roomType: room.roomType,
                roomTitle
              });
            }
          });
      });
    return [...contacts.values()].slice(0, 10);
  }, [rooms, currentEmail]);

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

  const groupMemberInvitePreview = useMemo(() => {
    if (!isGroupRoom) return [];
    const existingMembers = new Set(activeRoomMemberEmails);
    return groupMemberDraftEmails.filter((email) => email !== currentEmail && !existingMembers.has(email));
  }, [activeRoomMemberEmails, currentEmail, groupMemberDraftEmails, isGroupRoom]);

  const suggestedGroupMembers = useMemo(() => {
    if (!isGroupRoom) return [];
    const existingMembers = new Set(activeRoomMemberEmails);
    const candidates = [];

    recentContacts.forEach((contact) => {
      if (!contact?.email) return;
      if (contact.email === currentEmail || existingMembers.has(contact.email)) return;
      if (candidates.includes(contact.email)) return;
      candidates.push(contact.email);
    });

    return candidates.slice(0, 6);
  }, [activeRoomMemberEmails, currentEmail, recentContacts, isGroupRoom]);

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
    const candidate = presence?.lastChanged
      || new Date(profilePresence?.updatedAt || lastActiveAt || '').getTime();
    return Number.isFinite(candidate) ? candidate : 0;
  }, [getPresenceForMember]);

  const isMemberCurrentlyOnline = useCallback((member) => {
    const presence = getPresenceForMember(member);
    const timestamp = getPresenceTimestamp(member);
    if (!timestamp) return false;
    const hasFreshSignal = Date.now() - timestamp <= PRESENCE_STALE_MS;
    return hasFreshSignal && Boolean(presence?.state === 'online' || member?.presence?.state === 'online');
  }, [getPresenceForMember, getPresenceTimestamp]);

  const activeTypingProfiles = useMemo(() => {
    return activeRoomMemberProfiles.filter((member) => {
      const key = member.id || member.uid;
      return Boolean(typingByUid?.[key]) && key !== user?.id;
    });
  }, [activeRoomMemberProfiles, typingByUid, user?.id]);

  const activeOnlineProfiles = useMemo(() => {
    return activeRoomMemberProfiles.filter((member) => {
      const key = member.id || member.uid;
      return isMemberCurrentlyOnline(member) && key !== user?.id;
    });
  }, [activeRoomMemberProfiles, user?.id, isMemberCurrentlyOnline]);

  const activeRoomOnlineCount = activeOnlineProfiles.length;

  const activeRoomTypingLabel = useMemo(() => {
    if (activeTypingProfiles.length === 0) return '';
    const names = activeTypingProfiles
      .map((member) => member.name || member.email || 'Someone')
      .slice(0, 2);
    const suffix = activeTypingProfiles.length > 2 ? ` and ${activeTypingProfiles.length - 2} more` : '';
    return `${names.join(', ')}${suffix} ${activeTypingProfiles.length === 1 ? 'is' : 'are'} typing...`;
  }, [activeTypingProfiles]);

  const activeRoomLiveSummary = useMemo(() => {
    if (!activeRoom) return '';
    if (activeTypingProfiles.length > 0) return activeRoomTypingLabel;
    if (activeRoomOnlineCount > 0) {
      return `${activeRoomOnlineCount} member${activeRoomOnlineCount === 1 ? '' : 's'} online now`;
    }
    return activeRoom.roomType === 'direct'
      ? 'Private 1:1 conversation'
      : 'Invite-only study room';
  }, [activeRoom, activeRoomOnlineCount, activeRoomTypingLabel, activeTypingProfiles.length]);

  const messagesWithSeparators = useMemo(() => {
    const items = [];
    let previousDateKey = '';
    messages.forEach((message) => {
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
  }, [messages]);

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

      let nextMessage = null;
      for (let i = index + 1; i < array.length; i += 1) {
        if (array[i].type === 'message') {
          nextMessage = array[i].message;
          break;
        }
        if (array[i].type === 'separator') break;
      }

      const senderEmail = FirestoreService.normalizeChatEmail(entry.message.senderEmail);
      const prevSenderEmail = previousMessage ? FirestoreService.normalizeChatEmail(previousMessage.senderEmail) : '';
      const nextSenderEmail = nextMessage ? FirestoreService.normalizeChatEmail(nextMessage.senderEmail) : '';

      return {
        ...entry,
        groupedWithPrev: Boolean(previousMessage && prevSenderEmail === senderEmail),
        groupedWithNext: Boolean(nextMessage && nextSenderEmail === senderEmail)
      };
    });
  }, [messagesWithSeparators]);

  useEffect(() => {
    let cancelled = false;
    if (!activeRoomMemberEmails.length) {
      setRoomMemberProfiles([]);
      return undefined;
    }

    FirestoreService.getUsersByEmails(activeRoomMemberEmails)
      .then((members) => {
        if (!cancelled) setRoomMemberProfiles(members);
      })
      .catch((error) => {
        console.warn('[Chat] Failed to load room member profiles:', error);
        if (!cancelled) setRoomMemberProfiles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeRoomMemberEmails]);

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
        name: user.name || profile?.name || currentEmail || 'StudyOs User',
        email: currentEmail,
        lastChanged: Date.now()
      }).catch((error) => {
        console.warn('[Chat] Failed to set typing state:', error);
      });
    }, 500);

    return () => {
      clearTimeout(timeout);
      remove(typingRef).catch(() => void 0);
    };
  }, [messageDraft, activeRoomId, user?.id, user?.name, profile?.name, currentEmail]);

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

  useEffect(() => {
    const statusRef = ref(rtdb, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      setPresenceByUid(snapshot.val() || {});
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    const joinParam = new URLSearchParams(window.location.search).get('join');
    if (!joinParam || !user?.email) return;
    if (inviteJoinAttemptRef.current === `${joinParam}:${currentEmail}`) return;

    const [roomId, inviteCode] = String(joinParam).split(':');
    if (!roomId || !inviteCode) return;

    inviteJoinAttemptRef.current = `${joinParam}:${currentEmail}`;
    setJoiningInviteLink(true);
    FirestoreService.joinChatRoomByInviteCode(roomId, inviteCode, user.email)
      .then(() => {
        setActiveRoomId(roomId);
        setMobilePanel('chat');
        toast.success('Joined the group from invite link');
      })
      .catch((error) => {
        console.error('[Chat] Failed to join from invite link:', error);
        toast.error(error?.message || 'Invite link could not be used');
      })
      .finally(() => {
        setJoiningInviteLink(false);
      });
  }, [currentEmail, user?.email]);

  useEffect(() => {
    const roomParam = new URLSearchParams(window.location.search).get('room');
    if (!roomParam || !rooms.length) return;
    if (!rooms.some((room) => room.id === roomParam)) return;
    if (roomParam === activeRoomId) return;
    setActiveRoomId(roomParam);
    setMobilePanel('chat');
  }, [rooms, activeRoomId]);

  useEffect(() => {
    if (!currentEmail || rooms.length === 0) return;

    rooms.forEach((room) => {
      if (!room?.id) return;

      const lastMessageAt = String(room.lastMessageAt || '').trim();
      const previousStamp = roomNotificationHistoryRef.current.get(room.id);
      roomNotificationHistoryRef.current.set(room.id, lastMessageAt || previousStamp || '');

      if (!lastMessageAt || !previousStamp || previousStamp === lastMessageAt) return;
      if (room.id === activeRoomId) return;

      const senderEmail = FirestoreService.normalizeChatEmail(room.lastMessageSenderEmail);
      if (senderEmail === currentEmail) return;

      const roomTitle = room?.roomType === 'direct'
        ? (room.title && room.title !== 'Direct message'
          ? room.title
          : normalizeEmailList(room?.memberEmails).find((email) => email !== currentEmail) || 'Direct message')
        : (room.title || 'Study Room');
      const senderName = room.lastMessageSenderName || room.lastMessageSenderEmail || 'Someone';
      const preview = String(room.lastMessage || 'New message').trim() || 'New message';
      const mentionEmails = normalizeEmailList(room.lastMessageMentionEmails || []);
      const hasAttachments = Boolean(room.lastMessageHasAttachments) || Number(room.lastMessageAttachmentCount || 0) > 0;

      if (mentionEmails.includes(currentEmail)) {
        addNotification(chatMentionNotification(roomTitle, senderName, preview, room.id));
      } else if (hasAttachments) {
        addNotification(chatSharedContentNotification(roomTitle, senderName, preview, room.id));
      } else {
        addNotification(chatMessageNotification(roomTitle, senderName, preview, room.id));
      }
    });
  }, [rooms, activeRoomId, currentEmail, addNotification]);

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

  const getRoomMemberCount = (room) => normalizeEmailList(room?.memberEmails).length;

  const directMessageToLabel = (room) => {
    const peerEmail = getDirectPeerEmail(room);
    return peerEmail ? `Direct message with ${peerEmail}` : 'Direct message';
  };

  const getRoomMemberSummary = (room) => {
    const members = normalizeEmailList(room?.memberEmails);
    return members.length ? `${members.length} member${members.length === 1 ? '' : 's'}` : 'No members';
  };

  const getRoomLastActivity = (room) => {
    if (!room?.lastMessageAt) return 'No activity yet';
    return formatRelativeTime(room.lastMessageAt) || formatTime(room.lastMessageAt);
  };

  const getMemberStatus = (member) => {
    const key = member.id || member.uid;
    if (key && typingByUid?.[key]) {
      return 'Typing';
    }
    if (isMemberCurrentlyOnline(member)) {
      return 'Online';
    }
    return 'Offline';
  };

  const getMemberStatusTone = (member) => {
    const status = getMemberStatus(member);
    if (status === 'Typing') {
      return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-900/40';
    }
    if (status === 'Online') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-900/40';
    }
    return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  const getMemberLastSeen = (member) => {
    const timestamp = getPresenceTimestamp(member);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return 'No recent activity';
    if (isMemberCurrentlyOnline(member)) return 'Active now';
    return `Last seen ${formatRelativeTime(timestamp) || formatTime(timestamp)}`;
  };

  const getRoomStyle = (room) => {
    if (room?.roomType === 'direct') {
      return {
        badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        iconBg: 'bg-emerald-500',
        selected: 'bg-gradient-to-br from-white to-emerald-50/60 dark:from-slate-900 dark:to-emerald-500/10 border-emerald-100 dark:border-emerald-900/50',
        idle: 'bg-slate-50/70 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
      };
    }

    return {
      badge: 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300',
      iconBg: 'bg-primary-500',
      selected: 'bg-gradient-to-br from-white to-primary-50/60 dark:from-slate-900 dark:to-primary-500/10 border-primary-100 dark:border-primary-900/50',
      idle: 'bg-slate-50/70 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
    };
  };

  const buildMemberAvatarList = (room) => {
    const members = normalizeEmailList(room?.memberEmails);
    return members.slice(0, 4).map((email) => ({
      email,
      initials: email === currentEmail ? 'You' : getInitials(email),
      colors: getAvatarColor(email)
    }));
  };

  const getUnreadLabel = (room) => (isRoomUnread(room) ? 'Unread' : '');

  const openCreateRoom = (type = 'group') => {
    setRoomType(type);
    if (type === 'direct') {
      setRoomTitle('');
      setContextType('general');
      setContextId('');
    }
    setIsCreateOpen(true);
  };

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
    setRoomDetailsOpen(false);
    setGroupMemberDraft('');
    setAddingGroupMembers(false);
    setInviteLinkState({ loading: false, value: '', copied: false });
    setMemberActionPending('');
    setJoiningInviteLink(false);
  }, [activeRoomId]);

  useEffect(() => {
    setMobilePanel(activeRoomId ? 'chat' : 'rooms');
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

  const groupInviteCount = groupMemberEmails.filter((email) => email !== currentEmail).length;
  const groupInviteError = roomType === 'group' && groupInviteCount < 1
    ? 'Add at least one other member email.'
    : '';
  const directInviteCount = normalizeEmailList(memberEmails.split(/[,\n]/g))
    .filter((email) => email !== currentEmail).length;
  const directInviteError = roomType === 'direct' && directInviteCount !== 1
    ? 'Add exactly one other email.'
    : '';
  const canCreateRoom = roomType === 'direct'
    ? directInviteCount === 1
    : groupInviteCount >= 1;

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to create a chat room');
      return;
    }

    const members = [...groupMemberEmails];
    if (roomType === 'direct' && members.length !== 2) {
      toast.error('Direct messages need exactly one other person');
      return;
    }
    if (roomType === 'group' && groupInviteCount < 1) {
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
      toast.success(room.existed ? 'Opened existing direct message' : 'Chat room created');
    } catch (error) {
      console.error('[Chat] Failed to create room:', error);
      toast.error(error?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleAddGroupMembers = async (event) => {
    event.preventDefault();
    if (!activeRoom || !isGroupRoom) return;
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to update the group');
      return;
    }

    const existingMembers = new Set(activeRoomMemberEmails);
    const nextMembers = groupMemberDraftEmails.filter((email) => email !== currentEmail && !existingMembers.has(email));

    if (nextMembers.length === 0) {
      toast.error('Add at least one new member email');
      return;
    }

    try {
      setAddingGroupMembers(true);
      await FirestoreService.addChatRoomMembers(activeRoom.id, nextMembers);
      setGroupMemberDraft('');
      toast.success(`Added ${nextMembers.length} member${nextMembers.length === 1 ? '' : 's'} to the group`);
    } catch (error) {
      console.error('[Chat] Failed to add group members:', error);
      toast.error(error?.message || 'Failed to add members');
    } finally {
      setAddingGroupMembers(false);
    }
  };

  const handleCreateInviteLink = async () => {
    if (!activeRoom || !isGroupRoom) return;
    if (!isActiveRoomAdmin) {
      toast.error('Only group admins can create invite links');
      return;
    }

    try {
      setInviteLinkState((prev) => ({ ...prev, loading: true }));
      const inviteCode = await FirestoreService.ensureChatRoomInviteCode(activeRoom.id);
      const value = FirestoreService.buildChatInviteLink(activeRoom.id, inviteCode);
      setInviteLinkState({ loading: false, value, copied: false });
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setInviteLinkState((prev) => ({ ...prev, copied: true }));
        toast.success('Invite link copied');
      } else {
        toast.success('Invite link ready');
      }
    } catch (error) {
      console.error('[Chat] Failed to create invite link:', error);
      setInviteLinkState((prev) => ({ ...prev, loading: false }));
      toast.error(error?.message || 'Failed to create invite link');
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLinkState.value) return;
    try {
      await navigator.clipboard.writeText(inviteLinkState.value);
      setInviteLinkState((prev) => ({ ...prev, copied: true }));
      toast.success('Invite link copied');
    } catch (error) {
      console.error('[Chat] Failed to copy invite link:', error);
      toast.error('Could not copy invite link');
    }
  };

  const handlePromoteMember = async (member) => {
    if (!activeRoom || !isGroupRoom) return;
    if (!isActiveRoomAdmin) {
      toast.error('Only group admins can promote members');
      return;
    }

    const memberEmail = FirestoreService.normalizeChatEmail(member?.email);
    if (!memberEmail || memberEmail === currentEmail) {
      toast.error('Choose a different member to promote');
      return;
    }

    try {
      setMemberActionPending(`promote:${memberEmail}`);
      await FirestoreService.promoteChatRoomMember(activeRoom.id, memberEmail);
      toast.success(`${member.name || member.email || 'Member'} promoted to admin`);
    } catch (error) {
      console.error('[Chat] Failed to promote member:', error);
      toast.error(error?.message || 'Failed to promote member');
    } finally {
      setMemberActionPending('');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!activeRoom || !isGroupRoom) return;
    if (!isActiveRoomAdmin) {
      toast.error('Only group admins can remove members');
      return;
    }

    const memberEmail = FirestoreService.normalizeChatEmail(member?.email);
    if (!memberEmail || memberEmail === currentEmail) {
      toast.error('You cannot remove yourself from here');
      return;
    }

    try {
      setMemberActionPending(`remove:${memberEmail}`);
      await FirestoreService.removeChatRoomMember(activeRoom.id, memberEmail);
      toast.success(`${member.name || member.email || 'Member'} removed from the group`);
    } catch (error) {
      console.error('[Chat] Failed to remove member:', error);
      toast.error(error?.message || 'Failed to remove member');
    } finally {
      setMemberActionPending('');
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

  const showMobileRooms = mobilePanel === 'rooms';
  const showMobileChat = mobilePanel === 'chat';

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 sm:px-4 lg:px-6 pt-3 pb-5">
      <div className={`shrink-0 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-[10px] font-black uppercase tracking-[0.3em]">
            <MessageSquare size={12} />
            Collaborative Chat
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white max-w-4xl">
            Study rooms, group discussion, project talk, and 1:1 messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Create invite-only rooms for notes, resources, projects, assignments, or quick direct messages and keep the conversation tied to the work.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-[10px] font-black uppercase tracking-widest">
              {directRooms.length} direct threads
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest">
              {groupRooms.length} group rooms
            </span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest">
              Live sync
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openCreateRoom('direct')}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold shadow-sm hover:border-primary-200 dark:hover:border-primary-800"
          >
            <MessageSquare size={16} />
            Direct message
          </button>
          <button
            onClick={() => openCreateRoom('group')}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-3 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:opacity-95"
          >
            <Plus size={16} />
            New Room
          </button>
        </div>
      </div>

      <div className={`md:hidden flex items-center gap-2 ${showMobileRooms ? 'flex' : 'hidden'}`}>
        <button
          type="button"
          onClick={() => setMobilePanel('rooms')}
          className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold border ${mobilePanel === 'rooms' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'}`}
        >
          Rooms
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('chat')}
          disabled={!activeRoom}
          className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold border ${mobilePanel === 'chat' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'} ${!activeRoom ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Chat
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4 sm:gap-6">
        <aside className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0 ${mobilePanel === 'rooms' ? 'flex' : 'hidden'} md:flex`}>
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
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300">
                {directRooms.length} direct
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                {groupRooms.length} group
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar chat-scrollbar chat-panel-surface">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No rooms yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start a direct message or create your first study room by email.</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredRooms.map((room) => {
                  const unread = isRoomUnread(room);
                  const style = getRoomStyle(room);
                  const unreadLabel = getUnreadLabel(room);
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveRoomId(room.id);
                        setMobilePanel('chat');
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${room.id === activeRoomId ? style.selected : style.idle}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-11 w-11 rounded-2xl ${style.iconBg} text-white flex items-center justify-center shadow-lg shadow-black/10 shrink-0`}>
                          {room.roomType === 'direct' ? <MessageSquare size={17} /> : <Users size={17} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-slate-800 dark:text-slate-100 truncate">{getRoomTitle(room)}</p>
                                {unread && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 truncate">
                                {room.roomType === 'direct'
                                  ? directMessageToLabel(room)
                                  : (room.contextLabel || 'General room')}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.badge}`}>
                              {room.roomType === 'direct' ? 'DM' : 'Group'}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                            <span className="truncate font-medium">
                              {room.lastMessage || 'No messages yet'}
                            </span>
                            <span className="whitespace-nowrap">
                              {getRoomLastActivity(room)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                              {getRoomMemberSummary(room)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                              {getRoomLastActivity(room)}
                            </span>
                            {unreadLabel && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/40 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                1 new
                              </span>
                            )}
                            {room.roomType === 'group' && room.contextLabel && (
                              <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                                {room.contextLabel}
                              </span>
                            )}
                            {room.roomType === 'direct' && getDirectPeerEmail(room) && (
                              <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300 truncate max-w-[140px]">
                                {getDirectPeerEmail(room)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0 relative ${showMobileChat ? 'flex' : 'hidden'} md:flex`}>
          {!activeRoom ? (
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 text-center">
                    <div className="max-w-md space-y-4">
                      <div className="mx-auto w-14 sm:w-16 h-14 sm:h-16 rounded-3xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center">
                        <Hash size={24} />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">Pick a room or create a new one</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                  Direct messages are best for 1:1 questions. Group chats work best when you link them to a project, assignment, note, or resource.
                      </p>
                    </div>
                  </div>
          ) : (
            <>
              <div className="md:hidden shrink-0 px-3 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobilePanel('rooms')}
                  className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                  aria-label="Back to rooms"
                >
                  <MessageSquare size={16} className="rotate-180" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {activeRoom.roomType === 'direct' ? 'Direct message' : 'Group chat'}
                  </p>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {getRoomTitle(activeRoom)}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeRoomLiveSummary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRoomDetailsOpen((prev) => !prev)}
                  className="h-10 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Details
                </button>
              </div>

              <div className="shrink-0 p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 hidden md:block">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.28em] ${activeRoom.roomType === 'direct' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300'}`}>
                      {activeRoom.roomType === 'direct' ? <MessageSquare size={12} /> : <Users size={12} />}
                      {activeRoom.roomType === 'direct' ? 'Direct message' : 'Group chat'}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                        {getRoomTitle(activeRoom)}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {activeRoom.roomType === 'direct'
                          ? directMessageToLabel(activeRoom)
                          : (activeRoom.contextLabel || 'General conversation')}
                      </p>
                      <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                        {activeRoomLiveSummary}
                      </p>
                      {activeTypingProfiles.length > 0 && (
                        <p className="mt-1 inline-flex items-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          {activeRoomTypingLabel}
                        </p>
                      )}
                    </div>
                    {isGroupRoom ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(activeRoom.memberEmails || []).map((email) => (
                          <span
                            key={email}
                            className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                          >
                            {email === currentEmail ? 'You' : email}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(activeRoom.memberEmails || []).map((email) => (
                          <span
                            key={email}
                            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-300"
                          >
                            {email}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isGroupRoom && (
                      <div className="flex -space-x-2">
                        {buildMemberAvatarList(activeRoom).map((member) => {
                          const [bgColor, fgColor] = member.colors;
                          return (
                            <div
                              key={member.email}
                              className="h-9 w-9 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black shadow-sm"
                              style={{ backgroundColor: bgColor, color: fgColor }}
                              title={member.email}
                            >
                              {member.initials}
                            </div>
                          );
                        })}
                        {normalizeEmailList(activeRoom?.memberEmails).length > 4 && (
                          <div className="h-9 w-9 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-300 shadow-sm">
                            +{normalizeEmailList(activeRoom?.memberEmails).length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        {getRoomMemberCount(activeRoom)} member{getRoomMemberCount(activeRoom) === 1 ? '' : 's'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300">
                        Active room
                      </span>
                      {isGroupRoom && (
                        <button
                          type="button"
                          onClick={() => {
                            setRoomDetailsOpen(true);
                            setMobilePanel('chat');
                          }}
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${isActiveRoomAdmin ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}
                        >
                          <Users size={14} />
                          {isActiveRoomAdmin ? 'Add members' : 'Members'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRoomDetailsOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {roomDetailsOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                        Room details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar chat-scrollbar chat-panel-surface p-4 sm:p-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/20">
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
                  messageTimelineEntries.map((entry) => {
                    if (entry.type === 'separator') {
                      return (
                        <div key={entry.key} className="flex items-center justify-center py-2">
                          <span className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
                            {entry.label}
                          </span>
                        </div>
                      );
                    }

                    const message = entry.message;
                    const mine = FirestoreService.normalizeChatEmail(message.senderEmail) === currentEmail;
                    const replySource = message.replyToMessageId ? messageById.get(message.replyToMessageId) : null;
                    const fileAttachments = Array.isArray(message.attachments) ? message.attachments : [];
                    const reactionCounts = message.reactions || {};
                    const bubbleSpacing = entry.groupedWithPrev ? 'mt-1' : 'mt-3';
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${bubbleSpacing}`}>
                        <div className={`max-w-[78%] rounded-[1.75rem] px-4 py-3 shadow-sm border ${mine ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800'} ${entry.groupedWithPrev ? 'rounded-tl-xl' : ''} ${entry.groupedWithNext ? 'rounded-bl-xl' : ''}`}>
                          {!entry.groupedWithPrev && (
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-75">
                                {mine ? 'You' : (message.senderName || message.senderEmail || 'Member')}
                              </span>
                              <span className="text-[10px] font-semibold opacity-60 whitespace-nowrap">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                          {entry.groupedWithPrev && (
                            <div className="flex items-center justify-end gap-3 mb-2">
                              <span className="text-[10px] font-semibold opacity-60 whitespace-nowrap">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                          {replySource && (
                            <div className={`mb-3 p-3 rounded-2xl text-xs border ${mine ? 'bg-white/10 border-white/10 text-white/80' : 'bg-slate-50 dark:bg-slate-800/70 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300'}`}>
                              <p className="font-black uppercase tracking-widest text-[9px] mb-1 opacity-70">
                                Replying to {replySource.senderName || replySource.senderEmail || 'message'}
                              </p>
                              <p className="line-clamp-2 whitespace-pre-wrap break-words">{replySource.text}</p>
                            </div>
                          )}
                          {message.text && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                          )}
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

              <form onSubmit={handleSendMessage} className="shrink-0 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
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
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      placeholder="Write a message..."
                      rows={2}
                      className="w-full resize-none rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[56px]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || (!messageDraft.trim() && pendingAttachments.length === 0)}
                    className="h-12 inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 rounded-2xl bg-primary-500 text-white font-bold disabled:opacity-50"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  Attachments up to {(attachmentLimitBytes / (1024 * 1024)).toFixed(0)} MB for your plan.
                </p>
              </form>
              <AnimatePresence>
                {roomDetailsOpen && activeRoom && (
                  <motion.aside
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-0 right-0 bottom-0 z-20 w-full max-w-[22rem] border-l border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                  >
                    <div className="h-full flex flex-col min-h-0">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Room details</p>
                          <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white truncate">{getRoomTitle(activeRoom)}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{activeRoomLiveSummary}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGroupRoom && (
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById('chat-add-members')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isActiveRoomAdmin ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                            >
                              {isActiveRoomAdmin ? 'Add' : 'View'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRoomDetailsOpen(false)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                          >
                            <PanelRightClose size={16} />
                          </button>
                        </div>
                      </div>

                      {isGroupRoom && (
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Group tools</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isActiveRoomAdmin ? 'Manage members and invite access' : 'View members'}
                              </p>
                            </div>
                            {isActiveRoomAdmin && (
                              <div className="flex flex-wrap gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={handleCreateInviteLink}
                                  disabled={inviteLinkState.loading}
                                  className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-primary-500 text-white disabled:opacity-50"
                                >
                                  Invite link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('chat-add-members')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                  className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                >
                                  Add members
                                </button>
                              </div>
                            )}
                          </div>
                          {isActiveRoomAdmin && (
                            <div className="mt-3 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invite URL</p>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {inviteLinkState.copied ? 'Copied' : 'Ready'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  readOnly
                                  value={activeRoomInviteLink || 'Click Invite link to generate a shareable URL'}
                                  className="flex-1 min-w-0 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-300 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleCopyInviteLink}
                                  disabled={!activeRoomInviteLink}
                                  className="px-3 py-2 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar chat-scrollbar chat-panel-surface p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Members</p>
                            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{getRoomMemberCount(activeRoom)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Online</p>
                            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{activeRoomOnlineCount}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">About</p>
                          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                              {activeRoom.roomType === 'direct' ? <MessageSquare size={14} /> : <Users size={14} />}
                              {activeRoom.roomType === 'direct' ? 'Private direct thread' : 'Group chat room'}
                            </div>
                            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                              <p>Created {formatTime(activeRoom.createdAt)}</p>
                              <p>Last active {getRoomLastActivity(activeRoom)}</p>
                              <p>{activeRoom.contextLabel || 'No linked context'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Members</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {activeRoomMemberProfiles.length} loaded
                            </span>
                          </div>
                          <div className="space-y-2">
                            {activeRoomMemberProfiles.map((member) => {
                              const status = getMemberStatus(member);
                              const [bgColor, fgColor] = getAvatarColor(member.email || member.name || member.id || '');
                              const memberEmail = FirestoreService.normalizeChatEmail(member.email);
                              const isAdminMember = activeRoomAdminEmails.includes(memberEmail);
                              const actionPending = memberActionPending === `promote:${memberEmail}` || memberActionPending === `remove:${memberEmail}`;
                              return (
                                <div
                                  key={member.id || member.uid || member.email}
                                  className="rounded-[1.35rem] border border-slate-200/70 bg-white/80 p-3.5 shadow-sm shadow-slate-950/[0.03] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/65"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                      style={{ backgroundColor: bgColor, color: fgColor }}
                                    >
                                      {member.name ? getInitials(member.name) : getInitials(member.email)}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <p className="min-w-0 truncate text-sm font-black text-slate-900 dark:text-white">
                                          {member.name || member.email || 'Member'}
                                        </p>
                                        {member.id === user?.id && (
                                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                                            You
                                          </span>
                                        )}
                                        {isAdminMember && (
                                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                            Admin
                                          </span>
                                        )}
                                      </div>

                                      <div className="space-y-1">
                                        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                                          {member.email || 'No email'}
                                        </p>
                                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                          {getMemberLastSeen(member)}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getMemberStatusTone(member)}`}>
                                          {status}
                                        </span>

                                        {isActiveRoomAdmin && memberEmail && memberEmail !== currentEmail && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handlePromoteMember(member)}
                                              disabled={actionPending || isAdminMember}
                                              className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
                                            >
                                              {isAdminMember ? 'Promoted' : 'Promote'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveMember(member)}
                                              disabled={actionPending}
                                              className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                            >
                                              Remove
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
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
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {roomType === 'direct' ? 'New direct message' : 'Create chat room'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {roomType === 'direct'
                    ? 'Start a private 1:1 chat that feels more like WhatsApp and less like a group room.'
                    : 'Invite people by email and optionally link the room to one of your study items. Use direct message for a private 1:1 chat.'}
                </p>
              </div>

              <form onSubmit={handleCreateRoom} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Room type</label>
                  <select
                    value={roomType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setRoomType(nextType);
                      if (nextType === 'direct') {
                        setRoomTitle('');
                        setContextType('general');
                        setContextId('');
                      }
                    }}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {roomType === 'direct' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Their email</label>
                      <input
                        value={memberEmails}
                        onChange={(e) => setMemberEmails(e.target.value)}
                        placeholder="friend@example.com"
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                      />
                      <p className={`text-[11px] ${directInviteError ? 'text-rose-500' : 'text-slate-400'}`}>
                        {directInviteError || 'Start a 1:1 conversation with one other person. You will always be included.'}
                      </p>
                    </div>

                    {recentContacts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Quick pick</label>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent contacts</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentContacts.map((contact) => (
                            <button
                              key={contact.email}
                              type="button"
                              onClick={() => setMemberEmails(contact.email)}
                              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-left hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                            >
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                                {contact.email}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {contact.roomType === 'direct' ? 'Direct chat' : contact.roomTitle}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Room title</label>
                      <input
                        value={roomTitle}
                        onChange={(e) => setRoomTitle(e.target.value)}
                        placeholder="Project Phoenix, Calculus Group, etc."
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                      />
                      <p className="text-[11px] text-slate-400">
                        Optional, but helpful when you have multiple group chats.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Invite emails</label>
                      <textarea
                        value={memberEmails}
                        onChange={(e) => setMemberEmails(e.target.value)}
                        placeholder="friend@example.com, teammate@example.com"
                        rows={4}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-300 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-[11px] ${groupInviteError ? 'text-rose-500' : 'text-slate-400'}`}>
                          {groupInviteError || 'Separate emails with commas or new lines. You will always be included.'}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {groupInviteCount} invite{groupInviteCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Member preview</label>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-[11px] font-bold">
                            You
                          </span>
                          {invitedEmails.length === 0 ? (
                            <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-400">
                              Add people to see them here
                            </span>
                          ) : (
                            invitedEmails.map((email) => (
                              <span
                                key={email}
                                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                              >
                                {email}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

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
                  </>
                )}

                {roomType !== 'direct' && selectedContextMeta && (
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
                    disabled={creating || !canCreateRoom}
                    className="px-5 py-3 rounded-2xl bg-primary-500 text-white font-bold disabled:opacity-50"
                  >
                    {roomType === 'direct' ? 'Start Chat' : 'Create Room'}
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
