import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Youtube,
  Play,
  Bookmark,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  TrendingUp,
  Edit3,
  Search,
  Check,
  X,
  RotateCcw,
  FastForward,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import {
  toggleSelectionId,
  toggleSelectAll,
  softArchiveByIds,
  restoreByIds,
  hardDeleteByIds,
} from '../../utils/entityOps';
import { videoCompletedNotification } from '../../utils/notificationBuilders';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import { useReminders } from '../../context/ReminderContext';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
};

/**
 * Build an embed URL with enablejsapi=1 so the YouTube IFrame API
 * can receive postMessage commands and fire postMessage events back.
 * We pass `origin` to satisfy YouTube's CORS check.
 */
const getEmbedUrl = (video) => {
  if (!video) return null;

  const vid =
    (video.videoId?.length === 11 ? video.videoId : null) ||
    extractYouTubeId(video.url);

  if (!vid) return null;

  const params = new URLSearchParams({
    enablejsapi: '1',
    modestbranding: '1',
    rel: '0',
    controls: '1',
    fs: '1',
    origin: window.location.origin,
  });

  // Resume from last known position (skip if < 5 s to avoid awkward starts)
  if (video.lastPosition > 5) {
    params.set('start', String(Math.floor(video.lastPosition)));
  }

  return `https://www.youtube.com/embed/${vid}?${params.toString()}`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Videos = () => {
  const [videos, setVideos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [resources, setResources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const { addNotification } = useReminders();

  const [activeVideoId, setActiveVideoId] = useState(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    onConfirm: () => {},
    message: '',
    title: '',
  });

  const activeVideo = React.useMemo(
    () => videos.find((v) => v.id === activeVideoId),
    [videos, activeVideoId]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [noteForm, setNoteForm] = useState('');

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  // Add video modal
  const [modalForm, setModalForm] = useState({
    url: '',
    title: '',
    courseId: '',
    projectId: '',
  });

  // Refs
  const iframeRef = useRef(null);
  const sessionStartRef = useRef(null);
  const watchIntervalRef = useRef(null);
  // Keep a ref copy of activeVideoId to avoid stale closures inside the
  // global message listener (which is registered only once).
  const activeVideoIdRef = useRef(activeVideoId);
  useEffect(() => {
    activeVideoIdRef.current = activeVideoId;
  }, [activeVideoId]);

  // ---------------------------------------------------------------------------
  // YouTube IFrame API via postMessage
  // ---------------------------------------------------------------------------

  /** Send any command to the currently-active YouTube iframe. */
  const ytCmd = useCallback((func, args = '') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  }, []);

  /**
   * Single global message listener – registered once on mount.
   * YouTube fires:
   *   onReady          – player initialised
   *   onStateChange    – info: -1 unstarted | 0 ended | 1 playing | 2 paused | 3 buffering
   *   infoDelivery     – info: { currentTime, duration, playerState, ... }
   */
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;

      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      const vid = activeVideoIdRef.current;
      if (!vid) return;

      // ── Ready: subscribe to info updates ──────────────────────────────────
      if (data.event === 'onReady') {
        // 'listening' tells YouTube to start pushing infoDelivery messages
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening' }),
          '*'
        );
      }

      // ── State change ──────────────────────────────────────────────────────
      if (data.event === 'onStateChange') {
        setIsPlaying(data.info === 1);
      }

      // ── Periodic info (currentTime / duration) ────────────────────────────
      if (data.event === 'infoDelivery' && data.info) {
        const { currentTime, duration } = data.info;
        if (currentTime !== undefined && duration > 0) {
          const progress = Math.round((currentTime / duration) * 100);
          let completedTitle = null;

          setVideos((prev) =>
            prev.map((v) => {
              if (v.id !== vid) return v;
              const isCompleted = progress >= 90;
              if (isCompleted && !v.completed && !v.completionNotified) {
                completedTitle = v.title;
              }
              return {
                ...v,
                lastPosition: currentTime,
                progress: Math.max(v.progress || 0, progress),
                completed: v.completed || isCompleted,
                completionNotified: v.completionNotified || isCompleted,
                lastWatched: new Date().toISOString(),
              };
            })
          );

          if (completedTitle) {
            addNotification(videoCompletedNotification(completedTitle, 'reached'));
          }
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setVideos, addNotification]); // stable deps – no activeVideoId needed thanks to ref

  // ---------------------------------------------------------------------------
  // Watch-time accumulator (1-second ticks while playing)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    clearInterval(watchIntervalRef.current);

    if (isPlaying && activeVideoId) {
      watchIntervalRef.current = setInterval(() => {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === activeVideoId
              ? { ...v, totalWatchTime: (v.totalWatchTime || 0) + 1 }
              : v
          )
        );
      }, 1000);
    }

    return () => clearInterval(watchIntervalRef.current);
  }, [isPlaying, activeVideoId, setVideos]);

  // ---------------------------------------------------------------------------
  // Session tracking
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isPlaying && activeVideo && !sessionStartRef.current) {
      sessionStartRef.current = {
        startTime: new Date().toISOString(),
        startPosition: activeVideo.lastPosition || 0,
        speed: playbackRate,
      };
    } else if (!isPlaying && sessionStartRef.current) {
      const duration =
        (new Date() - new Date(sessionStartRef.current.startTime)) / 1000;
      if (duration > 5 && activeVideoId) {
        const log = {
          ...sessionStartRef.current,
          endTime: new Date().toISOString(),
          duration,
        };
        setVideos((prev) =>
          prev.map((v) =>
            v.id === activeVideoId
              ? {
                  ...v,
                  playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50),
                }
              : v
          )
        );
      }
      sessionStartRef.current = null;
    }

    return () => {
      // Flush session on unmount / video-switch
      if (sessionStartRef.current && activeVideoIdRef.current) {
        const duration =
          (new Date() - new Date(sessionStartRef.current.startTime)) / 1000;
        if (duration > 5) {
          const log = {
            ...sessionStartRef.current,
            endTime: new Date().toISOString(),
            duration,
          };
          setVideos((prev) =>
            prev.map((v) =>
              v.id === activeVideoIdRef.current
                ? {
                    ...v,
                    playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50),
                  }
                : v
            )
          );
        }
        sessionStartRef.current = null;
      }
    };
  }, [isPlaying, activeVideoId, activeVideo, playbackRate, setVideos]);

  // ---------------------------------------------------------------------------
  // Reset on video switch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setIsPlaying(false);
    clearInterval(watchIntervalRef.current);
    // sessionStartRef flushed by the cleanup above
  }, [activeVideoId]);

  // ---------------------------------------------------------------------------
  // Playback-rate: forward to iframe via postMessage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    ytCmd('setPlaybackRate', [playbackRate]);
  }, [playbackRate, ytCmd]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateVideoData = (id, data) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  };

  const clearSelection = () => setSelectedVideoIds([]);

  const toggleVideoSelection = (id) => {
    setSelectedVideoIds((prev) => toggleSelectionId(prev, id));
  };

  const toggleSelectAllVisible = (visibleIds) => {
    setSelectedVideoIds((prev) => toggleSelectAll(prev, visibleIds));
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    const videoId = extractYouTubeId(modalForm.url);

    const duplicate = videos.some(
      (v) => v.url === modalForm.url && v.archived !== true
    );
    if (duplicate) {
      toast.error('This video already exists in your tracker');
      return;
    }

    const newVideo = {
      id: nanoid(),
      videoId: videoId || nanoid(),
      url: modalForm.url,
      courseId: modalForm.courseId,
      projectId: modalForm.projectId,
      title: modalForm.title || `Video ${videos.length + 1}`,
      thumbnail: videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : '',
      completed: false,
      progress: 0,
      duration: 0,
      lastPosition: 0,
      totalWatchTime: 0,
      addedAt: new Date().toISOString(),
      lastWatched: new Date().toISOString(),
      bookmarks: [],
      playbackLogs: [],
      archived: false,
      completionNotified: false,
    };

    const newResource = {
      id: nanoid(),
      name: newVideo.title,
      url: newVideo.url,
      type: 'Video',
      associatedType: modalForm.courseId
        ? 'Course'
        : modalForm.projectId
        ? 'Project'
        : 'None',
      associatedId: modalForm.courseId || modalForm.projectId,
      createdAt: new Date().toISOString(),
    };
    if (newResource.associatedType !== 'None') {
      setResources((prev) => [...prev, newResource]);
    }

    setVideos([newVideo, ...videos]);
    setModalForm({ url: '', title: '', courseId: '', projectId: '' });
    setIsModalOpen(false);
    toast.success('Video added to learning queue!');
  };

  /** Seek via YouTube IFrame API postMessage. */
  const handleSeek = (seconds) => {
    ytCmd('seekTo', [seconds, true]);
    ytCmd('playVideo');
  };

  const handleAddBookmark = (note = '') => {
    const time = activeVideo?.lastPosition || 0;

    if (note === 'PROMPT_USER') {
      ytCmd('pauseVideo');
      setEditingBookmark({ time, isNew: true });
      setNoteForm('');
      setIsNoteModalOpen(true);
      return;
    }

    const newBookmark = {
      id: nanoid(),
      time,
      note: note || 'Knowledge Bookmark',
      createdAt: new Date().toISOString(),
    };

    updateVideoData(activeVideo.id, {
      bookmarks: [
        ...(activeVideo.bookmarks || []),
        newBookmark,
      ].sort((a, b) => a.time - b.time),
    });
    toast.success('Timestamp saved!');
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!activeVideo) return;

    if (editingBookmark.isNew) {
      const newBookmark = {
        id: nanoid(),
        time: editingBookmark.time,
        note: noteForm,
        createdAt: new Date().toISOString(),
      };
      updateVideoData(activeVideo.id, {
        bookmarks: [
          ...(activeVideo.bookmarks || []),
          newBookmark,
        ].sort((a, b) => a.time - b.time),
      });
    } else {
      updateVideoData(activeVideo.id, {
        bookmarks: activeVideo.bookmarks.map((b) =>
          b.id === editingBookmark.id ? { ...b, note: noteForm } : b
        ),
      });
    }

    setIsNoteModalOpen(false);
    setEditingBookmark(null);
    setNoteForm('');
    ytCmd('playVideo');
    toast.success('Note saved!');
  };

  const handleDeleteVideo = (id) => {
    setVideoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVideo = () => {
    if (!videoToDelete) return;
    setVideos(
      videos.map((v) =>
        v.id === videoToDelete
          ? { ...v, archived: true, updatedAt: new Date().toISOString() }
          : v
      )
    );
    if (activeVideoId === videoToDelete) setActiveVideoId(null);
    setVideoToDelete(null);
    toast.success('Video archived');
  };

  const toggleComplete = (video) => {
    const nextCompleted = !video.completed;
    updateVideoData(video.id, {
      completed: nextCompleted,
      completionNotified: nextCompleted,
    });
    toast.success(
      video.completed ? 'Video marked as in-progress' : 'Video marked as completed!'
    );
    if (nextCompleted) {
      addNotification(videoCompletedNotification(video.title));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0)
      return `${h}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter((v) => {
    if (!showArchived && v.archived === true) return false;
    const matchesSearch = v.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCourse =
      filterCourse === 'all' || v.courseId === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // ---------------------------------------------------------------------------
  // Bulk actions
  // ---------------------------------------------------------------------------

  const applyBulkAssignCourse = () => {
    if (!selectedVideoIds.length) return;
    const selected = new Set(selectedVideoIds);
    setVideos((prev) =>
      prev.map((v) =>
        selected.has(v.id)
          ? {
              ...v,
              courseId: bulkCourseId,
              archived: false,
              updatedAt: new Date().toISOString(),
            }
          : v
      )
    );
    toast.success(`Assigned ${selectedVideoIds.length} video(s)`);
    clearSelection();
  };

  const applyBulkMarkComplete = (completed) => {
    if (!selectedVideoIds.length) return;
    const selected = new Set(selectedVideoIds);
    setVideos((prev) =>
      prev.map((v) =>
        selected.has(v.id)
          ? {
              ...v,
              completed,
              completionNotified: completed,
              archived: false,
              updatedAt: new Date().toISOString(),
            }
          : v
      )
    );
    toast.success(
      `${completed ? 'Completed' : 'Reopened'} ${selectedVideoIds.length} video(s)`
    );
    clearSelection();
  };

  const applyBulkArchive = () => {
    if (!selectedVideoIds.length) return;
    setVideos((prev) => softArchiveByIds(prev, selectedVideoIds));
    if (selectedVideoIds.includes(activeVideoId)) setActiveVideoId(null);
    toast.success(`Archived ${selectedVideoIds.length} video(s)`);
    clearSelection();
  };

  const applyBulkRestore = () => {
    if (!selectedVideoIds.length) return;
    setVideos((prev) => restoreByIds(prev, selectedVideoIds));
    toast.success(`Restored ${selectedVideoIds.length} video(s)`);
    clearSelection();
  };

  const applyBulkHardDelete = () => {
    if (!selectedVideoIds.length) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Videos Permanently',
      message: `Permanently delete ${selectedVideoIds.length} selected video(s)? This cannot be undone.`,
      onConfirm: () => {
        setVideos((prev) => hardDeleteByIds(prev, selectedVideoIds));
        if (selectedVideoIds.includes(activeVideoId)) setActiveVideoId(null);
        toast.success(`Deleted ${selectedVideoIds.length} video(s)`);
        clearSelection();
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      {/* ── Header & Controls ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        <PageHeader
          title="Video Tracker"
          description="Turn watch time into learning progress"
          icon={<Youtube size={28} />}
          iconClassName="bg-red-50 dark:bg-red-500/10 text-red-500"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none font-bold text-sm"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowArchived((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'
            }`}
          >
            {showArchived ? 'Showing Archived' : 'Hide Archived'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all shadow-xl shadow-primary-500/20 flex items-center gap-2"
          >
            <Plus size={20} /> Add Video
          </button>
        </div>
      </div>

      {/* ── Bulk Action Bar ────────────────────────────────────────────────── */}
      {selectedVideoIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedVideoIds.length}
          onSelectVisible={() =>
            toggleSelectAllVisible(filteredVideos.map((v) => v.id))
          }
          onClear={clearSelection}
        >
          <select
            value={bulkCourseId}
            onChange={(e) => setBulkCourseId(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs"
          >
            <option value="">No Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            onClick={applyBulkAssignCourse}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700"
          >
            Assign course
          </button>
          <button
            onClick={() => applyBulkMarkComplete(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700"
          >
            Complete
          </button>
          <button
            onClick={() => applyBulkMarkComplete(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700"
          >
            Reopen
          </button>
          <button
            onClick={applyBulkRestore}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700"
          >
            Restore
          </button>
          <button
            onClick={applyBulkArchive}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700"
          >
            Archive
          </button>
          <button
            onClick={applyBulkHardDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white"
          >
            Hard delete
          </button>
        </BulkActionBar>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div
        className={`grid grid-cols-1 ${
          activeVideo ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
        } gap-8 transition-all duration-500`}
      >
        {/* ── Playlist / Library ──────────────────────────────────────────── */}
        <div
          className={`${
            activeVideo ? 'lg:col-span-1' : 'lg:col-span-3'
          } space-y-6 order-2 lg:order-1`}
        >
          <div
            className={`grid gap-4 ${
              !activeVideo ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {filteredVideos.map((video) => (
              <motion.div
                layout
                key={video.id}
                onClick={() => {
                  if (video.archived) return;
                  setActiveVideoId(video.id);
                }}
                className={`group relative card p-3 cursor-pointer transition-all border-2 ${
                  activeVideo?.id === video.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/5'
                    : 'border-transparent hover:border-slate-100 dark:hover:border-slate-800'
                }`}
              >
                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVideoSelection(video.id);
                  }}
                  className={`absolute z-10 top-3 left-3 w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-black transition-all ${
                    selectedVideoIds.includes(video.id)
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white/90 border-slate-300 text-transparent'
                  }`}
                  aria-label={`Select ${video.title}`}
                >
                  ✓
                </button>

                <div
                  className={`flex ${
                    !activeVideo ? 'flex-col' : 'gap-4'
                  } h-full`}
                >
                  {/* Thumbnail */}
                  <div
                    className={`relative ${
                      !activeVideo ? 'aspect-video mb-3' : 'w-32 h-20'
                    } rounded-xl overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center`}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                        <Youtube size={32} className="text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Play size={20} className="text-white fill-white" />
                      </div>
                    </div>
                    {video.completed && (
                      <div className="absolute top-2 right-2 p-1 rounded-lg bg-green-500 text-white shadow-lg">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    {video.archived && (
                      <div className="absolute top-2 right-10 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-black text-white uppercase tracking-widest">
                        Archived
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-black text-white">
                      {video.progress}%
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-500 transition-colors flex-1">
                        {video.title}
                      </h4>
                      {activeVideo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                          className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                          title="Remove from playlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[120px]">
                        {courses.find((c) => c.id === video.courseId)?.title ||
                          projects.find((p) => p.id === video.projectId)
                            ?.name ||
                          'Standalone'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">
                        •
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {formatTime(video.totalWatchTime)}
                      </span>
                    </div>

                    {!activeVideo && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mr-4">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              video.completed
                                ? 'bg-green-500'
                                : 'bg-primary-500'
                            }`}
                            style={{ width: `${video.progress}%` }}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <EmptyState
              compact
              icon={<Youtube size={32} />}
              title="No videos found"
              description="Try adjusting your search or add a new video."
            />
          )}
        </div>

        {/* ── Focused Player View ─────────────────────────────────────────── */}
        {activeVideo && (
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {/* Player */}
            <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl relative ring-4 ring-white dark:ring-slate-900">
              {(() => {
                const embedUrl = getEmbedUrl(activeVideo);

                if (!embedUrl) {
                  return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-center p-6">
                      <Youtube
                        size={48}
                        className="mb-4 text-red-500 opacity-50"
                      />
                      <p className="font-bold text-white mb-2">
                        Invalid Video Link
                      </p>
                      <p className="text-sm max-w-sm">
                        This URL is unsupported. Please remove it and add a
                        valid YouTube link.
                      </p>
                    </div>
                  );
                }

                return (
                  <iframe
                    key={activeVideo.id}
                    ref={iframeRef}
                    src={embedUrl}
                    title={activeVideo.title}
                    width="100%"
                    height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ border: 'none' }}
                  />
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Player Info & Actions */}
              <div className="md:col-span-2 space-y-6">
                <div className="card p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            activeVideo.completed
                              ? 'bg-green-100 text-green-600'
                              : 'bg-primary-100 text-primary-600'
                          }`}
                        >
                          {activeVideo.completed ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[200px]">
                          {courses.find(
                            (c) => c.id === activeVideo.courseId
                          )?.title ||
                            projects.find(
                              (p) => p.id === activeVideo.projectId
                            )?.name ||
                            'Standalone'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                        {activeVideo.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleComplete(activeVideo)}
                        className={`p-3 rounded-2xl transition-all ${
                          activeVideo.completed
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-green-500'
                        }`}
                        title={
                          activeVideo.completed
                            ? 'Mark Incomplete'
                            : 'Mark Complete'
                        }
                      >
                        <CheckCircle2 size={24} />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(activeVideo.id)}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
                        title="Remove Video"
                      >
                        <Trash2 size={24} />
                      </button>
                      <button
                        onClick={() => setActiveVideoId(null)}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
                        title="Close Player"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-8">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Progress
                      </p>
                      <p className="text-xl font-black text-primary-500">
                        {activeVideo.progress}%
                      </p>
                    </div>
                    <div className="text-center space-y-1 border-x border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Watch Time
                      </p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-200">
                        {formatTime(activeVideo.totalWatchTime)}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Speed
                      </p>
                      <select
                        className="bg-transparent border-none text-xl font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer p-0"
                        value={playbackRate}
                        onChange={(e) =>
                          setPlaybackRate(parseFloat(e.target.value))
                        }
                      >
                        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                          <option
                            key={rate}
                            value={rate}
                            className="text-sm font-bold dark:bg-slate-900"
                          >
                            {rate}x
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bookmark buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAddBookmark()}
                      className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
                    >
                      <Bookmark size={20} /> Quick Bookmark
                    </button>
                    <button
                      onClick={() => handleAddBookmark('PROMPT_USER')}
                      className={`px-6 py-4 rounded-2xl border-2 font-bold transition-all flex items-center gap-2 ${
                        showNotesPanel
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <FileText size={20} /> Take Note
                    </button>
                  </div>
                </div>

                {/* Analytics Snapshot */}
                <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <div className="flex items-center gap-2 mb-6 text-primary-400">
                    <TrendingUp size={20} />
                    <h4 className="text-sm font-black uppercase tracking-widest">
                      Playback Analytics
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Avg. Speed
                      </p>
                      <p className="text-xl font-black">
                        {activeVideo.playbackLogs?.length > 0
                          ? (
                              activeVideo.playbackLogs.reduce(
                                (acc, l) => acc + (l.speed || 1),
                                0
                              ) / activeVideo.playbackLogs.length
                            ).toFixed(2) + 'x'
                          : '1.0x'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Sessions
                      </p>
                      <p className="text-xl font-black">
                        {activeVideo.playbackLogs?.length || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Status
                      </p>
                      <p className="text-xl font-black">
                        {activeVideo.completed ? 'Mastered' : 'Learning'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">
                        Efficiency
                      </p>
                      <p className="text-xl font-black">
                        {activeVideo.playbackLogs?.length > 0 ? '88%' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookmarks & Notes Panel */}
              <div className="space-y-6">
                <div className="card h-full flex flex-col p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <History size={18} className="text-primary-500" />
                      Bookmarks & Notes
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400">
                      {activeVideo.bookmarks?.length || 0}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {activeVideo.bookmarks?.map((b) => (
                      <div
                        key={b.id}
                        className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => handleSeek(b.time)}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-primary-500 font-black text-[10px] shadow-sm hover:bg-primary-500 hover:text-white transition-all"
                          >
                            {formatTime(b.time)}
                          </button>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingBookmark(b);
                                setNoteForm(b.note);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-primary-500"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                updateVideoData(activeVideo.id, {
                                  bookmarks: activeVideo.bookmarks.filter(
                                    (item) => item.id !== b.id
                                  ),
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                          {b.note}
                        </p>
                      </div>
                    ))}
                    {(!activeVideo.bookmarks ||
                      activeVideo.bookmarks.length === 0) && (
                      <div className="py-12 text-center space-y-3 opacity-50">
                        <Bookmark
                          size={32}
                          className="mx-auto text-slate-300"
                        />
                        <p className="text-xs text-slate-400 italic">
                          No timestamps saved
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Note / Bookmark Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsNoteModalOpen(false);
                ytCmd('playVideo');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-black dark:text-white">
                      {editingBookmark?.isNew
                        ? 'New Timestamp Note'
                        : 'Edit Note'}
                    </h3>
                    <p className="text-[10px] font-bold text-primary-500 uppercase">
                      AT {formatTime(editingBookmark?.time)}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveNote} className="p-6 space-y-4">
                <textarea
                  autoFocus
                  required
                  rows={4}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white resize-none"
                  placeholder="What are you learning at this moment?"
                  value={noteForm}
                  onChange={(e) => setNoteForm(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNoteModalOpen(false);
                      ytCmd('playVideo');
                    }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Video Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                  Add New Video
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddVideo} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      YouTube URL
                    </label>
                    <div className="relative">
                      <Youtube
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500"
                        size={20}
                      />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
                        placeholder="https://youtube.com/watch?v=..."
                        value={modalForm.url}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, url: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Custom Title (Optional)
                    </label>
                    <input
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
                      placeholder="e.g. Advanced React Hooks Masterclass"
                      value={modalForm.title}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Link to Course or Project
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white font-bold"
                        value={modalForm.courseId}
                        onChange={(e) =>
                          setModalForm({
                            ...modalForm,
                            courseId: e.target.value,
                            projectId: '',
                          })
                        }
                      >
                        <option value="">No Course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white font-bold"
                        value={modalForm.projectId}
                        onChange={(e) =>
                          setModalForm({
                            ...modalForm,
                            projectId: e.target.value,
                            courseId: '',
                          })
                        }
                      >
                        <option value="">No Project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  <Plus size={24} strokeWidth={3} /> Add to Library
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Modals ─────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteVideo}
        title="Remove Video"
        message="Are you sure you want to delete this video and its learning data? This action cannot be undone."
        confirmText="Remove"
        type="danger"
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Videos;