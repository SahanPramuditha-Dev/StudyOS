import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FolderPlus, 
  ListVideo, 
  Trash2, 
  Edit3, 
  Check, 
  Plus, 
  Video,
  Sparkles,
  Layers
} from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const PLAYLIST_COLORS = [
  { id: 'sky', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30' },
  { id: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  { id: 'rose', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  { id: 'indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
];

const PlaylistManagerModal = ({ 
  isOpen, 
  onClose, 
  playlists = [], 
  setPlaylists, 
  videos = [], 
  setVideos 
}) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: 'sky' });
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Playlist name is required');
      return;
    }

    const newPlaylist = {
      id: nanoid(),
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      createdAt: new Date().toISOString(),
    };

    setPlaylists(prev => [newPlaylist, ...prev]);

    // Assign selected videos
    if (selectedVideoIds.length > 0) {
      setVideos(prev => prev.map(v => {
        if (selectedVideoIds.includes(v.id)) {
          const existing = v.playlistIds || [];
          if (!existing.includes(newPlaylist.id)) {
            return { ...v, playlistIds: [...existing, newPlaylist.id] };
          }
        }
        return v;
      }));
    }

    toast.success(`Playlist "${newPlaylist.name}" created!`);
    setForm({ name: '', description: '', color: 'sky' });
    setSelectedVideoIds([]);
    setActiveTab('list');
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingPlaylist || !form.name.trim()) return;

    setPlaylists(prev => prev.map(p => 
      p.id === editingPlaylist.id 
        ? { ...p, name: form.name.trim(), description: form.description.trim(), color: form.color }
        : p
    ));

    // Update video playlist assignments
    setVideos(prev => prev.map(v => {
      const hasPlaylist = (v.playlistIds || []).includes(editingPlaylist.id);
      const isSelected = selectedVideoIds.includes(v.id);

      if (isSelected && !hasPlaylist) {
        return { ...v, playlistIds: [...(v.playlistIds || []), editingPlaylist.id] };
      } else if (!isSelected && hasPlaylist) {
        return { ...v, playlistIds: (v.playlistIds || []).filter(id => id !== editingPlaylist.id) };
      }
      return v;
    }));

    toast.success('Playlist updated!');
    setEditingPlaylist(null);
    setForm({ name: '', description: '', color: 'sky' });
    setSelectedVideoIds([]);
    setActiveTab('list');
  };

  const handleDelete = (playlistId, name) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    // Remove playlist reference from videos
    setVideos(prev => prev.map(v => ({
      ...v,
      playlistIds: (v.playlistIds || []).filter(id => id !== playlistId)
    })));
    toast.success(`Deleted playlist "${name}"`);
  };

  const startEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setForm({
      name: playlist.name,
      description: playlist.description || '',
      color: playlist.color || 'sky'
    });
    // Pre-select video IDs in this playlist
    const inPlaylist = videos.filter(v => (v.playlistIds || []).includes(playlist.id)).map(v => v.id);
    setSelectedVideoIds(inPlaylist);
    setActiveTab('edit');
  };

  const toggleVideoSelection = (vid) => {
    setSelectedVideoIds(prev => 
      prev.includes(vid) ? prev.filter(id => id !== vid) : [...prev, vid]
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <ListVideo size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Study Playlists & Modules</h2>
              <p className="text-xs text-slate-400 font-medium">Organize videos into custom learning queues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-slate-950/30">
          <button
            onClick={() => { setActiveTab('list'); setEditingPlaylist(null); }}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'list' 
                ? 'border-primary-500 text-primary-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            All Playlists ({playlists.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setEditingPlaylist(null);
              setForm({ name: '', description: '', color: 'sky' });
              setSelectedVideoIds([]);
            }}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'create' || activeTab === 'edit'
                ? 'border-primary-500 text-primary-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus size={14} />
            {activeTab === 'edit' ? 'Edit Playlist' : 'Create New'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            playlists.length === 0 ? (
              <div className="text-center py-12 px-4">
                <ListVideo size={48} className="mx-auto text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Custom Playlists Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Create your first playlist (e.g., "Python FastAPI Mastery", "Data Structures Checklist") to organize your queue.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Create Playlist
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.map(pl => {
                  const colorObj = PLAYLIST_COLORS.find(c => c.id === pl.color) || PLAYLIST_COLORS[0];
                  const inPlaylistCount = videos.filter(v => (v.playlistIds || []).includes(pl.id)).length;

                  return (
                    <div
                      key={pl.id}
                      className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-3 rounded-xl border ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}>
                          <ListVideo size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}>
                              {inPlaylistCount} {inPlaylistCount === 1 ? 'video' : 'videos'}
                            </span>
                          </div>
                          {pl.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{pl.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(pl)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit Playlist"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(pl.id, pl.name)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Playlist"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <form onSubmit={activeTab === 'edit' ? handleUpdate : handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Microservices, DS & Algo Checklist"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this module covers..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                  Color Badge Theme
                </label>
                <div className="flex gap-2">
                  {PLAYLIST_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm({ ...form, color: c.id })}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${c.bg} ${c.border} ${c.text} ${
                        form.color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {form.color === c.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Selector */}
              {videos.length > 0 && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Select Videos to Include ({selectedVideoIds.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-950/60 border border-white/10 rounded-2xl">
                    {videos.map(v => {
                      const isSelected = selectedVideoIds.includes(v.id);
                      return (
                        <div
                          key={v.id}
                          onClick={() => toggleVideoSelection(v.id)}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                            isSelected 
                              ? 'bg-primary-500/20 border border-primary-500/40 text-white' 
                              : 'bg-slate-900/40 border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Video size={14} className={isSelected ? 'text-primary-400' : 'text-slate-500'} />
                            <span className="truncate font-medium">{v.title}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary-500 border-primary-400 text-white' : 'border-slate-600'
                          }`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('list'); setEditingPlaylist(null); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                >
                  <Check size={14} />
                  {activeTab === 'edit' ? 'Save Changes' : 'Create Playlist'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PlaylistManagerModal;
