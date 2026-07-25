import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, MessageSquare, Users, Hash, Pin, 
  VolumeX, CheckCheck, ChevronDown, ChevronRight, Sparkles,
  MessageCircle, MoreVertical, FolderKanban, BookOpen, Layers, Archive
} from 'lucide-react';

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

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
};

export const ConversationList = ({
  rooms = [],
  activeRoomId,
  setActiveRoomId,
  roomSearch,
  setRoomSearch,
  openCreateRoom,
  currentEmail,
  userProfilesByEmail = {},
  isRoomUnread,
  presenceByUid,
  typingByUid,
  getDirectPeerEmail,
  getRoomTitle,
  setMobilePanel
}) => {
  const [collapsedSections, setCollapsedSections] = useState({
    pinned: false,
    direct: false,
    study: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const { pinnedRooms, directRooms, studyRooms } = useMemo(() => {
    const pinned = [];
    const direct = [];
    const study = [];

    filteredRooms.forEach((room) => {
      if (room.isPinned) {
        pinned.push(room);
      } else if (room.roomType === 'direct') {
        direct.push(room);
      } else {
        study.push(room);
      }
    });

    return { pinnedRooms: pinned, directRooms: direct, studyRooms: study };
  }, [filteredRooms]);

  const totalUnreadCount = useMemo(() => {
    return rooms.filter(r => isRoomUnread(r)).length;
  }, [rooms, isRoomUnread]);

  const renderRoomItem = (room) => {
    const isActive = room.id === activeRoomId;
    const isUnread = isRoomUnread(room);
    const title = getRoomTitle(room);
    const peerEmail = room.roomType === 'direct' ? getDirectPeerEmail(room) : '';
    const peerProfile = userProfilesByEmail[peerEmail] || null;
    const roomAvatar = room.avatarUrl || peerProfile?.avatar || null;
    const lastTime = formatRelativeTime(room.lastMessageAt);
    
    // Check if anyone in this room is typing
    const isTyping = Object.values(typingByUid || {}).some(
      t => t?.state === 'typing' && t?.email !== currentEmail && room.memberEmails?.includes(t?.email)
    );

    const [bgColor, textColor] = getAvatarColor(peerEmail || title);

    return (
      <motion.button
        key={room.id}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setActiveRoomId(room.id);
          if (setMobilePanel) setMobilePanel('chat');
        }}
        className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
          isActive
            ? 'bg-primary-500/20 text-white font-bold shadow-sm border border-primary-500/40'
            : isUnread
            ? 'bg-slate-800/90 text-white font-bold border border-slate-700/80 hover:bg-slate-800'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
        }`}
      >
        {/* Active Indicator Strip */}
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-r-full" />
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          {roomAvatar ? (
            <img src={roomAvatar} alt={title} className="w-9 h-9 rounded-xl object-cover shadow-inner border border-primary-500/30" />
          ) : (
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {room.roomType === 'direct' ? (
                getInitials(peerEmail || title)
              ) : (
                <Hash size={16} />
              )}
            </div>
          )}

          {/* Room Type badge */}
          {room.contextType && room.contextType !== 'general' && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-white dark:border-slate-900 flex items-center justify-center text-[9px] text-white">
              {room.contextType === 'project' && <FolderKanban size={10} />}
              {room.contextType === 'assignment' && <BookOpen size={10} />}
              {room.contextType === 'note' && <Layers size={10} />}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="truncate text-xs font-bold leading-tight">
              {title}
            </span>
            {lastTime && (
              <span className={`text-[10px] shrink-0 font-medium ${isUnread ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-400'}`}>
                {lastTime}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1">
            {isTyping ? (
              <span className="text-[11px] text-amber-500 font-medium italic animate-pulse">
                typing...
              </span>
            ) : (
              <p className={`truncate text-[11px] leading-snug ${isUnread ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                {room.lastMessage || 'No messages yet'}
              </p>
            )}

            {/* Badges / Unread */}
            <div className="flex items-center gap-1 shrink-0">
              {isUnread && (
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 dark:bg-slate-900/90 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold">
              <MessageSquare size={16} />
            </div>
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              Conversations
            </h2>
            {totalUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                {totalUnreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openCreateRoom('direct')}
              title="New Direct Message"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageCircle size={16} />
            </button>
            <button
              onClick={() => openCreateRoom('group')}
              title="New Study Room"
              className="p-1.5 rounded-lg bg-primary-500 text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            placeholder="Search channels & DMs..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
          />
          {roomSearch && (
            <button
              onClick={() => setRoomSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Room Groups List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
        {/* Pinned Rooms */}
        {pinnedRooms.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('pinned')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <Pin size={12} className="text-amber-500" />
                Pinned ({pinnedRooms.length})
              </span>
              {collapsedSections.pinned ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
            {!collapsedSections.pinned && (
              <div className="mt-1 space-y-0.5">
                {pinnedRooms.map(renderRoomItem)}
              </div>
            )}
          </div>
        )}

        {/* Direct Messages */}
        <div>
          <button
            onClick={() => toggleSection('direct')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <Users size={12} />
              Direct Messages ({directRooms.length})
            </span>
            {collapsedSections.direct ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
          {!collapsedSections.direct && (
            <div className="mt-1 space-y-0.5">
              {directRooms.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-slate-400 italic">No direct messages yet</p>
              ) : (
                directRooms.map(renderRoomItem)
              )}
            </div>
          )}
        </div>

        {/* Study Rooms */}
        <div>
          <button
            onClick={() => toggleSection('study')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <Hash size={12} />
              Study Rooms ({studyRooms.length})
            </span>
            {collapsedSections.study ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
          {!collapsedSections.study && (
            <div className="mt-1 space-y-0.5">
              {studyRooms.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-slate-400 italic">No study rooms created</p>
              ) : (
                studyRooms.map(renderRoomItem)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;
