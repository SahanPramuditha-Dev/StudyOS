import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Youtube, Play, Bookmark, Trash2, CheckCircle2,
  Clock, FileText, History, TrendingUp, Edit3, Search,
  Check, X, Tag, Download, Calendar, ChevronDown,
  Loader2, BarChart2, ArrowUpDown, Keyboard, Timer,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import {
  toggleSelectionId, toggleSelectAll,
  softArchiveByIds, restoreByIds, hardDeleteByIds,
} from '../../utils/entityOps';
import { videoCompletedNotification } from '../../utils/notificationBuilders';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import { useReminders } from '../../context/ReminderContext';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TAG_COLORS = [
  { id: 'sky',    bg: 'bg-sky-100 dark:bg-sky-500/20',      text: 'text-sky-700 dark:text-sky-300',      dot: 'bg-sky-500'    },
  { id: 'green',  bg: 'bg-green-100 dark:bg-green-500/20',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500'  },
  { id: 'amber',  bg: 'bg-amber-100 dark:bg-amber-500/20',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500'  },
  { id: 'rose',   bg: 'bg-rose-100 dark:bg-rose-500/20',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-500'   },
  { id: 'violet', bg: 'bg-violet-100 dark:bg-violet-500/20',text: 'text-violet-700 dark:text-violet-300',dot: 'bg-violet-500' },
  { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-500/20',text: 'text-orange-700 dark:text-orange-300',dot: 'bg-orange-500' },
];

const SORT_OPTIONS = [
  { value: 'dateAdded', label: 'Date Added'  },
  { value: 'title',     label: 'Title A–Z'   },
  { value: 'progress',  label: 'Progress'    },
  { value: 'watchTime', label: 'Watch Time'  },
  { value: 'duration',  label: 'Duration'    },
];

const SHORTCUTS = [
  { key: 'B',   desc: 'Quick bookmark at current position' },
  { key: 'N',   desc: 'Open take-note modal'               },
  { key: 'Esc', desc: 'Close the active video'             },
  { key: '?',   desc: 'Show / hide this shortcuts panel'   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const extractYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
};

const getEmbedUrl = (video) => {
  if (!video) return null;
  const vid = (video.videoId?.length === 11 ? video.videoId : null) || extractYouTubeId(video.url);
  if (!vid) return null;
  const p = new URLSearchParams({
    enablejsapi: '1', modestbranding: '1', rel: '0',
    controls: '1', fs: '1', origin: window.location.origin,
  });
  // Only resume if meaningfully into the video and not near the end
  const safeStart = video.duration > 0
    ? Math.min(video.lastPosition, video.duration - 10)
    : video.lastPosition;
  if (safeStart > 5) p.set('start', String(Math.floor(safeStart)));
  return `https://www.youtube.com/embed/${vid}?${p.toString()}`;
};

const fetchVideoMeta = async (url) => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) return null;
    const d = await r.json();
    return {
      title: d.title,
      thumbnail: d.thumbnail_url || `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      author: d.author_name || null,
    };
  } catch { return null; }
};

const formatTime = (s) => {
  if (!s || s <= 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  return `${m}:${sec.toString().padStart(2,'0')}`;
};

const formatDuration = (s) => {
  if (!s || s <= 0) return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec > 0 ? sec + 's' : ''}`.trim();
  return `${sec}s`;
};

const formatWatchTime = (s) => {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Slugify a string for filenames
const slugify = (str) =>
  str.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

// Compute efficiency: ratio of watch-time actually advancing vs total time spent
const computeEfficiency = (video) => {
  const logs = video.playbackLogs || [];
  if (!logs.length || !video.duration) return null;
  const totalSessionTime = logs.reduce((a, l) => a + (l.duration || 0), 0);
  if (!totalSessionTime) return null;
  // unique progress made = progress% of total duration
  const progressSecs = (video.progress / 100) * video.duration;
  const eff = Math.min(100, Math.round((progressSecs / totalSessionTime) * 100));
  return `${eff}%`;
};

// ─────────────────────────────────────────────────────────────────────────────
// TagChip sub-component
// ─────────────────────────────────────────────────────────────────────────────

const TagChip = ({ tag, onRemove }) => {
  const c = TAG_COLORS.find(x => x.id === tag.color) || TAG_COLORS[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${c.bg} ${c.text}`}>
      {tag.name}
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(tag.id); }} className="opacity-60 hover:opacity-100 leading-none">
          <X size={10} />
        </button>
      )}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DurationBadge — shows "watched / total" when duration is known
// ─────────────────────────────────────────────────────────────────────────────

const DurationBadge = ({ video }) => {
  if (!video.duration) return (
    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
      <Clock size={10} /> {formatTime(video.totalWatchTime)}
    </span>
  );
  return (
    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1" title={`Watched ${formatTime(video.totalWatchTime)} of ${formatDuration(video.duration)}`}>
      <Clock size={10} />
      <span>{formatTime(video.totalWatchTime)}</span>
      <span className="opacity-50">/ {formatDuration(video.duration)}</span>
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const Videos = () => {
  // Storage
  const [videos, setVideos]         = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [courses]                   = useStorage(STORAGE_KEYS.COURSES, []);
  const [projects]                  = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [resources, setResources]   = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [globalTags, setGlobalTags] = useStorage('VIDEO_TAGS', []);
  const { addNotification }         = useReminders();

  // Active video
  const [activeVideoId, setActiveVideoId] = useState(null);
  const activeVideo = useMemo(() => videos.find(v => v.id === activeVideoId), [videos, activeVideoId]);

  // Modals / panels
  const [isModalOpen,       setIsModalOpen]      = useState(false);
  const [isNoteModalOpen,   setIsNoteModalOpen]   = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryOpen,     setIsHistoryOpen]     = useState(false);
  const [isShortcutsOpen,   setIsShortcutsOpen]   = useState(false);
  const [isTagManagerOpen,  setIsTagManagerOpen]  = useState(false);
  const [tagManagerVideo,   setTagManagerVideo]   = useState(null);
  const [showExportMenu,    setShowExportMenu]    = useState(false);
  const [showArchived,      setShowArchived]      = useState(false);
  const [confirmConfig,     setConfirmConfig]     = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });

  // Filters / sort
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTag,    setFilterTag]    = useState('all');
  const [sortBy,       setSortBy]       = useState('dateAdded');

  // Player (DO NOT TOUCH PLAYER LOGIC)
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Editing
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [noteForm,        setNoteForm]        = useState('');
  const [videoToDelete,   setVideoToDelete]   = useState(null);

  // Tags
  const [newTagName,  setNewTagName]  = useState('');
  const [newTagColor, setNewTagColor] = useState('sky');

  // Add video modal
  const [modalForm,      setModalForm]      = useState({ url: '', title: '', courseId: '', projectId: '' });
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchedMeta,    setFetchedMeta]    = useState(null);
  const [urlError,       setUrlError]       = useState('');

  // Bulk
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);
  const [bulkCourseId,     setBulkCourseId]     = useState('');

  // Refs — DO NOT MODIFY (player depends on these)
  const iframeRef        = useRef(null);
  const sessionStartRef  = useRef(null);
  const watchIntervalRef = useRef(null);
  const activeVideoIdRef = useRef(activeVideoId);
  const exportMenuRef    = useRef(null);
  // Ref for latest activeVideo so keyboard handler always has fresh data
  const activeVideoRef   = useRef(activeVideo);

  useEffect(() => { activeVideoIdRef.current = activeVideoId; }, [activeVideoId]);
  useEffect(() => { activeVideoRef.current = activeVideo; }, [activeVideo]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = videos.filter(v => !v.archived);
    const completed  = active.filter(v => v.completed).length;
    const inProgress = active.filter(v => !v.completed && v.progress > 0).length;
    const totalWatchTime = active.reduce((a, v) => a + (v.totalWatchTime || 0), 0);

    const daySet = new Set();
    active.forEach(v => (v.playbackLogs || []).forEach(l => {
      if (l.startTime) daySet.add(l.startTime.split('T')[0]);
    }));

    // FIX: streak counts consecutive days ending today (or yesterday if today has no watch)
    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (daySet.has(key)) streak++;
      else if (i === 0) continue; // today not watched yet — check yesterday before breaking
      else break;
    }

    const courseSecs = {};
    active.forEach(v => {
      if (v.courseId) courseSecs[v.courseId] = (courseSecs[v.courseId] || 0) + (v.totalWatchTime || 0);
    });
    const topId = Object.entries(courseSecs).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Total library duration (sum of known durations)
    const totalDuration = active.reduce((a, v) => a + (v.duration || 0), 0);

    return {
      total: active.length, completed, inProgress,
      totalWatchTime, streak, totalDuration,
      topCourse: courses.find(c => c.id === topId),
    };
  }, [videos, courses]);

  const heatmapData = useMemo(() => {
    const map = {};
    videos.forEach(v => (v.playbackLogs || []).forEach(l => {
      if (l.startTime) {
        const k = new Date(l.startTime).toISOString().split('T')[0];
        map[k] = (map[k] || 0) + (l.duration || 0);
      }
    }));
    return map;
  }, [videos]);

  const heatmapGrid = useMemo(() => {
    const WEEKS = 12;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(today.getDate() - WEEKS * 7 + 1);
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (__, d) => {
        const date = new Date(start); date.setDate(start.getDate() + w * 7 + d);
        const key  = date.toISOString().split('T')[0];
        const mins = Math.round((heatmapData[key] || 0) / 60);
        const level = mins === 0 ? 0 : mins < 5 ? 1 : mins < 15 ? 2 : mins < 30 ? 3 : 4;
        return { key, mins, level, isToday: key === today.toISOString().split('T')[0], date };
      })
    );
  }, [heatmapData]);

  const heatColors = [
    'bg-slate-100 dark:bg-slate-800',
    'bg-primary-100 dark:bg-primary-900/40',
    'bg-primary-200 dark:bg-primary-700/60',
    'bg-primary-400',
    'bg-primary-500',
  ];

  const continueWatching = useMemo(() =>
    videos.filter(v => !v.archived && !v.completed && v.progress > 0 && v.progress < 90)
      .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched)).slice(0, 4),
  [videos]);

  const filteredVideos = useMemo(() => {
    let list = videos.filter(v => {
      if (!showArchived && v.archived) return false;
      if (showArchived && !v.archived) return false; // when showing archived, hide non-archived
      const q = searchQuery.toLowerCase();
      if (q && !v.title.toLowerCase().includes(q)) return false;
      if (filterCourse !== 'all' && v.courseId !== filterCourse) return false;
      if (filterStatus === 'completed'  && !v.completed) return false;
      if (filterStatus === 'inProgress' && (v.completed || v.progress === 0)) return false;
      if (filterStatus === 'notStarted' && v.progress > 0) return false;
      if (filterTag !== 'all' && !(v.tagIds || []).includes(filterTag)) return false;
      return true;
    });

    // When not in archived view, show all non-archived
    if (!showArchived) {
      list = videos.filter(v => {
        if (v.archived) return false;
        const q = searchQuery.toLowerCase();
        if (q && !v.title.toLowerCase().includes(q)) return false;
        if (filterCourse !== 'all' && v.courseId !== filterCourse) return false;
        if (filterStatus === 'completed'  && !v.completed) return false;
        if (filterStatus === 'inProgress' && (v.completed || v.progress === 0)) return false;
        if (filterStatus === 'notStarted' && v.progress > 0) return false;
        if (filterTag !== 'all' && !(v.tagIds || []).includes(filterTag)) return false;
        return true;
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'title')     return a.title.localeCompare(b.title);
      if (sortBy === 'progress')  return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'watchTime') return (b.totalWatchTime || 0) - (a.totalWatchTime || 0);
      if (sortBy === 'duration')  return (b.duration || 0) - (a.duration || 0);
      return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
    });
  }, [videos, showArchived, searchQuery, filterCourse, filterStatus, filterTag, sortBy]);

  // ── YouTube postMessage (DO NOT TOUCH iframe) ─────────────────────────────

  const ytCmd = useCallback((func, args = '') => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  }, []);

  useEffect(() => {
    const onMsg = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      let data; try { data = JSON.parse(event.data); } catch { return; }
      const vid = activeVideoIdRef.current; if (!vid) return;
      if (data.event === 'onReady') iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
      if (data.event === 'onStateChange') setIsPlaying(data.info === 1);
      if (data.event === 'infoDelivery' && data.info) {
        const { currentTime, duration } = data.info;
        if (currentTime !== undefined && duration > 0) {
          const progress = Math.round((currentTime / duration) * 100);
          let completedTitle = null;
          setVideos(prev => prev.map(v => {
            if (v.id !== vid) return v;
            const done = progress >= 90;
            if (done && !v.completed && !v.completionNotified) completedTitle = v.title;
            return {
              ...v,
              lastPosition: currentTime,
              duration: duration, // ← FIX: capture real duration from player
              progress: Math.max(v.progress || 0, progress),
              completed: v.completed || done,
              completionNotified: v.completionNotified || done,
              lastWatched: new Date().toISOString(),
            };
          }));
          if (completedTitle) addNotification(videoCompletedNotification(completedTitle, 'reached'));
        }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [setVideos, addNotification]);

  // ── Watch-time accumulator ────────────────────────────────────────────────

  useEffect(() => {
    clearInterval(watchIntervalRef.current);
    if (isPlaying && activeVideoId) {
      watchIntervalRef.current = setInterval(() => {
        setVideos(prev => prev.map(v =>
          v.id === activeVideoId ? { ...v, totalWatchTime: (v.totalWatchTime || 0) + 1 } : v
        ));
      }, 1000);
    }
    return () => clearInterval(watchIntervalRef.current);
  }, [isPlaying, activeVideoId, setVideos]);

  // ── Session tracking ──────────────────────────────────────────────────────

  useEffect(() => {
    if (isPlaying && activeVideo && !sessionStartRef.current) {
      sessionStartRef.current = {
        startTime: new Date().toISOString(),
        startPosition: activeVideo.lastPosition || 0,
        speed: playbackRate,
      };
    } else if (!isPlaying && sessionStartRef.current) {
      const dur = (new Date() - new Date(sessionStartRef.current.startTime)) / 1000;
      if (dur > 5 && activeVideoId) {
        const log = { ...sessionStartRef.current, endTime: new Date().toISOString(), duration: dur };
        setVideos(prev => prev.map(v =>
          v.id === activeVideoId
            ? { ...v, playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50) }
            : v
        ));
      }
      sessionStartRef.current = null;
    }
    return () => {
      if (sessionStartRef.current && activeVideoIdRef.current) {
        const dur = (new Date() - new Date(sessionStartRef.current.startTime)) / 1000;
        if (dur > 5) {
          const log = { ...sessionStartRef.current, endTime: new Date().toISOString(), duration: dur };
          setVideos(prev => prev.map(v =>
            v.id === activeVideoIdRef.current
              ? { ...v, playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50) }
              : v
          ));
        }
        sessionStartRef.current = null;
      }
    };
  }, [isPlaying, activeVideoId, activeVideo, playbackRate, setVideos]);

  // ── Reset on video switch ─────────────────────────────────────────────────

  useEffect(() => {
    // Reset player state asynchronously to avoid cascading renders
    requestAnimationFrame(() => {
      setIsPlaying(false);
    });
    clearInterval(watchIntervalRef.current);
  }, [activeVideoId]);

  // ── Playback rate → iframe ────────────────────────────────────────────────

  useEffect(() => { ytCmd('setPlaybackRate', [playbackRate]); }, [playbackRate, ytCmd]);

  // ── Keyboard shortcuts — FIX: use ref so never stale ─────────────────────

  useEffect(() => {
    const handler = (e) => {
      const t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      if (e.key === '?') { setIsShortcutsOpen(p => !p); return; }
      const av = activeVideoRef.current;
      if (!av) return;
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); handleAddBookmarkRef.current(); }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); handleAddBookmarkRef.current('PROMPT_USER'); }
      if (e.key === 'Escape') setActiveVideoId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // empty deps — uses refs to stay fresh without re-registering

  // ── Auto-fetch meta on URL paste ──────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    
    const resetState = () => {
      setFetchedMeta(null);
      setUrlError('');
      setIsFetchingMeta(false);
    };

    if (!modalForm.url) {
      resetState();
      return;
    }
    
    const id = extractYouTubeId(modalForm.url);
    if (modalForm.url.length > 10 && !id) {
      queueMicrotask(() => {
        if (!cancelled) setUrlError('Doesn\'t look like a valid YouTube URL');
      });
      return;
    }
    
    if (!id) return;
    
    queueMicrotask(() => setIsFetchingMeta(true));
    const t = setTimeout(async () => {
      if (cancelled) return;
      try {
        const meta = await fetchVideoMeta(modalForm.url);
        if (!cancelled) {
          setIsFetchingMeta(false);
          if (meta) {
            setFetchedMeta(meta);
            setModalForm(p => ({ ...p, title: p.title || meta.title }));
          } else {
            setUrlError('Couldn\'t fetch video info — title auto-fill unavailable');
          }
        }
      } catch {
        if (!cancelled) {
          setIsFetchingMeta(false);
          setUrlError('Fetch failed');
        }
      }
    }, 700);
    
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [modalForm.url]);

  // ── Close export menu on outside click ───────────────────────────────────

  useEffect(() => {
    const h = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setShowExportMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const updateVideoData = (id, data) =>
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));

  const clearSelection         = () => setSelectedVideoIds([]);
  const toggleVideoSelection   = (id) => setSelectedVideoIds(prev => toggleSelectionId(prev, id));
  const toggleSelectAllVisible = (ids) => setSelectedVideoIds(prev => toggleSelectAll(prev, ids));

  const handleAddVideo = (e) => {
    e.preventDefault();
    const videoId = extractYouTubeId(modalForm.url);
    if (!videoId) { toast.error('Please enter a valid YouTube URL'); return; }
    if (videos.some(v => v.url === modalForm.url && !v.archived)) {
      toast.error('Already in tracker'); return;
    }
    const newVideo = {
      id: nanoid(), videoId: videoId || nanoid(), url: modalForm.url,
      courseId: modalForm.courseId, projectId: modalForm.projectId,
      title: modalForm.title || fetchedMeta?.title || `Video ${videos.length + 1}`,
      thumbnail: fetchedMeta?.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ''),
      author: fetchedMeta?.author || null,
      completed: false, progress: 0, duration: 0, lastPosition: 0, totalWatchTime: 0,
      addedAt: new Date().toISOString(), lastWatched: new Date().toISOString(),
      bookmarks: [], playbackLogs: [], archived: false, completionNotified: false,
      tagIds: [], videoNotes: '',
    };
    const newRes = {
      id: nanoid(), name: newVideo.title, url: newVideo.url, type: 'Video',
      associatedType: modalForm.courseId ? 'Course' : modalForm.projectId ? 'Project' : 'None',
      associatedId: modalForm.courseId || modalForm.projectId,
      createdAt: new Date().toISOString(),
    };
    if (newRes.associatedType !== 'None') setResources(prev => [...prev, newRes]);
    setVideos([newVideo, ...videos]);
    setModalForm({ url: '', title: '', courseId: '', projectId: '' });
    setFetchedMeta(null); setUrlError(''); setIsModalOpen(false);
    toast.success('Video added to learning queue!');
  };

  const handleSeek = (seconds) => { ytCmd('seekTo', [seconds, true]); ytCmd('playVideo'); };

  // FIX: use ref so keyboard shortcut always gets fresh activeVideo
  const handleAddBookmark = useCallback((note = '') => {
    const av = activeVideoRef.current;
    if (!av) return;
    const time = av.lastPosition || 0;
    if (note === 'PROMPT_USER') {
      ytCmd('pauseVideo');
      setEditingBookmark({ time, isNew: true }); setNoteForm(''); setIsNoteModalOpen(true);
      return;
    }
    const bm = { id: nanoid(), time, note: note || 'Knowledge Bookmark', createdAt: new Date().toISOString() };
    setVideos(prev => prev.map(v =>
      v.id === av.id
        ? { ...v, bookmarks: [...(v.bookmarks || []), bm].sort((a, b) => a.time - b.time) }
        : v
    ));
    toast.success(`Bookmarked at ${formatTime(time)}`);
  }, [ytCmd, setVideos]);

  // Store latest handleAddBookmark in ref for keyboard handler — FIXED: ref holds stable callback, no mutation needed
  const handleAddBookmarkRef = useRef(handleAddBookmark);

  const handleSaveNote = (e) => {
    e.preventDefault(); if (!activeVideo) return;
    if (editingBookmark.isNew) {
      const bm = { id: nanoid(), time: editingBookmark.time, note: noteForm, createdAt: new Date().toISOString() };
      updateVideoData(activeVideo.id, {
        bookmarks: [...(activeVideo.bookmarks || []), bm].sort((a, b) => a.time - b.time),
      });
    } else {
      updateVideoData(activeVideo.id, {
        bookmarks: activeVideo.bookmarks.map(b => b.id === editingBookmark.id ? { ...b, note: noteForm } : b),
      });
    }
    setIsNoteModalOpen(false); setEditingBookmark(null); setNoteForm('');
    ytCmd('playVideo'); toast.success('Note saved!');
  };

  const handleDeleteVideo = (id) => { setVideoToDelete(id); setIsDeleteModalOpen(true); };
  const confirmDeleteVideo = () => {
    if (!videoToDelete) return;
    setVideos(videos.map(v =>
      v.id === videoToDelete ? { ...v, archived: true, updatedAt: new Date().toISOString() } : v
    ));
    if (activeVideoId === videoToDelete) setActiveVideoId(null);
    setVideoToDelete(null); toast.success('Video archived');
  };

  const toggleComplete = (video) => {
    const next = !video.completed;
    updateVideoData(video.id, { completed: next, completionNotified: next });
    toast.success(next ? 'Video marked as completed!' : 'Video marked as in-progress');
    if (next) addNotification(videoCompletedNotification(video.title));
  };

  // Tags
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const tag = { id: nanoid(), name: newTagName.trim(), color: newTagColor };
    setGlobalTags(prev => [...prev, tag]);
    setNewTagName(''); setNewTagColor('sky');
    toast.success(`Tag "${tag.name}" created`);
  };

  const handleAddTagToVideo    = (vid, tid) =>
    setVideos(prev => prev.map(v => v.id === vid ? { ...v, tagIds: [...new Set([...(v.tagIds||[]), tid])] } : v));
  const handleRemoveTagFromVideo = (vid, tid) =>
    setVideos(prev => prev.map(v => v.id === vid ? { ...v, tagIds: (v.tagIds||[]).filter(id => id !== tid) } : v));
  const handleDeleteGlobalTag  = (tid) => {
    setGlobalTags(prev => prev.filter(t => t.id !== tid));
    setVideos(prev => prev.map(v => ({ ...v, tagIds: (v.tagIds||[]).filter(id => id !== tid) })));
  };

  // Export
  const exportBookmarksMarkdown = () => {
    const secs = videos.filter(v => !v.archived && v.bookmarks?.length).map(v => {
      const lines = v.bookmarks.map(b => `- **${formatTime(b.time)}** — ${b.note}`).join('\n');
      const notes = v.videoNotes ? `\n\n> ${v.videoNotes}` : '';
      const dur   = v.duration ? ` (${formatDuration(v.duration)})` : '';
      return `## ${v.title}${dur}\n\n${lines}${notes}`;
    });
    if (!secs.length) { toast.error('No bookmarks to export'); return; }
    const md = `# Video Bookmarks\n\nExported ${new Date().toLocaleDateString()}\n\n${secs.join('\n\n---\n\n')}`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })),
      download: 'video-bookmarks.md',
    });
    a.click(); toast.success('Bookmarks exported'); setShowExportMenu(false);
  };

  // FIX: CSV now includes startPosition from session log (was undefined before)
  const exportHistoryCSV = () => {
    const rows = [['Video','Author','Date','Duration (s)','Start Position (s)','End Position (s)','Speed']];
    videos.forEach(v =>
      (v.playbackLogs || []).forEach(l => rows.push([
        `"${v.title.replace(/"/g, '""')}"`,
        `"${(v.author || '').replace(/"/g, '""')}"`,
        l.startTime?.split('T')[0] || '',
        Math.round(l.duration || 0),
        Math.round(l.startPosition || 0),
        Math.round((l.startPosition || 0) + (l.duration || 0) * (l.speed || 1)),
        l.speed || 1,
      ]))
    );
    if (rows.length < 2) { toast.error('No history to export'); return; }
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })),
      download: 'watch-history.csv',
    });
    a.click(); toast.success('History exported'); setShowExportMenu(false);
  };

  // Bulk
  const applyBulkAssignCourse = () => {
    if (!selectedVideoIds.length) return;
    const s = new Set(selectedVideoIds);
    setVideos(p => p.map(v => s.has(v.id) ? { ...v, courseId: bulkCourseId, updatedAt: new Date().toISOString() } : v));
    toast.success(`Assigned ${selectedVideoIds.length}`); clearSelection();
  };
  const applyBulkMarkComplete = (done) => {
    if (!selectedVideoIds.length) return;
    const s = new Set(selectedVideoIds);
    setVideos(p => p.map(v => s.has(v.id) ? { ...v, completed: done, completionNotified: done, updatedAt: new Date().toISOString() } : v));
    toast.success(`${done ? 'Completed' : 'Reopened'} ${selectedVideoIds.length}`); clearSelection();
  };
  const applyBulkArchive = () => {
    if (!selectedVideoIds.length) return;
    setVideos(p => softArchiveByIds(p, selectedVideoIds));
    if (selectedVideoIds.includes(activeVideoId)) setActiveVideoId(null);
    toast.success(`Archived ${selectedVideoIds.length}`); clearSelection();
  };
  const applyBulkRestore = () => {
    if (!selectedVideoIds.length) return;
    setVideos(p => restoreByIds(p, selectedVideoIds));
    toast.success(`Restored ${selectedVideoIds.length}`); clearSelection();
  };
  const applyBulkHardDelete = () => {
    if (!selectedVideoIds.length) return;
    setConfirmConfig({
      isOpen: true, title: 'Delete Videos Permanently',
      message: `Permanently delete ${selectedVideoIds.length} video(s)? This cannot be undone.`,
      onConfirm: () => {
        setVideos(p => hardDeleteByIds(p, selectedVideoIds));
        if (selectedVideoIds.includes(activeVideoId)) setActiveVideoId(null);
        toast.success(`Deleted ${selectedVideoIds.length}`); clearSelection();
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Videos',  value: stats.total,                        color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Completed',     value: stats.completed,                    color: 'text-green-500' },
          { label: 'In Progress',   value: stats.inProgress,                   color: 'text-primary-500' },
          { label: 'Total Watch',   value: formatWatchTime(stats.totalWatchTime), color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Day Streak 🔥', value: `${stats.streak}d`,                color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <PageHeader
          title="Video Tracker"
          description="Turn watch time into learning progress"
          icon={<Youtube size={28} />}
          iconClassName="bg-red-50 dark:bg-red-500/10 text-red-500"
        />

        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none"
              placeholder="Search library..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* History */}
          <button onClick={() => setIsHistoryOpen(true)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-500 transition-all" title="Watch history">
            <BarChart2 size={18} />
          </button>

          {/* Export */}
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(p => !p)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-500 transition-all flex items-center gap-1" title="Export">
              <Download size={18} /><ChevronDown size={13} />
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity:0, y:6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:6, scale:0.97 }}
                  className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <button onClick={exportBookmarksMarkdown} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3">
                    <FileText size={16} className="text-primary-500" /> Bookmarks (Markdown)
                  </button>
                  <button onClick={exportHistoryCSV} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                    <Calendar size={16} className="text-primary-500" /> History (CSV)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shortcuts */}
          <button onClick={() => setIsShortcutsOpen(true)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-500 transition-all" title="Keyboard shortcuts (?)">
            <Keyboard size={18} />
          </button>

          {/* Tag manager */}
          <button onClick={() => setIsTagManagerOpen(true)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-500 transition-all" title="Manage tags">
            <Tag size={18} />
          </button>

          {/* Archived toggle — shows count */}
          <button
            onClick={() => { setShowArchived(p => !p); clearSelection(); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'
            }`}
          >
            {showArchived
              ? 'Back to Library'
              : `Archived${videos.filter(v => v.archived).length > 0 ? ` (${videos.filter(v => v.archived).length})` : ''}`}
          </button>

          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all shadow-xl shadow-primary-500/20 flex items-center gap-2">
            <Plus size={20} /> Add Video
          </button>
        </div>

        {/* Row 2: filters + sort */}
        <div className="flex flex-wrap items-center gap-3">
          <select className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-sm font-bold text-slate-600 dark:text-slate-300" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-sm font-bold text-slate-600 dark:text-slate-300" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="notStarted">Not Started</option>
            <option value="inProgress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {globalTags.length > 0 && (
            <select className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-sm font-bold text-slate-600 dark:text-slate-300" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
              <option value="all">All Tags</option>
              {globalTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {/* Active filter pills */}
          {(searchQuery || filterCourse !== 'all' || filterStatus !== 'all' || filterTag !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setFilterCourse('all'); setFilterStatus('all'); setFilterTag('all'); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-sm font-bold text-slate-600 dark:text-slate-300" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {/* Result count */}
          <span className="text-xs text-slate-400 font-medium">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Bulk Bar ──────────────────────────────────────────────────────── */}
      {selectedVideoIds.length > 0 && (
        <BulkActionBar selectedCount={selectedVideoIds.length} onSelectVisible={() => toggleSelectAllVisible(filteredVideos.map(v => v.id))} onClear={clearSelection}>
          <select value={bulkCourseId} onChange={e => setBulkCourseId(e.target.value)} className="px-2 py-1 rounded-lg text-xs">
            <option value="">No Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button onClick={applyBulkAssignCourse} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Assign course</button>
          <button onClick={() => applyBulkMarkComplete(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">Complete</button>
          <button onClick={() => applyBulkMarkComplete(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">Reopen</button>
          {/* FIX: Only show Restore when in archived view */}
          {showArchived && (
            <button onClick={applyBulkRestore} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Restore</button>
          )}
          <button onClick={applyBulkArchive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Archive</button>
          <button onClick={applyBulkHardDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white">Hard delete</button>
        </BulkActionBar>
      )}

      {/* ── Continue Watching ─────────────────────────────────────────────── */}
      {!activeVideo && !showArchived && continueWatching.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Play size={12} className="text-primary-500" /> Continue Watching
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {continueWatching.map(video => (
              <button
                key={video.id}
                onClick={() => setActiveVideoId(video.id)}
                title={video.title}
                className="flex-shrink-0 w-48 text-left group card p-3 hover:border-primary-300 dark:hover:border-primary-600 transition-all border-2 border-transparent"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 mb-2">
                  {video.thumbnail
                    ? <img src={video.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                    : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Youtube size={20} className="text-slate-600" /></div>
                  }
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                    <div className="h-full bg-primary-500" style={{ width: `${video.progress}%` }} />
                  </div>
                  {/* Time remaining if duration known */}
                  {video.duration > 0 && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white flex items-center gap-1">
                      <Timer size={8} />
                      {formatTime(video.duration * (1 - video.progress / 100))} left
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-primary-500 transition-colors">{video.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{video.progress}% watched</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 ${activeVideo ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 transition-all duration-500`}>

        {/* ── Library ───────────────────────────────────────────────────── */}
        <div className={`${activeVideo ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6 order-2 lg:order-1`}>

          {/* Archived view header */}
          {showArchived && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <AlertCircle size={14} />
              Showing archived videos — select and use "Restore" to bring them back.
            </div>
          )}

          <div className={`grid gap-4 ${!activeVideo ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredVideos.map(video => {
              const videoTags = (video.tagIds || []).map(id => globalTags.find(t => t.id === id)).filter(Boolean);
              return (
                <motion.div layout key={video.id}
                  onClick={() => { if (video.archived) return; setActiveVideoId(video.id === activeVideoId ? null : video.id); }}
                  className={`group relative card p-3 cursor-pointer transition-all border-2 ${
                    activeVideo?.id === video.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/5'
                      : video.archived
                        ? 'border-transparent opacity-60 cursor-default'
                        : 'border-transparent hover:border-slate-100 dark:hover:border-slate-800'
                  }`}
                >
                  <button
                    onClick={e => { e.stopPropagation(); toggleVideoSelection(video.id); }}
                    className={`absolute z-10 top-3 left-3 w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-black transition-all ${
                      selectedVideoIds.includes(video.id)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white/90 border-slate-300 text-transparent'
                    }`}
                  >✓</button>

                  <div className={`flex ${!activeVideo ? 'flex-col' : 'gap-4'} h-full`}>
                    <div className={`relative ${!activeVideo ? 'aspect-video mb-3' : 'w-32 h-20'} rounded-xl overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center`}>
                      {video.thumbnail
                        ? <img src={video.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                        : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center opacity-80"><Youtube size={32} className="text-slate-700" /></div>
                      }
                      {!video.archived && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Play size={20} className="text-white fill-white" />
                          </div>
                        </div>
                      )}
                      {video.completed && (
                        <div className="absolute top-2 right-2 p-1 rounded-lg bg-green-500 text-white shadow-lg"><Check size={12} strokeWidth={3} /></div>
                      )}
                      {video.archived && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-black text-white uppercase tracking-widest">Archived</span>
                        </div>
                      )}
                      {/* Duration overlay */}
                      {video.duration > 0 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-black text-white">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-500 transition-colors flex-1" title={video.title}>
                          {video.title}
                        </h4>
                        {activeVideo && !video.archived && (
                          <button onClick={e => { e.stopPropagation(); handleDeleteVideo(video.id); }} className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[100px]">
                          {courses.find(c => c.id === video.courseId)?.title || projects.find(p => p.id === video.projectId)?.name || 'Standalone'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <DurationBadge video={video} />
                      </div>
                      {videoTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {videoTags.map(tag => <TagChip key={tag.id} tag={tag} />)}
                        </div>
                      )}
                      {!activeVideo && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" title={`${video.progress}% complete`}>
                            <div
                              className={`h-full transition-all duration-1000 ${video.completed ? 'bg-green-500' : 'bg-primary-500'}`}
                              style={{ width: `${video.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{video.progress}%</span>
                          {!video.archived && (
                            <>
                              <button onClick={e => { e.stopPropagation(); setTagManagerVideo(video); }} className="p-1 rounded-md text-slate-300 hover:text-primary-500 transition-all" title="Tags"><Tag size={12} /></button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteVideo(video.id); }} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={14} /></button>
                            </>
                          )}
                          {video.archived && (
                            <button onClick={e => { e.stopPropagation(); setVideos(p => restoreByIds(p, [video.id])); toast.success('Restored'); }} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700">Restore</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filteredVideos.length === 0 && (
            <EmptyState compact icon={<Youtube size={32} />}
              title={showArchived ? 'No archived videos' : 'No videos found'}
              description={showArchived ? 'Archive a video to see it here.' : 'Try adjusting your filters or add a new video.'}
            />
          )}
        </div>

        {/* ── Focused Player View ───────────────────────────────────────── */}
        {activeVideo && (
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {/* ── iframe – DO NOT TOUCH ── */}
            <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl relative ring-4 ring-white dark:ring-slate-900">
              {(() => {
                const embedUrl = getEmbedUrl(activeVideo);
                if (!embedUrl) return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-center p-6">
                    <Youtube size={48} className="mb-4 text-red-500 opacity-50" />
                    <p className="font-bold text-white mb-2">Invalid Video Link</p>
                    <p className="text-sm max-w-sm">Please remove it and add a valid YouTube URL.</p>
                  </div>
                );
                return (
                  <iframe
                    key={activeVideo.id} ref={iframeRef} src={embedUrl} title={activeVideo.title}
                    width="100%" height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen className="absolute top-0 left-0 w-full h-full" style={{ border: 'none' }}
                  />
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Info panel */}
              <div className="md:col-span-2 space-y-6">
                <div className="card p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${activeVideo.completed ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                          {activeVideo.completed ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[200px]">
                          {courses.find(c => c.id === activeVideo.courseId)?.title || projects.find(p => p.id === activeVideo.projectId)?.name || 'Standalone'}
                        </span>
                        {activeVideo.author && (
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 truncate max-w-[200px]">
                            {activeVideo.author}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{activeVideo.title}</h3>
                      {(activeVideo.tagIds || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(activeVideo.tagIds || []).map(tid => {
                            const tag = globalTags.find(t => t.id === tid);
                            return tag ? <TagChip key={tid} tag={tag} onRemove={() => handleRemoveTagFromVideo(activeVideo.id, tid)} /> : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setTagManagerVideo(activeVideo)} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all" title="Tags"><Tag size={20} /></button>
                      <button onClick={() => toggleComplete(activeVideo)} className={`p-3 rounded-2xl transition-all ${activeVideo.completed ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-green-500'}`}><CheckCircle2 size={24} /></button>
                      <button onClick={() => handleDeleteVideo(activeVideo.id)} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={24} /></button>
                      <button onClick={() => setActiveVideoId(null)} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all" title="Close (Esc)"><X size={24} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-8">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                      <p className="text-xl font-black text-primary-500">{activeVideo.progress}%</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Watched</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-200">{formatTime(activeVideo.totalWatchTime)}</p>
                    </div>
                    {/* FIX: Show real duration if known */}
                    <div className="text-center space-y-1 border-r border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-200">
                        {activeVideo.duration > 0 ? formatDuration(activeVideo.duration) : '—'}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</p>
                      <select
                        className="bg-transparent border-none text-xl font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer p-0 w-full text-center"
                        value={playbackRate}
                        onChange={e => setPlaybackRate(parseFloat(e.target.value))}
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                          <option key={r} value={r} className="text-sm font-bold dark:bg-slate-900">{r}x</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => handleAddBookmark()} className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2">
                      <Bookmark size={20} /> Quick Bookmark <span className="opacity-50 text-xs ml-1">B</span>
                    </button>
                    <button onClick={() => handleAddBookmark('PROMPT_USER')} className="px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-bold transition-all flex items-center gap-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <FileText size={20} /> Take Note <span className="opacity-50 text-xs ml-1">N</span>
                    </button>
                  </div>
                </div>

                {/* Analytics — FIX: real efficiency, no hardcoded 88% */}
                <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <div className="flex items-center gap-2 mb-6 text-primary-400"><TrendingUp size={20} /><h4 className="text-sm font-black uppercase tracking-widest">Playback Analytics</h4></div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        l: 'Avg. Speed',
                        v: activeVideo.playbackLogs?.length > 0
                          ? (activeVideo.playbackLogs.reduce((a, l) => a + (l.speed || 1), 0) / activeVideo.playbackLogs.length).toFixed(2) + 'x'
                          : '1.0x',
                      },
                      { l: 'Sessions', v: activeVideo.playbackLogs?.length || 0 },
                      { l: 'Status',   v: activeVideo.completed ? 'Mastered' : 'Learning' },
                      {
                        l: 'Efficiency',
                        v: computeEfficiency(activeVideo) ?? 'N/A',
                        title: 'Ratio of unique progress made vs total time invested',
                      },
                    ].map(s => (
                      <div key={s.l} className="space-y-1" title={s.title}>
                        <p className="text-[10px] font-black text-slate-500 uppercase">{s.l}</p>
                        <p className="text-xl font-black">{s.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side panel */}
              <div className="space-y-4">
                {/* Bookmarks */}
                <div className="card flex flex-col p-6" style={{ maxHeight: '400px' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <History size={18} className="text-primary-500" /> Bookmarks
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400">{activeVideo.bookmarks?.length || 0}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {activeVideo.bookmarks?.map(b => (
                      <div key={b.id} className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => handleSeek(b.time)}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-primary-500 font-black text-[10px] shadow-sm hover:bg-primary-500 hover:text-white transition-all"
                            title={`Jump to ${formatTime(b.time)}`}
                          >{formatTime(b.time)}</button>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingBookmark(b); setNoteForm(b.note); setIsNoteModalOpen(true); }} className="p-1 text-slate-400 hover:text-primary-500"><Edit3 size={14} /></button>
                            <button onClick={() => updateVideoData(activeVideo.id, { bookmarks: activeVideo.bookmarks.filter(i => i.id !== b.id) })} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{b.note}</p>
                      </div>
                    ))}
                    {!activeVideo.bookmarks?.length && (
                      <div className="py-8 text-center opacity-50">
                        <Bookmark size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400 italic">No timestamps yet</p>
                        <p className="text-[10px] text-slate-400 mt-1">Press B to quick-bookmark</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-video notes */}
                <div className="card p-6">
                  <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-primary-500" /> Video Notes
                  </h4>
                  <textarea
                    className="w-full h-28 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white resize-none text-sm"
                    placeholder="Personal notes about this video..."
                    value={activeVideo.videoNotes || ''}
                    onChange={e => updateVideoData(activeVideo.id, { videoNotes: e.target.value })}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { if (!activeVideo.videoNotes) return; navigator.clipboard.writeText(activeVideo.videoNotes); toast.success('Copied!'); }}
                      disabled={!activeVideo.videoNotes}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >Copy notes</button>
                    <button
                      onClick={() => {
                        const bms = (activeVideo.bookmarks || []).map(b => `${formatTime(b.time)}: ${b.note}`).join('\n');
                        const full = (activeVideo.videoNotes || '') + (bms ? '\n\n--- Bookmarks ---\n' + bms : '');
                        if (!full.trim()) { toast.error('Nothing to export'); return; }
                        const a = Object.assign(document.createElement('a'), {
                          href: URL.createObjectURL(new Blob([`# ${activeVideo.title}\n\n${full}`], { type: 'text/markdown' })),
                          download: `${slugify(activeVideo.title)}-notes.md`,
                        });
                        a.click(); toast.success('Exported!');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary-500 transition-all flex items-center justify-center gap-1"
                    ><Download size={12} /> Export .md</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modals ══════════════════════════════════════════════════════════ */}

      {/* Bookmark note modal */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsNoteModalOpen(false); ytCmd('playVideo'); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-500"><FileText size={20} /></div>
                <div>
                  <h3 className="font-black dark:text-white">{editingBookmark?.isNew ? 'New Timestamp Note' : 'Edit Note'}</h3>
                  <p className="text-[10px] font-bold text-primary-500 uppercase">AT {formatTime(editingBookmark?.time)}</p>
                </div>
              </div>
              <form onSubmit={handleSaveNote} className="p-6 space-y-4">
                <textarea
                  autoFocus required rows={4}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white resize-none"
                  placeholder="What are you learning at this moment?"
                  value={noteForm}
                  onChange={e => setNoteForm(e.target.value)}
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setIsNoteModalOpen(false); ytCmd('playVideo'); }} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all">Save Note</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add video modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsModalOpen(false); setFetchedMeta(null); setUrlError(''); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Add New Video</h2>
                <button onClick={() => { setIsModalOpen(false); setFetchedMeta(null); setUrlError(''); }} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddVideo} className="p-8 space-y-6">
                {fetchedMeta && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                    <img src={fetchedMeta.thumbnail} alt="" className="w-16 h-10 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-0.5">Auto-fetched ✓</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{fetchedMeta.title}</p>
                      {fetchedMeta.author && <p className="text-[10px] text-slate-400 truncate">{fetchedMeta.author}</p>}
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YouTube URL</label>
                    <div className="relative">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                      <input
                        required
                        className={`w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 transition-all dark:text-white outline-none ${
                          urlError ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900'
                        }`}
                        placeholder="https://youtube.com/watch?v=..."
                        value={modalForm.url}
                        onChange={e => setModalForm({ ...modalForm, url: e.target.value })}
                      />
                      {isFetchingMeta && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={18} />}
                    </div>
                    {urlError && (
                      <p className="text-xs text-rose-500 flex items-center gap-1 ml-1">
                        <AlertCircle size={12} /> {urlError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Title (Optional)</label>
                    <input
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
                      placeholder={fetchedMeta?.title || 'e.g. Advanced React Hooks Masterclass'}
                      value={modalForm.title}
                      onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link to Course or Project</label>
                    <div className="grid grid-cols-2 gap-4">
                      <select className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 outline-none transition-all dark:text-white font-bold" value={modalForm.courseId} onChange={e => setModalForm({ ...modalForm, courseId: e.target.value, projectId: '' })}>
                        <option value="">No Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <select className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 outline-none transition-all dark:text-white font-bold" value={modalForm.projectId} onChange={e => setModalForm({ ...modalForm, projectId: e.target.value, courseId: '' })}>
                        <option value="">No Project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!!urlError || isFetchingMeta}
                  className="w-full py-5 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={24} strokeWidth={3} /> Add to Library
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {isShortcutsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShortcutsOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black dark:text-white flex items-center gap-2"><Keyboard size={18} className="text-primary-500" /> Keyboard Shortcuts</h3>
                <button onClick={() => setIsShortcutsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-4">
                {SHORTCUTS.map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{s.desc}</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{s.key}</kbd>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 italic">Active when a video is open and focus is not in a text field.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global tag manager modal */}
      <AnimatePresence>
        {isTagManagerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTagManagerOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black dark:text-white flex items-center gap-2"><Tag size={18} className="text-primary-500" /> Manage Tags</h3>
                <button onClick={() => setIsTagManagerOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Create New Tag</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white"
                      placeholder="Tag name..."
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                    />
                    <button onClick={handleCreateTag} disabled={!newTagName.trim()} className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-all disabled:opacity-40">Add</button>
                  </div>
                  <div className="flex gap-2">
                    {TAG_COLORS.map(c => (
                      <button key={c.id} onClick={() => setNewTagColor(c.id)} className={`w-7 h-7 rounded-full ${c.dot} transition-all ${newTagColor === c.id ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'opacity-60 hover:opacity-100'}`} title={c.id} />
                    ))}
                  </div>
                  {newTagName && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Preview:</span>
                      <TagChip tag={{ id: 'preview', name: newTagName, color: newTagColor }} />
                    </div>
                  )}
                </div>
                {globalTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Existing Tags ({globalTags.length})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {globalTags.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <TagChip tag={tag} />
                          <span className="text-xs text-slate-400">{videos.filter(v => (v.tagIds || []).includes(tag.id)).length} videos</span>
                          <button onClick={() => handleDeleteGlobalTag(tag.id)} className="p-1 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Per-video tag assignment modal */}
      <AnimatePresence>
        {tagManagerVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTagManagerVideo(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-black dark:text-white">Assign Tags</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[220px]">{tagManagerVideo.title}</p>
                </div>
                <button onClick={() => setTagManagerVideo(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-3">
                {globalTags.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <Tag size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No tags yet.</p>
                    <button onClick={() => { setTagManagerVideo(null); setIsTagManagerOpen(true); }} className="mt-2 text-primary-500 text-sm font-bold hover:underline">Create tags →</button>
                  </div>
                ) : globalTags.map(tag => {
                  // FIX: read live from videos state, not stale tagManagerVideo
                  const liveVideo = videos.find(v => v.id === tagManagerVideo.id);
                  const assigned  = (liveVideo?.tagIds || []).includes(tag.id);
                  return (
                    <button key={tag.id}
                      onClick={() => {
                        if (assigned) handleRemoveTagFromVideo(tagManagerVideo.id, tag.id);
                        else          handleAddTagToVideo(tagManagerVideo.id, tag.id);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${assigned ? 'border-primary-300 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                    >
                      <TagChip tag={tag} />
                      {assigned && <Check size={16} className="text-primary-500" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Watch history + heatmap modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black dark:text-white flex items-center gap-2"><Calendar size={22} className="text-primary-500" /> Watch History</h2>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Sessions', value: videos.reduce((a, v) => a + (v.playbackLogs?.length || 0), 0) },
                    { label: 'Total Watch',    value: formatWatchTime(stats.totalWatchTime) },
                    { label: 'Day Streak',     value: `${stats.streak} days` },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-xl font-black text-primary-500">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Heatmap — FIX: proper label alignment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Activity — Last 12 Weeks</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>Less</span>
                      {heatColors.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
                      <span>More</span>
                    </div>
                  </div>
                  <div className="flex gap-1 overflow-x-auto">
                    {heatmapGrid.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-1">
                        {week.map(day => (
                          <div
                            key={day.key}
                            title={`${day.key}${day.mins > 0 ? `: ${day.mins} min watched` : ': no activity'}`}
                            className={`w-3.5 h-3.5 rounded-sm transition-all cursor-default ${heatColors[day.level]} ${day.isToday ? 'ring-1 ring-primary-500 ring-offset-1' : ''}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* FIX: aligned month labels — one per 4 weeks */}
                  <div className="flex text-[9px] text-slate-400">
                    {heatmapGrid.map((week, wi) => {
                      const d = week[0].date;
                      const isMonthStart = d.getDate() <= 7;
                      return (
                        <div key={wi} className="w-3.5 shrink-0 mr-1">
                          {isMonthStart && <span>{d.toLocaleDateString('en', { month: 'short' })}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Most-watched course */}
                {stats.topCourse && (
                  <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 flex items-center gap-3">
                    <TrendingUp size={20} className="text-primary-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Most Watched Course</p>
                      <p className="font-black text-slate-800 dark:text-white">{stats.topCourse.title}</p>
                    </div>
                  </div>
                )}

                {/* Recent sessions — FIX: uses correct fields */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Sessions</p>
                  <div className="space-y-2">
                    {videos
                      .flatMap(v => (v.playbackLogs || []).map(l => ({ ...l, videoTitle: v.title, videoAuthor: v.author })))
                      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                      .slice(0, 8)
                      .map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[280px]">{l.videoTitle}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(l.startTime).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {l.startPosition > 0 && ` · from ${formatTime(l.startPosition)}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{formatWatchTime(l.duration || 0)}</p>
                            <p className="text-[10px] text-slate-400">{l.speed || 1}x speed</p>
                          </div>
                        </div>
                      ))}
                    {videos.every(v => !v.playbackLogs?.length) && (
                      <p className="text-sm text-slate-400 text-center py-4 italic">No sessions recorded yet. Start watching!</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm modals */}
      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteVideo} title="Remove Video" message="Archive this video and its learning data?" confirmText="Archive" type="danger" />
      <ConfirmModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} onConfirm={() => { confirmConfig.onConfirm(); setConfirmConfig(p => ({ ...p, isOpen: false })); }} title={confirmConfig.title} message={confirmConfig.message} confirmText="Delete" type="danger" />
    </div>
  );
};

export default Videos;