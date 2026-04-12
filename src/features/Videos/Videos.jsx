import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  Plus, 
  Youtube, 
  Play, 
  Pause, 
  RotateCcw, 
  Bookmark, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  History,
  TrendingUp,
  FastForward,
  Activity,
  Maximize2,
  Layout,
  MoreVertical,
  Edit3,
  Search,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { toggleSelectionId, toggleSelectAll, softArchiveByIds, restoreByIds, hardDeleteByIds } from '../../utils/entityOps';
import { videoCompletedNotification } from '../../utils/notificationBuilders';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import { useReminders } from '../../context/ReminderContext';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const Videos = () => {
  const [videos, setVideos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const { addNotification } = useReminders();
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });
  
  const activeVideo = React.useMemo(() => 
    videos.find(v => v.id === activeVideoId), 
  [videos, activeVideoId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  
  // YouTube API State
  const [ytPlayer, setYtPlayer] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [noteForm, setNoteForm] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  // Modal State
  const [modalForm, setModalForm] = useState({
    url: '',
    title: '',
    courseId: ''
  });

  const playerRef = useRef(null);
  const sessionStartRef = useRef(null);
  const lastTrackedTimeRef = useRef(0);

  const updateVideoData = (id, data) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  };

  const clearSelection = () => setSelectedVideoIds([]);

  const toggleVideoSelection = (id) => {
    setSelectedVideoIds((prev) => toggleSelectionId(prev, id));
  };

  const toggleSelectAllVisible = (visibleIds) => {
    setSelectedVideoIds((prev) => toggleSelectAll(prev, visibleIds));
  };

  // Load YouTube IFrame API once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // This callback is only called once when the script loads
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube IFrame API is ready");
      window.isYTAPIReady = true;
    };
  }, []);

  // Initialize or Destroy player when activeVideo changes
  useEffect(() => {
    let player;
    let isMounted = true;
    
    const createPlayer = () => {
      if (!isMounted || !activeVideo) return;
      const containerId = `yt-player-${activeVideo.id}`;
      
      const element = document.getElementById(containerId);
      if (!element) {
        setTimeout(createPlayer, 100);
        return;
      }

      try {
        player = new window.YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: activeVideo.videoId,
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              if (isMounted) {
                setYtPlayer(event.target);
                event.target.setPlaybackRate(playbackRate);
                if (activeVideo.lastPosition > 0) {
                  event.target.seekTo(activeVideo.lastPosition);
                }
              }
            },
            onStateChange: (event) => {
              if (isMounted) {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                } else {
                  setIsPlaying(false);
                }
              }
            },
            onError: (e) => {
              console.error("YT Player Error:", e);
              if (isMounted) toast.error("Video playback error. Please try another link.");
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize YT Player:", err);
      }
    };

    if (activeVideo) {
      const timer = setTimeout(() => {
        if (window.YT && window.YT.Player) {
          createPlayer();
        } else {
          const checkAPI = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkAPI);
              createPlayer();
            }
          }, 200);
          setTimeout(() => clearInterval(checkAPI), 5000); // Timeout after 5s
        }
      }, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (player && player.destroy) {
          try {
            player.destroy();
          } catch (e) {
            console.warn("Cleanup error:", e);
          }
        }
        setYtPlayer(null);
        setIsPlaying(false);
      };
    }
  }, [activeVideoId, activeVideo?.videoId, activeVideo, playbackRate]);

  // Sync Playback Rate
  useEffect(() => {
    if (ytPlayer && ytPlayer.setPlaybackRate) {
      ytPlayer.setPlaybackRate(playbackRate);
    }
  }, [playbackRate, ytPlayer]);

  // Tracking Interval
  useEffect(() => {
    let interval;
    
    if (isPlaying && ytPlayer && ytPlayer.getCurrentTime && activeVideoId) {
      interval = setInterval(() => {
        const time = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        let completedTitle = null;

        if (time > 0 && duration > 0) {
          setVideos(prev => prev.map(v => {
            if (v.id !== activeVideoId) return v;
            
            const progress = Math.round((time / duration) * 100);
            const isCompleted = progress >= 90;
            const lastPos = v.lastPosition || 0;
            const timeDiff = time - lastPos;
            
            // Only count as watch time if it's natural playback (small forward jump)
            // 8s because interval is now 5s
            const watchIncrement = (timeDiff > 0 && timeDiff < 8) ? timeDiff : 0;
            
            return {
              ...v,
              lastPosition: time,
              progress: Math.max(v.progress || 0, progress),
              completed: v.completed || isCompleted,
              completionNotified: v.completionNotified || (!v.completed && isCompleted),
              totalWatchTime: (v.totalWatchTime || 0) + watchIncrement,
              lastWatched: new Date().toISOString()
            };
          }));
          const current = videos.find((v) => v.id === activeVideoId);
          if (current && !current.completed && Math.round((time / duration) * 100) >= 90) {
            completedTitle = current.title;
          }
          if (completedTitle) {
            addNotification(videoCompletedNotification(completedTitle, 'reached'));
          }
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer, activeVideoId, setVideos, videos, addNotification]);

  // Track session start
  useEffect(() => {
    if (isPlaying && activeVideo && !sessionStartRef.current) {
      sessionStartRef.current = {
        startTime: new Date().toISOString(),
        startPosition: activeVideo.lastPosition,
        speed: playbackRate
      };
    } else if (!isPlaying && sessionStartRef.current) {
      // Session ended or paused
      const sessionEnd = {
        ...sessionStartRef.current,
        endTime: new Date().toISOString(),
        endPosition: activeVideo?.lastPosition || 0,
        duration: (new Date() - new Date(sessionStartRef.current.startTime)) / 1000
      };

      if (sessionEnd.duration > 5 && activeVideoId) {
        setVideos(prev => prev.map(v => {
          if (v.id !== activeVideoId) return v;
          return {
            ...v,
            playbackLogs: [sessionEnd, ...(v.playbackLogs || [])].slice(0, 50)
          };
        }));
      }
      sessionStartRef.current = null;
    }
    return () => {
      if (sessionStartRef.current && activeVideoId) {
        const sessionEnd = {
          ...sessionStartRef.current,
          endTime: new Date().toISOString(),
          endPosition: activeVideo?.lastPosition || 0,
          duration: (new Date() - new Date(sessionStartRef.current.startTime)) / 1000
        };
        if (sessionEnd.duration > 5) {
          setVideos(prev => prev.map(v => v.id === activeVideoId ? {
            ...v,
            playbackLogs: [sessionEnd, ...(v.playbackLogs || [])].slice(0, 50)
          } : v));
        }
      }
    };
  }, [isPlaying, activeVideoId, activeVideo, playbackRate, setVideos]);

  const extractYouTubeId = (url) => {
    // Standard URL: https://www.youtube.com/watch?v=VIDEO_ID
    // Short URL: https://youtu.be/VIDEO_ID
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    // Handle URL with multiple parameters
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    const videoId = extractYouTubeId(modalForm.url);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return;
    }

    const duplicate = videos.some((v) => v.videoId === videoId && v.archived !== true);
    if (duplicate) {
      toast.error('This video already exists in your tracker');
      return;
    }

    const newVideo = {
      id: nanoid(),
      videoId,
      // Store the clean, canonical watch URL to ensure ReactPlayer handles it correctly
      url: `https://www.youtube.com/watch?v=${videoId}`, 
      courseId: modalForm.courseId,
      title: modalForm.title || `Video ${videos.length + 1}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
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
      completionNotified: false
    };

    setVideos([newVideo, ...videos]);
    setModalForm({ url: '', title: '', courseId: '' });
    setIsModalOpen(false);
    toast.success('Video added to learning queue!');
  };

  const handleSeek = (seconds) => {
    if (ytPlayer && ytPlayer.seekTo) {
      ytPlayer.seekTo(seconds, true);
      if (ytPlayer.playVideo) ytPlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const handleAddBookmark = (note = '') => {
    // Use the official YT API to get the current time
    const time = ytPlayer && ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;
    
    if (note === 'PROMPT_USER') {
      setIsPlaying(false);
      if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
      setEditingBookmark({ time, isNew: true });
      setNoteForm('');
      setIsNoteModalOpen(true);
      return;
    }

    const newBookmark = {
      id: nanoid(),
      time,
      note: note || 'Knowledge Bookmark',
      createdAt: new Date().toISOString()
    };
    
    updateVideoData(activeVideo.id, {
      bookmarks: [...(activeVideo.bookmarks || []), newBookmark].sort((a, b) => a.time - b.time)
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
        createdAt: new Date().toISOString()
      };
      updateVideoData(activeVideo.id, {
        bookmarks: [...(activeVideo.bookmarks || []), newBookmark].sort((a, b) => a.time - b.time)
      });
    } else {
      updateVideoData(activeVideo.id, {
        bookmarks: activeVideo.bookmarks.map(b => 
          b.id === editingBookmark.id ? { ...b, note: noteForm } : b
        )
      });
    }

    setIsNoteModalOpen(false);
    setEditingBookmark(null);
    setNoteForm('');
    setIsPlaying(true);
    if (ytPlayer && ytPlayer.playVideo) ytPlayer.playVideo();
    toast.success('Note saved!');
  };

  const handleDeleteVideo = (id) => {
    setVideoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVideo = () => {
    if (!videoToDelete) return;
    setVideos(videos.map(v => v.id === videoToDelete ? { ...v, archived: true, updatedAt: new Date().toISOString() } : v));
    if (activeVideoId === videoToDelete) setActiveVideoId(null);
    setVideoToDelete(null);
    toast.success('Video archived');
  };

  const toggleComplete = (video) => {
    const nextCompleted = !video.completed;
    updateVideoData(video.id, { completed: nextCompleted, completionNotified: nextCompleted });
    toast.success(video.completed ? 'Video marked as in-progress' : 'Video marked as completed!');
    if (nextCompleted) {
      addNotification(videoCompletedNotification(video.title));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter(v => {
    const isArchived = v.archived === true;
    if (!showArchived && isArchived) return false;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === 'all' || v.courseId === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const applyBulkAssignCourse = () => {
    if (!selectedVideoIds.length) return;
    const selected = new Set(selectedVideoIds);
    setVideos((prev) => prev.map((v) => (
      selected.has(v.id) ? { ...v, courseId: bulkCourseId, archived: false, updatedAt: new Date().toISOString() } : v
    )));
    toast.success(`Assigned ${selectedVideoIds.length} video(s)`);
    clearSelection();
  };

  const applyBulkMarkComplete = (completed) => {
    if (!selectedVideoIds.length) return;
    const selected = new Set(selectedVideoIds);
    setVideos((prev) => prev.map((v) => (
      selected.has(v.id) ? { ...v, completed, completionNotified: completed, archived: false, updatedAt: new Date().toISOString() } : v
    )));
    toast.success(`${completed ? 'Completed' : 'Reopened'} ${selectedVideoIds.length} video(s)`);
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
      message: `Permanently delete ${selectedVideoIds.length} selected video(s)? This action cannot be undone.`,
      onConfirm: () => {
        setVideos((prev) => hardDeleteByIds(prev, selectedVideoIds));
        if (selectedVideoIds.includes(activeVideoId)) setActiveVideoId(null);
        toast.success(`Deleted ${selectedVideoIds.length} video(s)`);
        clearSelection();
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      {/* Header & Controls */}
      <div className="space-y-6">
        <PageHeader
          title="Video Tracker"
          description="Turn watch time into learning progress"
          icon={<Youtube size={28} />}
          iconClassName="bg-red-50 dark:bg-red-500/10 text-red-500"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none"
              placeholder="Search library..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none font-bold text-sm"
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button
            onClick={() => setShowArchived((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'
            }`}
            title="Toggle archived videos"
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

      {selectedVideoIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedVideoIds.length}
          onSelectVisible={() => toggleSelectAllVisible(filteredVideos.map((v) => v.id))}
          onClear={clearSelection}
        >
          <select value={bulkCourseId} onChange={(e) => setBulkCourseId(e.target.value)} className="px-2 py-1 rounded-lg text-xs">
            <option value="">No Course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button onClick={applyBulkAssignCourse} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Assign course</button>
          <button onClick={() => applyBulkMarkComplete(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">Complete</button>
          <button onClick={() => applyBulkMarkComplete(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">Reopen</button>
          <button onClick={applyBulkRestore} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Restore</button>
          <button onClick={applyBulkArchive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Archive</button>
          <button onClick={applyBulkHardDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white">Hard delete</button>
        </BulkActionBar>
      )}

      <div className={`grid grid-cols-1 ${activeVideo ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 transition-all duration-500`}>
        {/* Playlist / Library */}
        <div className={`${activeVideo ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6 order-2 lg:order-1`}>
          <div className={`grid gap-4 ${!activeVideo ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredVideos.map((video) => (
              <motion.div 
                layout
                key={video.id}
                onClick={() => {
                  if (video.archived) return;
                  setActiveVideoId(video.id);
                  setIsPlaying(true);
                }}
                className={`group relative card p-3 cursor-pointer transition-all border-2 ${
                  activeVideo?.id === video.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/5' 
                    : 'border-transparent hover:border-slate-100 dark:hover:border-slate-800'
                }`}
              >
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
                <div className={`flex ${!activeVideo ? 'flex-col' : 'gap-4'} h-full`}>
                  <div className={`relative ${!activeVideo ? 'aspect-video mb-3' : 'w-32 h-20'} rounded-xl overflow-hidden bg-slate-900 shrink-0`}>
                    <img src={video.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {courses.find(c => c.id === video.courseId)?.title || 'No Course'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {formatTime(video.totalWatchTime)}
                      </span>
                    </div>

                    {!activeVideo && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mr-4">
                          <div 
                            className={`h-full transition-all duration-1000 ${video.completed ? 'bg-green-500' : 'bg-primary-500'}`}
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

        {/* Focused Player View */}
        {activeVideo && (
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl relative group ring-4 ring-white dark:ring-slate-900">
              <div 
                id={`yt-player-${activeVideo.id}`}
                className="w-full h-full"
              ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Player Info & Actions */}
              <div className="md:col-span-2 space-y-6">
                <div className="card p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          activeVideo.completed ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'
                        }`}>
                          {activeVideo.completed ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {courses.find(c => c.id === activeVideo.courseId)?.title || 'Standalone'}
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
                        title={activeVideo.completed ? "Mark Incomplete" : "Mark Complete"}
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

                  <div className="grid grid-cols-3 gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-8">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                      <p className="text-xl font-black text-primary-500">{activeVideo.progress}%</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Watch Time</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-200">{formatTime(activeVideo.totalWatchTime)}</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</p>
                      <select 
                        className="bg-transparent border-none text-xl font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer p-0"
                        value={playbackRate}
                        onChange={e => setPlaybackRate(parseFloat(e.target.value))}
                      >
                        {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                          <option key={rate} value={rate} className="text-sm font-bold dark:bg-slate-900">{rate}x</option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                    <h4 className="text-sm font-black uppercase tracking-widest">Playback Analytics</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Avg. Speed</p>
                      <p className="text-xl font-black">
                        {activeVideo.playbackLogs?.length > 0 
                          ? (activeVideo.playbackLogs.reduce((acc, l) => acc + (l.speed || 1), 0) / activeVideo.playbackLogs.length).toFixed(2) + 'x'
                          : '1.0x'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Sessions</p>
                      <p className="text-xl font-black">{activeVideo.playbackLogs?.length || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Status</p>
                      <p className="text-xl font-black">{activeVideo.completed ? 'Mastered' : 'Learning'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Efficiency</p>
                      <p className="text-xl font-black">
                        {activeVideo.playbackLogs?.length > 0 ? '88%' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Interaction Panel */}
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
                            ><Edit3 size={14} /></button>
                            <button 
                              onClick={() => {
                                updateVideoData(activeVideo.id, {
                                  bookmarks: activeVideo.bookmarks.filter(item => item.id !== b.id)
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-red-500"
                            ><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                          {b.note}
                        </p>
                      </div>
                    ))}
                    {(!activeVideo.bookmarks || activeVideo.bookmarks.length === 0) && (
                      <div className="py-12 text-center space-y-3 opacity-50">
                        <Bookmark size={32} className="mx-auto text-slate-300" />
                        <p className="text-xs text-slate-400 italic">No timestamps saved</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note/Bookmark Modal */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsNoteModalOpen(false);
                setIsPlaying(true);
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
                      {editingBookmark?.isNew ? 'New Timestamp Note' : 'Edit Note'}
                    </h3>
                    <p className="text-[10px] font-bold text-primary-500 uppercase">AT {formatTime(editingBookmark?.time)}</p>
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
                  onChange={e => setNoteForm(e.target.value)}
                />
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsNoteModalOpen(false);
                      setIsPlaying(true);
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

      {/* Add Video Modal */}
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
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Add New Video</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleAddVideo} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YouTube URL</label>
                    <div className="relative">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                      <input 
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={modalForm.url}
                        onChange={e => setModalForm({...modalForm, url: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Title (Optional)</label>
                    <input 
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white"
                      placeholder="e.g. Advanced React Hooks Masterclass"
                      value={modalForm.title}
                      onChange={e => setModalForm({...modalForm, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link to Course</label>
                    <select 
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white font-bold"
                      value={modalForm.courseId}
                      onChange={e => setModalForm({...modalForm, courseId: e.target.value})}
                    >
                      <option value="">No Course (Standalone)</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
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

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteVideo}
        title="Remove Video"
        message="Are you sure you want to delete this video and its learning data? This action cannot be undone."
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
};

export default Videos;
