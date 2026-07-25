import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Paperclip, Pin, Sparkles, X, UserPlus, 
  Shield, Copy, Link, Check, Trash2, FolderKanban, CheckSquare,
  Settings as SettingsIcon, Camera, Edit3, Image as ImageIcon, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FirestoreService } from '../../../services/firestore';
import { uploadRoomAvatar } from '../../../services/chatMedia';

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

export const RoomDetailsPanel = ({
  activeRoom,
  activeRoomMemberProfiles = [],
  currentEmail,
  user,
  isActiveRoomAdmin,
  isGroupRoom,
  setRoomDetailsOpen,
  groupMemberDraft,
  setGroupMemberDraft,
  handleAddGroupMembers,
  addingGroupMembers,
  handleCreateInviteLink,
  handleCopyInviteLink,
  inviteLinkState,
  handlePromoteMember,
  handleRemoveMember,
  pinnedMessages = [],
  allMessages = [],
  onOrionAiAssistant
}) => {
  const [activeTab, setActiveTab] = useState('members');
  const [editTitle, setEditTitle] = useState(activeRoom?.title || '');
  const [editDescription, setEditDescription] = useState(activeRoom?.description || '');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarInputRef = useRef(null);

  if (!activeRoom) return null;

  const sharedFiles = allMessages.flatMap(m => m.attachments || []);

  const handleSaveRoomSettings = async (e) => {
    e.preventDefault();
    if (!activeRoom || !isActiveRoomAdmin) return;
    try {
      setUpdatingSettings(true);
      await FirestoreService.updateChatRoomSettings(activeRoom.id, {
        title: editTitle.trim() || activeRoom.title,
        description: editDescription.trim()
      });
      toast.success('Room settings updated');
    } catch (error) {
      toast.error('Failed to update room settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom || !user?.id) return;
    try {
      setUploadingAvatar(true);
      const avatarUrl = await uploadRoomAvatar({ file, userId: user.id, roomId: activeRoom.id });
      await FirestoreService.updateChatRoomSettings(activeRoom.id, { avatarUrl });
      toast.success('Room icon updated!');
    } catch (error) {
      toast.error('Failed to upload room icon');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom || !isActiveRoomAdmin) return;
    if (!window.confirm(`Are you sure you want to delete "${activeRoom.title}"? This action cannot be undone.`)) return;
    try {
      await FirestoreService.deleteChatRoom(activeRoom.id);
      toast.success('Room deleted');
      setRoomDetailsOpen(false);
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="w-80 lg:w-96 flex flex-col h-full bg-white/95 dark:bg-slate-900/95 border-l border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-md z-20 select-none"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Room Details
        </h3>
        <button
          onClick={() => setRoomDetailsOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={16} />
        </button>
      </div>

      {/* Hidden File Input for Room Avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-1">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'members'
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users size={12} /> Members ({activeRoomMemberProfiles.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'files'
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Paperclip size={12} /> Files ({sharedFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('pins')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'pins'
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Pin size={12} /> Pins ({pinnedMessages.length})
        </button>
        {isGroupRoom && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SettingsIcon size={12} /> Settings
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Invite Link / Add Members */}
            {isGroupRoom && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserPlus size={14} className="text-primary-500" /> Add Members to Group
                </p>
                <form onSubmit={handleAddGroupMembers} className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={groupMemberDraft}
                    onChange={(e) => setGroupMemberDraft(e.target.value)}
                    placeholder="Enter emails (comma separated)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={addingGroupMembers || !groupMemberDraft.trim()}
                    className="w-full py-1.5 rounded-xl bg-primary-500 text-white text-xs font-bold disabled:opacity-40"
                  >
                    {addingGroupMembers ? 'Adding...' : 'Add Members'}
                  </button>
                </form>

                {isActiveRoomAdmin && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={inviteLinkState.value ? handleCopyInviteLink : handleCreateInviteLink}
                      className="w-full py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {inviteLinkState.copied ? <Check size={12} /> : <Link size={12} />}
                      {inviteLinkState.value ? (inviteLinkState.copied ? 'Invite Link Copied!' : 'Copy Invite Link') : 'Generate Invite Link'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Member List */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Room Members ({activeRoomMemberProfiles.length})
              </p>

              {activeRoomMemberProfiles.map((member) => {
                const email = member.email || '';
                const name = member.name || email;
                const isAdmin = activeRoom.roomAdminEmails?.includes(email) || activeRoom.createdByEmail === email;
                const userAvatar = member.avatar || null;
                const [avatarBg, avatarText] = getAvatarColor(email);

                return (
                  <div 
                    key={email}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {userAvatar ? (
                        <img src={userAvatar} alt={name} className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm" />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: avatarBg, color: avatarText }}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold flex items-center gap-0.5">
                          <Shield size={10} /> Admin
                        </span>
                      )}
                      {isActiveRoomAdmin && email !== currentEmail && !isAdmin && (
                        <button
                          onClick={() => handlePromoteMember(member)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-xs"
                          title="Promote to admin"
                        >
                          <Shield size={12} />
                        </button>
                      )}
                      {isActiveRoomAdmin && email !== currentEmail && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs"
                          title="Remove from room"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Shared Media & Documents ({sharedFiles.length})
            </p>
            {sharedFiles.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No files shared in this room yet.</p>
            ) : (
              sharedFiles.map((file, i) => (
                <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={14} className="text-primary-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-300 text-[10px] font-bold hover:bg-primary-500/20"
                  >
                    Open
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* PINS TAB */}
        {activeTab === 'pins' && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pinned Messages ({pinnedMessages.length})
            </p>
            {pinnedMessages.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No pinned messages in this room.</p>
            ) : (
              pinnedMessages.map((pm) => (
                <div key={pm.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <p className="font-bold text-amber-700 dark:text-amber-300">{pm.senderName || pm.senderEmail}</p>
                  <p className="text-slate-800 dark:text-slate-200">{pm.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && isGroupRoom && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="relative group">
                {activeRoom.avatarUrl ? (
                  <img src={activeRoom.avatarUrl} alt={activeRoom.title} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500 shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                    <Hash size={28} />
                  </div>
                )}
                {isActiveRoomAdmin && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-2xl bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold transition-opacity"
                  >
                    <Camera size={16} />
                    {uploadingAvatar ? 'Uploading...' : 'Change Icon'}
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">{activeRoom.title}</p>
              <p className="text-[10px] text-slate-400">Group Study Room</p>
            </div>

            {/* Room Title & Description Form */}
            {isActiveRoomAdmin && (
              <form onSubmit={handleSaveRoomSettings} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room Description / Topic
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a topic or guidelines for this group..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="w-full py-2 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-40"
                >
                  {updatingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            )}

            {/* Danger Zone */}
            {isActiveRoomAdmin && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                  Danger Zone
                </p>
                <button
                  onClick={handleDeleteRoom}
                  className="w-full py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete Group Room
                </button>
              </div>
            )}
          </div>
        )}

        {/* ORION AI SUMMARY ACTION BOX */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 space-y-2">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-300 font-bold text-xs">
              <Sparkles size={14} /> Orion AI Companion
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Automatically extract key takeaways, decisions, and action items from this conversation.
            </p>
            <button
              onClick={() => onOrionAiAssistant && onOrionAiAssistant('summary')}
              className="w-full py-1.5 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Generate AI Room Summary
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default RoomDetailsPanel;
