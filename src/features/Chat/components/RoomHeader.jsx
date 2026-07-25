import React from 'react';
import { motion } from 'framer-motion';
import { 
  Hash, Users, Search, Pin, Phone, Video, 
  PanelRightOpen, PanelRightClose, Sparkles, ChevronLeft,
  FolderKanban, BookOpen, Layers, Info
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

export const RoomHeader = ({
  activeRoom,
  getRoomTitle,
  getDirectPeerEmail,
  userProfilesByEmail = {},
  activeRoomOnlineCount,
  activeRoomMemberProfiles = [],
  inChatSearchOpen,
  setInChatSearchOpen,
  inChatSearchQuery,
  setInChatSearchQuery,
  roomDetailsOpen,
  setRoomDetailsOpen,
  pinnedCount = 0,
  onSummarizeClick,
  setMobilePanel
}) => {
  if (!activeRoom) return null;

  const title = getRoomTitle(activeRoom);
  const peerEmail = activeRoom.roomType === 'direct' ? getDirectPeerEmail(activeRoom) : '';
  const peerProfile = userProfilesByEmail[peerEmail] || null;
  const roomAvatar = activeRoom.avatarUrl || peerProfile?.avatar || null;
  const memberCount = activeRoom.memberEmails?.length || 0;
  const [bgColor, textColor] = getAvatarColor(peerEmail || title);

  return (
    <div className="shrink-0 h-14 px-4 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile back button & Room Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobilePanel && setMobilePanel('rooms')}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Room Avatar */}
        {roomAvatar ? (
          <img src={roomAvatar} alt={title} className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm border border-primary-500/30" />
        ) : (
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {activeRoom.roomType === 'direct' ? (
              getInitials(peerEmail || title)
            ) : (
              <Hash size={16} />
            )}
          </div>
        )}

        {/* Room Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-900 dark:text-white truncate">
              {title}
            </h1>

            {/* Context Badge */}
            {activeRoom.contextType && activeRoom.contextType !== 'general' && (
              <span className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-[10px] font-bold border border-primary-500/20 inline-flex items-center gap-1">
                {activeRoom.contextType === 'project' && <FolderKanban size={10} />}
                {activeRoom.contextType === 'assignment' && <BookOpen size={10} />}
                {activeRoom.contextType === 'note' && <Layers size={10} />}
                <span className="capitalize">{activeRoom.contextType}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {activeRoomOnlineCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeRoomOnlineCount} online
              </span>
            )}
            <span className="hidden sm:inline">
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Search inside room */}
        {inChatSearchOpen ? (
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              placeholder="Filter messages..."
              className="w-36 sm:w-48 pl-7 pr-7 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
            <Search size={12} className="absolute left-2.5 text-slate-400" />
            <button
              onClick={() => {
                setInChatSearchQuery('');
                setInChatSearchOpen(false);
              }}
              className="absolute right-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setInChatSearchOpen(true)}
            title="Search in conversation"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search size={16} />
          </button>
        )}

        {/* Orion AI Quick Summarize */}
        {onSummarizeClick && (
          <button
            onClick={onSummarizeClick}
            title="Summarize with Orion AI"
            className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-300 hover:bg-primary-500/20 text-xs font-bold flex items-center gap-1.2 transition-all"
          >
            <Sparkles size={14} className="text-primary-500" />
            <span className="hidden lg:inline">AI Summary</span>
          </button>
        )}

        {/* Voice Call (Future mock) */}
        <button
          onClick={() => alert('Voice call capability is coming soon!')}
          title="Start Voice Call (Coming soon)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Phone size={16} />
        </button>

        {/* Video Call (Future mock) */}
        <button
          onClick={() => alert('Video call capability is coming soon!')}
          title="Start Video Call (Coming soon)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Video size={16} />
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Toggle Details Panel */}
        <button
          onClick={() => setRoomDetailsOpen(!roomDetailsOpen)}
          title={roomDetailsOpen ? "Hide details panel" : "Show details panel"}
          className={`p-1.5 rounded-lg transition-colors ${
            roomDetailsOpen 
              ? 'bg-primary-500 text-white' 
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {roomDetailsOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>
    </div>
  );
};

export default RoomHeader;
