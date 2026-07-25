import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Youtube,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  BarChart2,
  Search,
  X,
  Play,
  VideoOff,
  SearchX,
  Download,
  Upload
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
import { createPortal } from 'react-dom';
import Select from '../../components/ui/Select';

import VideoFilter from './components/VideoFilter';
import VideoItem from './components/VideoItem';
import VideoDetailSidebar from './components/VideoDetailSidebar';
import LearningHeatmap from './components/LearningHeatmap';


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const extractYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
};

const extractPlaylistId = (url) => {
  if (!url) return null;
  const m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return m?.[1] || null;
};

const YOUTUBE_API_KEY = 'AIzaSyA8b-Uo_PoXYN53f65ap34F3F8yedqPHyk';

const fetchPlaylistItems = async (playlistId) => {
  let items = [];
  let pageToken = '';
  try {
    while (true) {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`);
      if (!r.ok) break;
      const d = await r.json();
      items = items.concat(d.items);
      pageToken = d.nextPageToken;
      if (!pageToken || items.length >= 200) break; // limit to 200 to prevent infinite/massive fetch
    }
    return items;
  } catch { return []; }
};

const getEmbedUrl = (video) => {
  if (!video) return null;
  const vid = (video.videoId?.length === 11 ? video.videoId : null) || extractYouTubeId(video.url);
  if (!vid) return null;
  const p = new URLSearchParams({
    enablejsapi: '1', modestbranding: '1', rel: '0',
    controls: '1', fs: '1', origin: window.location.origin,
  });
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

const formatWatchTime = (s) => {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const Videos = () => {
  // Storage
  const [videos, setVideos]         = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [courses, setCourses]       = useStorage(STORAGE_KEYS.COURSES, []);
  const [projects, setProjects]     = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [resources, setResources]   = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [globalTags, setGlobalTags] = useStorage('VIDEO_TAGS', []);
  const { addNotification }         = useReminders();

  // Active video
  const [activeVideoId, setActiveVideoId] = useState(null);
  const activeVideo = useMemo(() => videos.find(v => v.id === activeVideoId), [videos, activeVideoId]);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState(null);

  useEffect(() => {
    if (activeVideoId) {
      // We only want to generate the embed URL once when the video is opened, 
      // so we intentionally omit `videos` from the dependency array to prevent 
      // continuous iframe reloads when lastPosition updates.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setActiveEmbedUrl(getEmbedUrl(videos.find(v => v.id === activeVideoId)));
    } else {
      setActiveEmbedUrl(null);
    }
  }, [activeVideoId]);

  // Modals / panels
  const [isModalOpen,       setIsModalOpen]      = useState(false);
  const [showExportMenu,    setShowExportMenu]   = useState(false);
  const [isHistoryOpen,     setIsHistoryOpen]    = useState(false);
  const fileInputRef = useRef(null);
  const [showArchived,      setShowArchived]      = useState(false);
  const [confirmConfig,     setConfirmConfig]     = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });

  // Filters / sort
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTag,    setFilterTag]    = useState('all');
  const [sortBy,       setSortBy]       = useState('dateAdded');
  const [viewMode,     setViewMode]     = useState('grid');
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(true);

  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef(null);

  // Player (DO NOT TOUCH PLAYER LOGIC)
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [liveSeconds,  setLiveSeconds]  = useState(0);

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
  
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, filterCourse, filterStatus, filterTag, sortBy, viewMode, showArchived]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowInitialSkeleton(false), 450);
    return () => clearTimeout(timeout);
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = videos.filter(v => !v.archived);
    const completed  = active.filter(v => v.completed).length;
    const inProgress = active.filter(v => !v.completed && v.progress > 0).length;
    const totalWatchTime = active.reduce((a, v) => a + (v.totalWatchTime || 0), 0) + liveSeconds;

    const daySet = new Set();
    active.forEach(v => (v.playbackLogs || []).forEach(l => {
      if (l.startTime) daySet.add(l.startTime.split('T')[0]);
    }));
    if (liveSeconds > 0 && sessionStartRef.current?.startTime) {
      daySet.add(sessionStartRef.current.startTime.split('T')[0]);
    }

    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (daySet.has(key)) streak++;
      else if (i === 0) continue; // today not watched yet — check yesterday before breaking
      else break;
    }

    const totalDuration = active.reduce((a, v) => a + (v.duration || 0), 0);

    return {
      total: active.length, completed, inProgress,
      totalWatchTime, streak, totalDuration
    };
  }, [videos, liveSeconds]);

  const activeLiveLog = useMemo(() => {
    if (isPlaying && sessionStartRef.current && liveSeconds > 0) {
      return {
        startTime: sessionStartRef.current.startTime,
        duration: liveSeconds,
      };
    }
    return null;
  }, [isPlaying, liveSeconds]);

  const filteredVideos = useMemo(() => {
    let list = videos.filter(v => {
      if (!showArchived && v.archived) return false;
      if (showArchived && !v.archived) return false;
      const q = searchQuery.toLowerCase();
      if (q && !v.title.toLowerCase().includes(q)) return false;
      if (filterCourse !== 'all' && v.courseId !== filterCourse) return false;
      if (filterStatus === 'completed'  && !v.completed) return false;
      if (filterStatus === 'inProgress' && (v.completed || v.progress === 0)) return false;
      if (filterStatus === 'notStarted' && v.progress > 0) return false;
      if (filterTag !== 'all' && !(v.tagIds || []).includes(filterTag)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'title')     return a.title.localeCompare(b.title);
      if (sortBy === 'progress')  return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'watchTime') return (b.totalWatchTime || 0) - (a.totalWatchTime || 0);
      if (sortBy === 'duration')  return (b.duration || 0) - (a.duration || 0);
      return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
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
      if (data.event === 'onReady') iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'yt-player' }), '*');
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
              duration: duration,
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

  // ── Session tracking (Optimized to reduce db write costs) ─────────────────────────

  // Live in-memory ticker (0 DB read/write cost)
  useEffect(() => {
    let timer = null;
    if (isPlaying && sessionStartRef.current) {
      timer = setInterval(() => {
        if (sessionStartRef.current?.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(sessionStartRef.current.startTime).getTime()) / 1000);
          setLiveSeconds(elapsed);
        }
      }, 1000);
    } else {
      setLiveSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

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
            ? { 
                ...v, 
                playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50),
                totalWatchTime: (v.totalWatchTime || 0) + Math.round(dur),
                lastWatched: new Date().toISOString()
              }
            : v
        ));
      }
      sessionStartRef.current = null;
      setLiveSeconds(0);
    }
    return () => {
      if (sessionStartRef.current && activeVideoIdRef.current) {
        const dur = (new Date() - new Date(sessionStartRef.current.startTime)) / 1000;
        if (dur > 5) {
          const log = { ...sessionStartRef.current, endTime: new Date().toISOString(), duration: dur };
          setVideos(prev => prev.map(v =>
            v.id === activeVideoIdRef.current
              ? { 
                  ...v, 
                  playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50),
                  totalWatchTime: (v.totalWatchTime || 0) + Math.round(dur),
                  lastWatched: new Date().toISOString()
                }
              : v
          ));
        }
        sessionStartRef.current = null;
        setLiveSeconds(0);
      }
    };
  }, [isPlaying, activeVideoId, activeVideo, playbackRate, setVideos]);

  // Save session when tab closes / reloads
  useEffect(() => {
    const handleUnload = () => {
      if (sessionStartRef.current && activeVideoIdRef.current) {
        const dur = (new Date() - new Date(sessionStartRef.current.startTime)) / 1000;
        if (dur > 5) {
          const log = { ...sessionStartRef.current, endTime: new Date().toISOString(), duration: dur };
          setVideos(prev => prev.map(v =>
            v.id === activeVideoIdRef.current
              ? { 
                  ...v, 
                  playbackLogs: [log, ...(v.playbackLogs || [])].slice(0, 50),
                  totalWatchTime: (v.totalWatchTime || 0) + Math.round(dur),
                  lastWatched: new Date().toISOString()
                }
              : v
          ));
        }
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [setVideos]);

  // ── Reset on video switch ─────────────────────────────────────────────────

  useEffect(() => {
    requestAnimationFrame(() => setIsPlaying(false));
    clearInterval(watchIntervalRef.current);
  }, [activeVideoId]);

  useEffect(() => { ytCmd('setPlaybackRate', [playbackRate]); }, [playbackRate, ytCmd]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  const handleAddBookmark = useCallback((note = '') => {
    const av = activeVideoRef.current;
    if (!av) return;
    const time = av.lastPosition || 0;
    const bm = { id: nanoid(), time, note: note || 'Knowledge Bookmark', createdAt: new Date().toISOString() };
    setVideos(prev => prev.map(v =>
      v.id === av.id
        ? { ...v, bookmarks: [...(v.bookmarks || []), bm].sort((a, b) => a.time - b.time) }
        : v
    ));
    toast.success(`Bookmarked at ${formatTime(time)}`);
  }, [setVideos]);

  const handleAddBookmarkRef = useRef(handleAddBookmark);

  useEffect(() => {
    const handler = (e) => {
      const t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      const av = activeVideoRef.current;
      if (!av) return;
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); handleAddBookmarkRef.current(); }
      if (e.key === 'Escape') setActiveVideoId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSaveBookmark = (bookmarkId, noteText, tag = null) => {
    const av = activeVideoRef.current;
    if (!av) return;
    setVideos(prev => prev.map(v => 
      v.id === av.id ? {
        ...v,
        bookmarks: v.bookmarks.map(b => b.id === bookmarkId ? { ...b, note: noteText, ...(tag ? { tag } : {}) } : b)
      } : v
    ));
  };

  const handleDeleteBookmark = (bookmarkId) => {
    const av = activeVideoRef.current;
    if (!av) return;
    setVideos(prev => prev.map(v => 
      v.id === av.id ? {
        ...v,
        bookmarks: v.bookmarks.filter(b => b.id !== bookmarkId)
      } : v
    ));
  };

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
    
    const isPlaylist = !!extractPlaylistId(modalForm.url);
    const id = extractYouTubeId(modalForm.url);
    if (modalForm.url.length > 10 && !id && !isPlaylist) {
      queueMicrotask(() => {
        if (!cancelled) setUrlError('Doesn\'t look like a valid YouTube video or playlist URL');
      });
      return;
    }
    
    if (isPlaylist) {
      queueMicrotask(() => {
        if (!cancelled) {
          setUrlError('');
          setFetchedMeta({ title: 'YouTube Playlist' });
        }
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
  const toggleSelectAllVisible = () => {
    const visibleIds = filteredVideos.map((v) => v.id);
    setSelectedVideoIds((prev) => toggleSelectAll(prev, visibleIds));
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    
    const playlistId = extractPlaylistId(modalForm.url);
    if (playlistId) {
      const tid = toast.loading('Importing playlist...');
      const items = await fetchPlaylistItems(playlistId);
      if (!items || items.length === 0) {
        toast.error('Could not fetch playlist or it is empty', { id: tid });
        return;
      }
      
      const newVideos = [];
      const newResources = [];
      const now = new Date();
      
      items.forEach((item, index) => {
        const vid = item.snippet.resourceId?.videoId;
        if (!vid) return;
        const vUrl = `https://www.youtube.com/watch?v=${vid}`;
        if (videos.some(v => v.url === vUrl && !v.archived)) return;
        
        const addedAt = new Date(now.getTime() - index * 1000).toISOString();
        const newVideo = {
          id: nanoid(), videoId: vid, url: vUrl,
          courseId: modalForm.courseId, projectId: modalForm.projectId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
          author: item.snippet.videoOwnerChannelTitle || null,
          completed: false, progress: 0, duration: 0, lastPosition: 0, totalWatchTime: 0,
          addedAt, lastWatched: addedAt,
          bookmarks: [], playbackLogs: [], archived: false, completionNotified: false,
          tagIds: [], videoNotes: '',
        };
        newVideos.push(newVideo);
        
        if (modalForm.courseId || modalForm.projectId) {
          newResources.push({
            id: nanoid(), name: newVideo.title, url: newVideo.url, type: 'Video',
            associatedType: modalForm.courseId ? 'Course' : 'Project',
            associatedId: modalForm.courseId || modalForm.projectId,
            createdAt: addedAt,
          });
        }
      });
      
      if (newVideos.length > 0) {
        setVideos(prev => [...newVideos, ...prev]);
        if (newResources.length > 0) setResources(prev => [...prev, ...newResources]);
        toast.success(`Imported ${newVideos.length} videos from playlist!`, { id: tid });
      } else {
        toast.success('Playlist imported, but all videos were already in the tracker.', { id: tid });
      }
      
      setModalForm({ url: '', title: '', courseId: '', projectId: '' });
      setFetchedMeta(null); setUrlError(''); setIsModalOpen(false);
      return;
    }

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

  const handleDeleteVideo = (id) => {
    const video = videos.find((item) => item.id === id);
    if (!video) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Video',
      message: `Permanently delete “${video.title}”? This cannot be undone.`,
      onConfirm: () => {
        setVideos((prev) => prev.filter((item) => item.id !== id));
        setSelectedVideoIds((prev) => prev.filter((videoId) => videoId !== id));
        if (activeVideoId === id) setActiveVideoId(null);
        toast.success('Video deleted');
      },
    });
  };

  const handleToggleArchive = (video) => {
    const nextArchived = !(video.archived === true);
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, archived: nextArchived, updatedAt: new Date().toISOString() } : v));
    toast.success(nextArchived ? 'Video moved to trash' : 'Video restored');
  };

  const toggleComplete = (video) => {
    const next = !video.completed;
    updateVideoData(video.id, { completed: next, completionNotified: next });
    toast.success(next ? 'Video marked as completed!' : 'Video marked as in-progress');
    if (next) addNotification(videoCompletedNotification(video.title));
  };

  // Export
  const exportBookmarksMarkdown = () => {
    const secs = videos.filter(v => !v.archived && v.bookmarks?.length).map(v => {
      const lines = v.bookmarks.map(b => `- **${formatTime(b.time)}** — ${b.note}`).join('\n');
      const notes = v.videoNotes ? `\n\n> ${v.videoNotes}` : '';
      return `## ${v.title}\n\n${lines}${notes}`;
    });
    if (!secs.length) { toast.error('No bookmarks to export'); return; }
    const md = `# Video Bookmarks\n\nExported ${new Date().toLocaleDateString()}\n\n${secs.join('\n\n---\n\n')}`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })),
      download: 'video-bookmarks.md',
    });
    a.click(); toast.success('Bookmarks exported'); setShowExportMenu(false);
  };

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

  const exportLibraryJSON = () => {
    const data = JSON.stringify(videos, null, 2);
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([data], { type: 'application/json' })),
      download: `studyos-videos-backup-${new Date().toISOString().split('T')[0]}.json`,
    });
    a.click();
    toast.success('Library exported to JSON');
    setShowExportMenu(false);
  };

  const importLibraryJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          const existingIds = new Set(videos.map(v => v.id));
          const existingUrls = new Set(videos.map(v => v.url));
          const toAdd = data.filter(v => !existingIds.has(v.id) && !existingUrls.has(v.url));
          if (toAdd.length > 0) {
            setVideos(prev => [...toAdd, ...prev]);
            toast.success(`Imported ${toAdd.length} videos successfully`);
          } else {
            toast.success('No new videos to import (all already exist)');
          }
        } else {
          toast.error('Invalid JSON format (expected an array)');
        }
      } catch (err) {
        toast.error('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
    setShowExportMenu(false);
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

  const hasActiveFilters = Boolean(searchQuery.trim()) || filterCourse !== 'all' || filterStatus !== 'all' || filterTag !== 'all' || showArchived;
  const clearFilters = () => {
    setSearchQuery(''); setFilterCourse('all'); setFilterStatus('all'); setFilterTag('all'); setShowArchived(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      <PageHeader
        title="Video Tracker"
        description="Turn watch time into learning progress"
        icon={<Youtube size={32} />}
        iconClassName="bg-red-50 dark:bg-red-500/10 text-red-500"
        className="mb-8"
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Videos',  value: stats.total, icon: Youtube, tint: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Completed',     value: stats.completed, icon: CheckCircle2, tint: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'In Progress',   value: stats.inProgress, icon: Play, tint: 'text-primary-500', bg: 'bg-primary-500/10' },
          { label: 'Total Watch',   value: formatWatchTime(stats.totalWatchTime), icon: Clock, tint: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Day Streak 🔥', value: `${stats.streak}d`, icon: BarChart2, tint: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.tint}`}>{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <LearningHeatmap videos={videos} activeLiveLog={activeLiveLog} />

      <div className="relative">
        <VideoFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterCourse={filterCourse}
          setFilterCourse={setFilterCourse}
          filterTag={filterTag}
          setFilterTag={setFilterTag}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onAdd={() => setIsModalOpen(true)}
          videoCount={filteredVideos.length}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          viewMode={viewMode}
          setViewMode={setViewMode}
          courses={courses}
          globalTags={globalTags}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onExportMenuToggle={() => setShowExportMenu(!showExportMenu)}
        />
        <AnimatePresence>
          {showExportMenu && (
            <motion.div initial={{ opacity:0, y:6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:6, scale:0.97 }}
              className="absolute right-12 top-20 z-50 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <button onClick={exportBookmarksMarkdown} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3">
                <FileText size={16} className="text-primary-500" /> Bookmarks (Markdown)
              </button>
              <button onClick={exportHistoryCSV} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <BarChart2 size={16} className="text-green-500" /> Watch History (CSV)
              </button>
              <button onClick={exportLibraryJSON} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <Download size={16} className="text-blue-500" /> Backup Library (JSON)
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <Upload size={16} className="text-purple-500" /> Restore Backup (JSON)
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={importLibraryJSON} className="hidden" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedVideoIds.length > 0 && (
        <BulkActionBar selectedCount={selectedVideoIds.length} onSelectVisible={toggleSelectAllVisible} onClear={clearSelection} className="mb-6">
          <Select variant="ghost" value={bulkCourseId} onChange={(e) => setBulkCourseId(e.target.value)} options={[{ label: 'Assign Course...', value: '' }, ...courses.map(c => ({ label: c.title, value: c.id }))]} />
          <button onClick={applyBulkAssignCourse} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Assign</button>
          <button onClick={() => applyBulkMarkComplete(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700">Complete</button>
          <button onClick={() => applyBulkMarkComplete(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-700">Reopen</button>
          <button onClick={applyBulkRestore} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">Restore</button>
          <button onClick={applyBulkArchive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Trash</button>
          <button onClick={applyBulkHardDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white">Hard delete</button>
        </BulkActionBar>
      )}

      {viewMode === 'grid' ? (
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          <AnimatePresence mode="popLayout">
            {filteredVideos.slice(0, visibleCount).map((video) => (
              <VideoItem
                key={video.id}
                video={video}
                onPlay={(v) => setActiveVideoId(v.id)}
                onDelete={handleDeleteVideo}
                onToggleArchive={handleToggleArchive}
                onToggleComplete={toggleComplete}
                courses={courses}
                globalTags={globalTags}
                selected={selectedVideoIds.includes(video.id)}
                onToggleSelect={toggleVideoSelection}
                viewMode="grid"
              />
            ))}
          </AnimatePresence>

          {showInitialSkeleton && videos.length === 0 ? (
            [...Array(3)].map((_, index) => (
              <div key={`skeleton-${index}`} className="rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
                <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 mb-4" />
                <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 mb-5" />
                <div className="h-8 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))
          ) : filteredVideos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                {searchQuery ? <SearchX size={48} className="text-slate-400" /> : <VideoOff size={48} className="text-slate-400" />}
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                {searchQuery ? 'No videos found' : 'Your video library is empty'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                {searchQuery 
                  ? `We couldn't find any videos matching "${searchQuery}". Try adjusting your search or filters.` 
                  : 'Start building your knowledge base by adding educational YouTube videos. StudyOS will help you track progress, take notes, and save bookmarks.'}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all hover:scale-105 active:scale-95"
                >
                  Add Your First Video
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Sel</th>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.slice(0, visibleCount).map((video) => {
                const c = courses.find(cr => cr.id === video.courseId);
                return (
                  <tr key={video.id} className="border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.includes(video.id)}
                        onChange={() => toggleVideoSelection(video.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold flex items-center gap-3">
                      {video.thumbnail && <img src={video.thumbnail} alt="" className="w-12 h-8 object-cover rounded-md" />}
                      <span className="line-clamp-1">{video.title || 'Untitled Video'}</span>
                      {video.completed && <span className="text-[10px] text-green-500 uppercase font-black">Done</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${video.progress}%` }} />
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">{video.progress}% • {formatTime(video.totalWatchTime)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c ? c.title : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setActiveVideoId(video.id)} className="px-2.5 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold">Play</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVideos.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        {searchQuery ? <SearchX size={32} className="text-slate-400" /> : <VideoOff size={32} className="text-slate-400" />}
                      </div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">
                        {searchQuery ? 'No results found' : 'No videos added yet'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery ? 'Try adjusting your search criteria.' : 'Click "Add Video" to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {visibleCount < filteredVideos.length && (
        <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-6">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!showInitialSkeleton && filteredVideos.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <EmptyState
            icon={<Youtube size={48} className="text-slate-200 dark:text-slate-700" />}
            title={hasActiveFilters ? 'No Videos Match Your Filters' : 'Video Library Empty'}
            description={hasActiveFilters
              ? 'Try clearing filters or search to reveal more videos.'
              : 'Add your first video to start learning.'}
            actions={(
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95">
                  Add Video
                </button>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black transition-all active:scale-95">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          />
        </motion.div>
      )}

      <AnimatePresence>
        {activeVideoId && (
          <VideoDetailSidebar
            activeVideo={activeVideo}
            setActiveVideoId={setActiveVideoId}
            iframeRef={iframeRef}
            embedUrl={activeEmbedUrl}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
            onToggleComplete={toggleComplete}
            onAddBookmark={handleAddBookmark}
            onSaveBookmark={handleSaveBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            updateVideoData={updateVideoData}
            courses={courses}
            projects={projects}
            allResources={resources}
          />
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Add Video</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleAddVideo} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">YouTube URL *</label>
                      <input
                        type="url" required
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-4 ring-primary-500/10 outline-none text-slate-800 dark:text-slate-100 font-medium transition-all"
                        placeholder="https://youtube.com/watch?v=..."
                        value={modalForm.url} onChange={(e) => setModalForm({ ...modalForm, url: e.target.value })}
                      />
                      {urlError && <p className="text-red-500 text-xs font-bold mt-1.5">{urlError}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center justify-between">
                        Title {isFetchingMeta && <span className="text-primary-500 text-[10px] animate-pulse">Auto-fetching...</span>}
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-4 ring-primary-500/10 outline-none text-slate-800 dark:text-slate-100 font-medium transition-all"
                        placeholder="e.g. Intro to Machine Learning"
                        value={modalForm.title} onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Link Course</label>
                        <Select
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-4 ring-primary-500/10 outline-none font-medium cursor-pointer"
                          value={modalForm.courseId} 
                          onChange={(val) => {
                            if (val === 'NEW_COURSE') {
                              const title = window.prompt('Enter new course name:');
                              if (title && title.trim()) {
                                const newCourse = {
                                  id: nanoid(), title: title.trim(), color: 'slate', status: 'Not Started', progress: 0,
                                  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                                  activityLog: [], modules: [], tagIds: [], archived: false
                                };
                                setCourses(prev => [...prev, newCourse]);
                                setModalForm(prev => ({ ...prev, courseId: newCourse.id }));
                              } else {
                                setModalForm(prev => ({ ...prev, courseId: '' }));
                              }
                            } else {
                              setModalForm(prev => ({ ...prev, courseId: val }));
                            }
                          }}
                          options={[
                            { label: 'None', value: '' },
                            ...courses.map(c => ({ label: c.title, value: c.id })),
                            { label: '+ Create New Course', value: 'NEW_COURSE' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Link Project</label>
                        <Select
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-4 ring-primary-500/10 outline-none font-medium cursor-pointer"
                          value={modalForm.projectId} 
                          onChange={(val) => {
                            if (val === 'NEW_PROJECT') {
                              const title = window.prompt('Enter new project name:');
                              if (title && title.trim()) {
                                const newProject = {
                                  id: nanoid(), title: title.trim(), color: 'slate', status: 'Planning', progress: 0,
                                  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                                  activityLog: [], tasks: [], tagIds: [], archived: false
                                };
                                setProjects(prev => [...prev, newProject]);
                                setModalForm(prev => ({ ...prev, projectId: newProject.id }));
                              } else {
                                setModalForm(prev => ({ ...prev, projectId: '' }));
                              }
                            } else {
                              setModalForm(prev => ({ ...prev, projectId: val }));
                            }
                          }}
                          options={[
                            { label: 'None', value: '' },
                            ...projects.map(p => ({ label: p.title, value: p.id })),
                            { label: '+ Create New Project', value: 'NEW_PROJECT' }
                          ]}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                      <button type="submit" disabled={isFetchingMeta} className="px-6 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 active:scale-95 disabled:opacity-50">Add to Queue</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title={confirmConfig.title}
        type="danger"
      />
    </div>
  );
};

export default Videos;
