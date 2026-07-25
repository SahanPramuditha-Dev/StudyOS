import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sun, Moon, MoreHorizontal, Maximize2, CheckCircle2, Bookmark, Download, Share2, ThumbsUp, Star, User, Flame, Play, Search, Clock, Bold, Italic, Code, List, Link, Image as ImageIcon, X, Check, ChevronRight, SkipBack, SkipForward, Volume2, Settings, ListOrdered, Globe, Eye, Sparkles, PlayCircle, FileText, MessageSquare, BookOpen, Layers, HelpCircle, Send, FileCode, Paperclip, Plus, Upload, Trash2, ExternalLink
} from 'lucide-react';
import Select from '../../../components/ui/Select';
import { fetchTranscript } from '../utils/transcriptFetcher';
import { fetchYouTubeComments } from '../utils/youtubeCommentsFetcher';
import { fetchYouTubeRelatedVideos } from '../utils/youtubeRelatedFetcher';
import { fetchYouTubeChapters, parseChaptersFromText } from '../utils/youtubeChapterFetcher';
import toast from 'react-hot-toast';

const formatTime = (s) => {
  if (!s || s <= 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  return `${m}:${sec.toString().padStart(2,'0')}`;
};

const DEFAULT_CHAPTERS = [
  { id: 1, num: 1, title: '1. Introduction to AI', startSec: 0, range: '00:00' },
  { id: 2, num: 2, title: '2. Search Algorithms', startSec: 333, range: '05:33' },
  { id: 3, num: 3, title: '3. Depth-First Search', startSec: 833, range: '13:53' },
  { id: 4, num: 4, title: '4. Breadth-First Search', startSec: 1459, range: '24:19' },
  { id: 5, num: 5, title: '5. Greedy Best-First Search', startSec: 1982, range: '33:02' },
  { id: 6, num: 6, title: '6. A* Search Algorithm', startSec: 2400, range: '40:00' },
  { id: 7, num: 7, title: '7. Adversarial Search', startSec: 3150, range: '52:30' },
  { id: 8, num: 8, title: '8. Minimax Algorithm', startSec: 4061, range: '1:07:41' },
  { id: 9, num: 9, title: '9. Alpha-Beta Pruning', startSec: 4467, range: '1:14:27' },
  { id: 10, num: 10, title: '10. Optimization', startSec: 21521, range: '5:58:41' }
];

const formatInlineMarkdown = (str) => {
  if (!str) return '';
  const parts = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\$\$.*?\$\$|\$.*?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-bold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-slate-200">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const cleanMath = token.replace(/^\$+|\$+$/g, '');
      parts.push(<code key={match.index} className="px-1 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[10px] border border-purple-500/20 font-bold">{cleanMath}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
};

const renderMarkdownHtml = (mdText) => {
  if (!mdText) return null;
  const lines = mdText.split('\n');
  const elements = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-xs font-black text-blue-400 uppercase tracking-wider mt-3 mb-1.5 border-b border-white/[0.08] pb-1">
          {formatInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-sm font-black text-slate-100 mt-4 mb-2 border-b border-white/[0.08] pb-1">
          {formatInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    } else if (trimmed === '***' || trimmed === '---') {
      elements.push(<hr key={idx} className="border-white/[0.08] my-3" />);
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-xs text-slate-300">
          <span className="text-blue-400 text-xs">•</span>
          <span>{formatInlineMarkdown(trimmed.replace(/^[*|-]\s+/, ''))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="text-xs text-slate-300 font-sans leading-relaxed mb-1.5">
          {formatInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  return elements;
};

const parseQuizFromNotes = (notesText) => {
  if (!notesText) return [];
  const qaPairs = [];
  const questionRegex = /(?:\*\*Question\s*(\d+)?:\*\*|Question\s*(\d+)?:\s*)([^\n]+(?:\n(?!\*\*Answer|\*\*Question|###|---)[^\n]+)*)/gi;
  const answerRegex = /(?:\*\*Answer\s*(\d+)?:\*\*|Answer\s*(\d+)?:\s*)([^\n]+(?:\n(?!\*\*Answer|\*\*Question|###|---)[^\n]+)*)/gi;

  const questions = [...notesText.matchAll(questionRegex)];
  const answers = [...notesText.matchAll(answerRegex)];

  if (questions.length > 0) {
    questions.forEach((qMatch, index) => {
      const qNum = qMatch[1] || qMatch[2] || index + 1;
      const qText = qMatch[3]?.trim();
      let aText = answers[index]?.[3]?.trim();
      if (!aText) {
        const matchingA = answers.find(a => (a[1] || a[2]) === String(qNum));
        if (matchingA) aText = matchingA[3]?.trim();
      }
      if (qText) {
        qaPairs.push({
          id: index,
          questionNumber: qNum,
          question: qText.replace(/^\*+|\*+$/g, '').trim(),
          answer: aText ? aText.replace(/^\*+|\*+$/g, '').trim() : 'No answer provided.',
        });
      }
    });
  }
  return qaPairs;
};

const SpeedDropdown = ({ playbackRate, handlePlaybackRateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-xl bg-[#111726] border border-white/[0.08] hover:border-blue-500/40 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-between gap-2 shadow-sm transition-all cursor-pointer"
      >
        <span>{playbackRate}x Speed</span>
        <ChevronRight size={13} className={`transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 w-32 py-1 rounded-xl bg-[#0c101d] border border-white/[0.12] shadow-2xl z-[99999] overflow-hidden"
          >
            {speeds.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  handlePlaybackRateChange(rate);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-blue-600/20 text-blue-400 font-black'
                    : 'text-slate-300 hover:bg-[#131929] hover:text-white'
                }`}
              >
                <span>{rate}x Speed</span>
                {playbackRate === rate && <Check size={13} className="text-blue-400" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResourceSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className="relative w-full z-[100005]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 rounded-xl bg-[#05070e] border border-white/[0.08] hover:border-blue-500/40 text-xs font-medium text-slate-200 flex items-center justify-between gap-2 shadow-sm transition-all cursor-pointer text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : '-- Select a resource from your library --'}</span>
        <ChevronRight size={14} className={`transition-transform duration-200 shrink-0 text-slate-400 ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto custom-scrollbar py-1 rounded-xl bg-[#0c101d] border border-white/[0.12] shadow-2xl z-[100010]"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  String(value) === String(opt.value)
                    ? 'bg-blue-600/20 text-blue-400 font-bold'
                    : 'text-slate-300 hover:bg-[#131929] hover:text-white'
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {String(value) === String(opt.value) && <Check size={13} className="text-blue-400 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VideoDetailSidebar = ({
  activeVideo,
  setActiveVideoId,
  iframeRef,
  embedUrl,
  isPlaying,
  playbackRate,
  setPlaybackRate,
  onToggleComplete,
  onAddBookmark,
  onSaveBookmark,
  onDeleteBookmark,
  updateVideoData,
  courses,
  projects,
  allResources = []
}) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [subTab, setSubTab] = useState('overview');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  
  const [likeCount, setLikeCount] = useState(1200);
  const [isLiked, setIsLiked] = useState(false);
  const [isSavedToList, setIsSavedToList] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState(5);
  const [selectedChapterTime, setSelectedChapterTime] = useState(21521);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isGeneratingAISummary, setIsGeneratingAISummary] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [resourceSourceTab, setResourceSourceTab] = useState('existing');
  const [selectedExistingResourceId, setSelectedExistingResourceId] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceLinkUrl, setResourceLinkUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleConnectExistingResource = (e) => {
    e.preventDefault();
    if (!selectedExistingResourceId) {
      toast.error('Please select a resource from your library');
      return;
    }
    const found = allResources.find(r => String(r.id) === String(selectedExistingResourceId));
    if (!found) return;

    const newRes = {
      id: found.id || Date.now().toString(),
      name: found.name,
      url: found.url || undefined,
      size: found.type || found.category || 'Resource',
      content: found.description || `Connected from Resources Library (${found.name})`,
      dateAdded: new Date().toLocaleDateString(),
      courseId: activeVideo.id,
      courseTitle: activeVideo.title
    };

    const existing = activeVideo.resources || [];
    if (existing.some(r => String(r.id) === String(newRes.id))) {
      toast.error('This resource is already connected');
      return;
    }

    const updated = [newRes, ...existing];
    updateVideoData(activeVideo.id, { resources: updated });
    setSelectedExistingResourceId('');
    setShowAddResourceModal(false);
    toast.success(`Connected "${found.name}"!`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const newRes = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`,
        content: content,
        type: file.type || 'file',
        dateAdded: new Date().toLocaleDateString(),
        courseId: activeVideo.id,
        courseTitle: activeVideo.title
      };
      const existing = activeVideo.resources || [];
      const updated = [newRes, ...existing];
      updateVideoData(activeVideo.id, { resources: updated });
      toast.success(`Uploaded ${file.name}`);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleCreateResource = (e) => {
    e.preventDefault();
    if (!resourceName.trim()) return;
    const newRes = {
      id: Date.now().toString(),
      name: resourceName.trim(),
      url: resourceLinkUrl.trim() || undefined,
      size: resourceLinkUrl.trim() ? 'Web Link' : 'Attachment',
      content: resourceLinkUrl.trim() ? `Link: ${resourceLinkUrl.trim()}` : `# ${resourceName.trim()}\n\nCourse Resource attached to: ${activeVideo.title}\nAdded on: ${new Date().toLocaleString()}`,
      dateAdded: new Date().toLocaleDateString(),
      courseId: activeVideo.id,
      courseTitle: activeVideo.title
    };
    const existing = activeVideo.resources || [];
    const updated = [newRes, ...existing];
    updateVideoData(activeVideo.id, { resources: updated });
    setResourceName('');
    setResourceLinkUrl('');
    setShowAddResourceModal(false);
    toast.success(`Resource added!`);
  };

  const handleDeleteResource = (resId) => {
    const existing = activeVideo.resources || [];
    const updated = existing.filter(r => r.id !== resId);
    updateVideoData(activeVideo.id, { resources: updated });
    toast.success('Resource removed');
  };

  // Bookmark Management State & Handlers
  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [editBookmarkNote, setEditBookmarkNote] = useState('');
  const [editBookmarkTimeStr, setEditBookmarkTimeStr] = useState('');

  const handleStartEditBookmark = (b) => {
    setEditingBookmarkId(b.id);
    setEditBookmarkNote(b.note || '');
    setEditBookmarkTimeStr(formatTime(b.time));
  };

  const handleSaveEditBookmark = (bId) => {
    let newTime = 0;
    if (editBookmarkTimeStr) {
      const parts = editBookmarkTimeStr.split(':').map(p => parseInt(p, 10) || 0);
      if (parts.length === 3) {
        newTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        newTime = parts[0] * 60 + parts[1];
      } else if (parts.length === 1) {
        newTime = parts[0];
      }
    }

    const existing = activeVideo?.bookmarks || [];
    const updated = existing.map(b => {
      if (b.id === bId) {
        return { ...b, note: editBookmarkNote.trim() || 'Bookmark', time: newTime };
      }
      return b;
    });

    if (onSaveBookmark) {
      onSaveBookmark(updated);
    } else {
      updateVideoData(activeVideo.id, { bookmarks: updated });
    }

    setEditingBookmarkId(null);
    toast.success('Bookmark updated!');
  };

  const handleDeleteBookmarkItem = (bId) => {
    if (onDeleteBookmark) {
      onDeleteBookmark(bId);
    } else {
      const existing = activeVideo?.bookmarks || [];
      const updated = existing.filter(b => b.id !== bId);
      updateVideoData(activeVideo.id, { bookmarks: updated });
    }
    toast.success('Bookmark deleted');
  };

  const handleCreateBookmarkNow = () => {
    const newBookmark = {
      id: Date.now().toString(),
      time: selectedChapterTime || 0,
      note: 'New Chapter Bookmark'
    };
    const existing = activeVideo?.bookmarks || [];
    const updated = [newBookmark, ...existing];
    if (onSaveBookmark) {
      onSaveBookmark(updated);
    } else {
      updateVideoData(activeVideo.id, { bookmarks: updated });
    }
    handleStartEditBookmark(newBookmark);
    toast.success('Bookmark added at current time!');
  };
  
  // Related Courses State (Real YouTube Related Videos)
  const [fetchedRelated, setFetchedRelated] = useState([]);
  const [isFetchingRelated, setIsFetchingRelated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (subTab === 'related' && activeVideo) {
      const m = activeVideo.url?.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
      const videoId = m ? m[1] : null;
      if (fetchedRelated.length === 0 && !isFetchingRelated) {
        setIsFetchingRelated(true);
        fetchYouTubeRelatedVideos(videoId, activeVideo.title)
          .then(items => {
            if (isMounted && items.length > 0) {
              setFetchedRelated(items);
            }
          })
          .catch(err => console.error(err))
          .finally(() => { if (isMounted) setIsFetchingRelated(false); });
      }
    }
    return () => { isMounted = false; };
  }, [subTab, activeVideo, fetchedRelated.length, isFetchingRelated]);

  // YouTube API Chapters State
  const [fetchedChapters, setFetchedChapters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (activeVideo) {
      const m = activeVideo.url?.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
      const videoId = m ? m[1] : null;
      if (videoId) {
        fetchYouTubeChapters(videoId)
          .then(chapters => {
            if (isMounted && chapters.length > 0) {
              setFetchedChapters(chapters);
            }
          })
          .catch(err => console.error(err));
      }
    }
    return () => { isMounted = false; };
  }, [activeVideo]);

  const courseChapters = useMemo(() => {
    if (fetchedChapters.length > 0) return fetchedChapters;
    if (activeVideo?.chapters && Array.isArray(activeVideo.chapters) && activeVideo.chapters.length > 0) {
      return activeVideo.chapters;
    }
    const parsedFromDesc = parseChaptersFromText(activeVideo?.description);
    if (parsedFromDesc.length > 0) return parsedFromDesc;

    const parsedFromNotes = parseChaptersFromText(activeVideo?.videoNotes);
    if (parsedFromNotes.length > 0) return parsedFromNotes;

    return DEFAULT_CHAPTERS;
  }, [fetchedChapters, activeVideo]);

  const nextChapter = useMemo(() => {
    if (!courseChapters || courseChapters.length === 0) {
      return { title: 'Next Section', startSec: 0, range: '00:00' };
    }
    const currentIdx = courseChapters.findIndex(c => c.id === activeChapterId);
    if (currentIdx >= 0 && currentIdx < courseChapters.length - 1) {
      return courseChapters[currentIdx + 1];
    }
    return courseChapters[0];
  }, [courseChapters, activeChapterId]);

  const realProgressPercentage = useMemo(() => {
    let totalSec = 42682; // 11:51:22 (42,682 seconds)
    const rawDuration = activeVideo?.duration;
    if (typeof rawDuration === 'number' && rawDuration > 0) {
      totalSec = rawDuration;
    } else if (typeof rawDuration === 'string') {
      const hrsMatch = rawDuration.match(/(\d+)\s*h/i);
      const minsMatch = rawDuration.match(/(\d+)\s*m/i);
      const h = hrsMatch ? parseInt(hrsMatch[1], 10) : 0;
      const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
      if (h > 0 || m > 0) {
        totalSec = h * 3600 + m * 60;
      }
    }

    const curSec = selectedChapterTime || activeVideo?.lastPosition || 0;
    if (totalSec > 0) {
      const pct = Math.round((curSec / totalSec) * 100);
      return Math.min(100, Math.max(0, pct));
    }

    return 50;
  }, [selectedChapterTime, activeVideo]);

  const cleanNextTitle = useMemo(() => {
    if (!nextChapter?.title) return 'Next Chapter';
    return nextChapter.title.replace(/^\d+[\.\s\)]+/, '').replace(/^[\.\s\)]+/, '').trim();
  }, [nextChapter]);

  const relatedVideos = useMemo(() => {
    if (fetchedRelated.length > 0) return fetchedRelated;
    if (courses && Array.isArray(courses) && courses.length > 0) {
      return courses.filter(c => String(c.id) !== String(activeVideo?.id)).slice(0, 4);
    }
    return [];
  }, [fetchedRelated, courses, activeVideo]);

  // YouTube Comments State
  const [fetchedComments, setFetchedComments] = useState([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (subTab === 'discussion' && activeVideo) {
      const m = activeVideo.url?.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
      const videoId = m ? m[1] : null;
      if (videoId && fetchedComments.length === 0 && !isFetchingComments) {
        setIsFetchingComments(true);
        fetchYouTubeComments(videoId)
          .then(comments => {
            if (isMounted && comments.length > 0) {
              setFetchedComments(comments);
            }
          })
          .catch(err => console.error(err))
          .finally(() => { if (isMounted) setIsFetchingComments(false); });
      }
    }
    return () => { isMounted = false; };
  }, [subTab, activeVideo, fetchedComments.length, isFetchingComments]);

  const courseDiscussions = useMemo(() => {
    const userComments = activeVideo?.discussions || [];
    return [...userComments, ...fetchedComments];
  }, [activeVideo?.discussions, fetchedComments]);

  const [newCommentText, setNewCommentText] = useState('');

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      author: 'You',
      time: 'Just now',
      text: newCommentText.trim(),
      likes: 0,
      replies: 0
    };
    const existing = activeVideo?.discussions || [];
    const updated = [newComment, ...existing];
    updateVideoData(activeVideo.id, { discussions: updated });
    setNewCommentText('');
    toast.success('Comment posted!');
  };

  const handleLikeComment = (commentId) => {
    const existing = activeVideo?.discussions || [];
    const updated = existing.map(c => {
      if (c.id === commentId) {
        return { ...c, likes: (c.likes || 0) + 1 };
      }
      return c;
    });
    updateVideoData(activeVideo.id, { discussions: updated });
  };

  // Transcript State
  const [transcript, setTranscript] = useState(null);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState(null);
  const [transcriptQuery, setTranscriptQuery] = useState('');
  
  // Quiz State
  const [revealedAnswers, setRevealedAnswers] = useState({});

  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'transcript' && !transcript && !isFetchingTranscript && activeVideo) {
      setIsFetchingTranscript(true);
      setTranscriptError(null);
      const m = activeVideo.url?.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
      const videoId = m ? m[1] : null;
      if (videoId) {
        fetchTranscript(videoId)
          .then(data => { if (isMounted) setTranscript(data); })
          .catch(err => { if (isMounted) setTranscriptError(err.message); })
          .finally(() => { if (isMounted) setIsFetchingTranscript(false); });
      } else {
        setIsFetchingTranscript(false);
        setTranscriptError("Invalid YouTube URL.");
      }
    }
    return () => { isMounted = false; };
  }, [activeTab, activeVideo, transcript]);

  if (!activeVideo) return null;

  const seekToTime = (seconds) => {
    setIsPlayingVideo(true);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
    }
  };

  const handleInsertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('notes-editor-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentNotes = activeVideo.videoNotes || `This is the notes page\n\nThis quiz is based on the foundational concepts introduced in the Harvard CS50's Artificial Intelligence with Python course.\n\n### CS50 AI: Active Recall Quiz\n\n**Question 1:** In the context of search algorithms, what is the primary difference between a **Breadth-First Search (BFS)** and a **Depth-First Search (DFS)** regarding their strategy for exploring a state space?`;
    const selectedText = currentNotes.substring(start, end);
    const newText = currentNotes.substring(0, start) + prefix + selectedText + suffix + currentNotes.substring(end);
    updateVideoData(activeVideo.id, { videoNotes: newText });
  };

  const handleAISummarize = () => {
    setIsGeneratingAISummary(true);
    setTimeout(() => {
      const summaryText = `\n\n### ✨ AI Generated Key Takeaways\n- **Search Problems**: Defined by initial state, actions, transition model, goal test, and path cost function.\n- **Uninformed Search**: BFS guarantees optimality for step cost 1; DFS explores deepest node first.\n- **Informed Search**: A* uses heuristic function $h(n)$ to minimize total cost $f(n) = g(n) + h(n)$.`;
      const currentNotes = activeVideo.videoNotes || `This is the notes page\n\nThis quiz is based on the foundational concepts introduced in the Harvard CS50's Artificial Intelligence with Python course.`;
      updateVideoData(activeVideo.id, { videoNotes: currentNotes + summaryText });
      setIsGeneratingAISummary(false);
      toast.success('AI summary added to notes!');
    }, 1000);
  };



  const handleExportNotes = () => {
    if (!activeVideo.videoNotes) {
      toast.error('No notes to export');
      return;
    }
    const blob = new Blob([activeVideo.videoNotes], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(activeVideo.title || 'course').replace(/[^a-z0-9]/gi, '_')}_notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Notes exported as Markdown');
  };

  const noteWordCount = activeVideo.videoNotes ? activeVideo.videoNotes.trim().split(/\s+/).filter(Boolean).length : 534;

  const parsedQuizItems = useMemo(() => {
    return parseQuizFromNotes(activeVideo?.videoNotes);
  }, [activeVideo?.videoNotes]);

  const filteredTranscript = useMemo(() => {
    if (!transcript) return [];
    if (!transcriptQuery.trim()) return transcript;
    const q = transcriptQuery.toLowerCase();
    return transcript.filter(line => line.text.toLowerCase().includes(q));
  }, [transcript, transcriptQuery]);

  const defaultNotesText = activeVideo.videoNotes || `This is the notes page\n\nThis quiz is based on the foundational concepts introduced in the Harvard CS50's Artificial Intelligence with Python course.\n\n### CS50 AI: Active Recall Quiz\n\n**Question 1:** In the context of search algorithms, what is the primary difference between a **Breadth-First Search (BFS)** and a **Depth-First Search (DFS)** regarding their strategy for exploring a state space?`;

  const formatDuration = (val) => {
    if (!val) return '1h 34m';
    if (typeof val === 'string' && (val.includes('h') || val.includes('m')) && !val.match(/^\d+\.?\d*$/)) {
      return val;
    }
    const sec = parseFloat(val);
    if (isNaN(sec) || sec <= 0) return '1h 34m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const courseTitle = activeVideo.title || "CS50's Artificial Intelligence with Python";
  const channelName = activeVideo.channelTitle || activeVideo.channel || activeVideo.author || activeVideo.uploader || "Harvard University";
  const authorName = activeVideo.instructor || activeVideo.author || activeVideo.channelTitle || "David J. Malan";
  const courseLevel = activeVideo.level || activeVideo.difficulty || "Intermediate";
  const lectureCount = activeVideo.lectures || activeVideo.playlistCount || DEFAULT_CHAPTERS.length;
  const durationText = formatDuration(activeVideo.duration || activeVideo.durationSec);
  const channelAvatar = activeVideo.channelImage || activeVideo.authorImage || activeVideo.thumbnail || activeVideo.channelThumbnail;

  const handlePlaybackRateChange = (rate) => {
    const numericRate = typeof rate === 'object' ? Number(rate?.target?.value || 1) : Number(rate);
    setPlaybackRate(numericRate);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [numericRate] }), '*');
    }
  };

  const courseResources = useMemo(() => {
    if (activeVideo?.resources && Array.isArray(activeVideo.resources)) {
      return activeVideo.resources;
    }
    return [];
  }, [activeVideo]);

  const handleDownloadResource = (res) => {
    const fileContent = res.content || `# ${res.name || 'Resource File'}\n\nDownloaded resource for: ${activeVideo?.title || 'Course'}\nTimestamp: ${new Date().toLocaleString()}`;
    const blob = new Blob([fileContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', res.name || 'resource_file.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${res.name || 'file'}`);
  };

  const courseDescription = activeVideo.description || activeVideo.summary || "This is CS50's introduction to the intellectual enterprises of artificial intelligence and its impact on the world. Topics include search, knowledge representation, uncertainty, optimization, learning, and neural networks.";
  
  const courseTags = useMemo(() => {
    if (activeVideo?.tags && Array.isArray(activeVideo.tags) && activeVideo.tags.length > 0) {
      return activeVideo.tags.slice(0, 4);
    }
    const words = (activeVideo?.title || 'AI Python Algorithms').split(/\s+/).filter(w => w.length > 2);
    return Array.from(new Set(words)).slice(0, 4);
  }, [activeVideo]);

  const learningOutcomes = useMemo(() => {
    if (activeVideo?.learningOutcomes && Array.isArray(activeVideo.learningOutcomes)) {
      return activeVideo.learningOutcomes;
    }
    return [
      'Search algorithms (BFS, DFS, A*)',
      'Optimization (Minimax, Alpha-Beta)',
      'Knowledge representation',
      'Machine learning fundamentals'
    ];
  }, [activeVideo]);

  const enrolledCount = useMemo(() => {
    if (activeVideo?.viewCount) {
      const v = Number(activeVideo.viewCount);
      return v > 1000 ? `${(v / 1000).toFixed(0)}K+` : `${v}`;
    }
    return '120K+';
  }, [activeVideo]);

  const ratingData = useMemo(() => {
    const rating = activeVideo?.rating || 4.9;
    const count = activeVideo?.reviewCount || (activeVideo?.likeCount ? Math.floor(activeVideo.likeCount * 10.4) : 12500);
    const formattedReviews = count > 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
    const breakdown = activeVideo?.ratingBreakdown || [
      { stars: 5, pct: '92%' },
      { stars: 4, pct: '6%' },
      { stars: 3, pct: '1.5%' },
      { stars: 2, pct: '0.3%' },
      { stars: 1, pct: '0.2%' },
    ];
    return { rating, formattedReviews, breakdown };
  }, [activeVideo]);

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#05070e] text-[#e2e8f0] flex flex-col font-sans select-none overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Height 40px, Compact Grid)
         ───────────────────────────────────────────────────────────────────────── */}
      <header className="h-10 bg-[#080b15] border-b border-white/[0.08] shrink-0">
        <div className="max-w-[1680px] w-full mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setActiveVideoId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#121828] transition-colors flex items-center gap-1.5 text-[11px] font-semibold"
            >
              <ArrowLeft size={13} />
              <span>All Courses</span>
            </button>
            <span className="text-slate-600 text-[11px]">›</span>
            <h1 className="text-[11px] font-bold text-slate-200 truncate">
              {courseTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Fullscreen Toggle Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-2.5 py-1 rounded-lg bg-[#111726] border border-white/[0.08] text-[11px] font-bold text-slate-300 hover:text-white hover:bg-[#182034] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <Maximize2 size={12} />
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={() => setActiveVideoId(null)}
              className="w-7 h-7 rounded-lg bg-[#111726] hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors border border-white/[0.08] cursor-pointer shadow-sm"
              title="Close Course Player"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. STRICT 12-COLUMN DASHBOARD GRID (8 Cols / 4 Cols Split)
         ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto p-3 grid grid-cols-12 gap-3 overflow-hidden bg-[#05070e]">
        
        {/* LEFT COLUMN: 8 Columns (~66% Width) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0 bg-[#0a0d18] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            
            {/* COURSE BRANDING HEADER */}
            <div className="py-2.5 px-4 bg-[#0c101d] border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-3.5">
                {/* Dynamic Channel Logo / Avatar */}
                {channelAvatar ? (
                  <img
                    src={channelAvatar}
                    alt={channelName}
                    className="w-10 h-10 rounded-full border-2 border-blue-500/40 object-cover shadow-xl shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#800000] border-2 border-amber-400/60 shadow-xl flex items-center justify-center p-0.5 shrink-0 relative overflow-hidden">
                    <div className="text-center font-serif text-[7px] font-black text-amber-200 leading-none tracking-tighter uppercase select-none">
                      <div className="mb-0.5 border-b border-amber-300/30 pb-0.5">VE</div>
                      <div className="mb-0.5 border-b border-amber-300/30 pb-0.5">RI</div>
                      <div>TAS</div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-blue-400">{channelName}</span>
                    <div className="w-3 h-3 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px] font-black">✓</div>
                  </div>
                  <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {courseTitle}
                  </h1>
                  
                  {/* Instructor & Info Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#111726] border border-white/[0.08] text-[10px] font-medium text-slate-200">
                      <User size={10} className="text-blue-400" />
                      <span>By {authorName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#111726] border border-white/[0.08] text-[10px] font-medium text-slate-300">Course Level: {courseLevel}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#111726] border border-white/[0.08] text-[10px] font-medium text-slate-300">Lectures: {lectureCount}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#111726] border border-white/[0.08] text-[10px] font-medium text-slate-300">Duration: {durationText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VIDEO PLAYER CONTAINER (Aspect ratio 16:9, Hero Display) */}
            <div className="w-full aspect-video min-h-[360px] lg:min-h-[440px] bg-black relative shrink-0 overflow-hidden border-b border-white/[0.08]">
              {/* Direct YouTube Embed Player */}
              <iframe
                id="yt-player"
                ref={iframeRef}
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>

            {/* ACTION BUTTONS ROW */}
            <div className="py-2 px-4 bg-[#080b15] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onToggleComplete(activeVideo)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    activeVideo.completed
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-[#111726] hover:bg-[#182034] text-slate-200 border border-white/[0.08]'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>Mark as Complete</span>
                </button>

                <button
                  onClick={() => {
                    setIsSavedToList(!isSavedToList);
                    toast.success(isSavedToList ? 'Removed from list' : 'Saved to My List!');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    isSavedToList
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                      : 'bg-[#111726] hover:bg-[#182034] text-slate-200 border border-white/[0.08]'
                  }`}
                >
                  <Bookmark size={13} />
                  <span>{isSavedToList ? 'In My List' : 'Add to My List'}</span>
                </button>

                <button
                  onClick={handleExportNotes}
                  className="px-3 py-1.5 rounded-lg bg-[#111726] hover:bg-[#182034] text-slate-200 border border-white/[0.08] text-[11px] font-bold transition-all flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeVideo.url);
                    toast.success('Link copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#111726] hover:bg-[#182034] text-slate-200 border border-white/[0.08] text-[11px] font-bold transition-all flex items-center gap-1.5"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => {
                    setIsLiked(!isLiked);
                    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    isLiked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-[#111726] hover:bg-[#182034] text-amber-400 border border-white/[0.08]'
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>{(likeCount / 1000).toFixed(1)}K</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <SpeedDropdown
                  playbackRate={playbackRate}
                  handlePlaybackRateChange={handlePlaybackRateChange}
                />
              </div>
            </div>

            {/* SUB-TABS ROW (REACT LUCIDE ICON COMPONENTS) */}
            <div className="px-4 pt-2 border-b border-white/[0.08] flex items-center gap-5 bg-[#0a0d18]">
              {[
                { id: 'overview', label: 'Overview', icon: PlayCircle },
                { id: 'resources', label: 'Resources', badge: courseResources.length > 0 ? String(courseResources.length) : null, icon: FileText },
                { id: 'discussion', label: 'Discussion', badge: courseDiscussions.length > 0 ? String(courseDiscussions.length) : null, icon: MessageSquare },
                { id: 'notes-summary', label: 'Notes', icon: BookOpen },
                { id: 'related', label: 'Related', icon: Layers },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = subTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setSubTab(tab.id)}
                    className={`pb-2 text-[11px] font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
                      isActive ? 'text-blue-400 font-black' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent size={13} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] bg-[#111726] text-slate-400 font-bold border border-white/[0.08]">
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div layoutId="subTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB PANELS CONTENT */}
            {subTab === 'overview' ? (
              <div className="p-3 grid grid-cols-3 gap-3 bg-[#05070e] flex-1 min-h-[240px]">
                {/* Card 1: About this Course */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-3 rounded-xl bg-[#0a0d18] border border-white/[0.08] hover:border-blue-500/30 flex flex-col justify-between gap-2 shadow-lg transition-all"
                >
                  <div>
                    <h3 className="text-[10px] font-bold uppercase text-slate-300 tracking-wider mb-1.5">About this course</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-4">
                      {courseDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {courseTags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Card 2: What You'll Learn */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-3 rounded-xl bg-[#0a0d18] border border-white/[0.08] hover:border-blue-500/30 flex flex-col justify-between gap-2 shadow-lg transition-all"
                >
                  <div>
                    <h3 className="text-[10px] font-bold uppercase text-slate-300 tracking-wider mb-2">What you'll learn</h3>
                    <ul className="space-y-1.5 text-[11px] font-medium text-slate-300">
                      {learningOutcomes.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">✓</div>
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => setShowSyllabusModal(true)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>› See Full Syllabus</span>
                  </button>
                </motion.div>

                {/* Card 3: Rating / Reviews */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-3 rounded-xl bg-[#0a0d18] border border-white/[0.08] hover:border-blue-500/30 flex flex-col justify-between gap-2 shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-slate-100">{ratingData.rating}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({ratingData.formattedReviews} reviews)</span>
                    </div>

                    <div className="space-y-1 text-[9px] font-bold text-slate-400">
                      {ratingData.breakdown.map(r => (
                        <div key={r.stars} className="flex items-center gap-1.5">
                          <span className="w-2.5">{r.stars}★</span>
                          <div className="flex-1 h-1 rounded-full bg-[#111726] overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: r.pct }} />
                          </div>
                          <span className="w-6 text-right font-mono text-slate-500">{r.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <Globe size={12} className="text-blue-400" />
                    <span>{enrolledCount} students enrolled</span>
                  </div>
                </motion.div>
              </div>
            ) : subTab === 'resources' ? (
              <div className="p-4 bg-[#05070e] flex-1 min-h-[240px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-300">Course Resources ({courseResources.length})</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-[#111726] hover:bg-[#182034] text-blue-400 border border-blue-500/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={12} />
                        <span>Upload File</span>
                      </button>
                      <button
                        onClick={() => setShowAddResourceModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Plus size={12} />
                        <span>Add Resource</span>
                      </button>
                    </div>
                  </div>

                  {courseResources.length > 0 ? (
                    <div className="space-y-2">
                      {courseResources.map((res, i) => {
                        const ResIcon = res.icon || FileText;
                        return (
                          <div key={res.id || i} className="p-3 rounded-xl bg-[#0a0d18] border border-white/[0.08] hover:border-blue-500/30 transition-all flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                <ResIcon size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-200">{res.name}</p>
                                <span className="text-[10px] text-slate-500">{res.size || 'Attachment'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {res.url ? (
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-[#111726] hover:bg-[#182034] text-blue-400 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink size={12} />
                                  <span>Open</span>
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleDownloadResource(res)}
                                  className="px-3 py-1.5 rounded-lg bg-[#111726] hover:bg-blue-600 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Download size={13} />
                                  <span>Download</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteResource(res.id)}
                                className="p-1.5 rounded-lg bg-[#111726] hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors border border-white/[0.08] cursor-pointer"
                                title="Delete Resource"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full min-h-[180px] text-center flex flex-col items-center justify-center bg-[#0a0d18] rounded-xl border border-white/[0.08] p-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#111726] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-3">
                        <FileText size={22} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300 mb-1">No Resources Available</h4>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed mb-3">There are currently no downloadable files or attachments uploaded for this course.</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Upload First Resource</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : subTab === 'discussion' ? (
              <div className="p-4 flex flex-col gap-3 bg-[#05070e] flex-1 min-h-[240px]">
                {/* Post New Comment */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or start a discussion..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0a0d18] border border-white/[0.08] text-xs text-slate-200 outline-none focus:border-blue-500/40"
                  />
                  <button type="submit" className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                    <Send size={13} />
                    <span>Post</span>
                  </button>
                </form>

                {/* Discussion Thread List */}
                {isFetchingComments && courseDiscussions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                    <Sparkles size={14} className="animate-spin text-blue-400" />
                    <span>Fetching YouTube comments...</span>
                  </div>
                ) : courseDiscussions.length > 0 ? (
                  <div className="space-y-2">
                    {courseDiscussions.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-[#0a0d18] border border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            {d.avatar ? (
                              <img src={d.avatar} alt={d.author} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-black text-[9px] flex items-center justify-center border border-blue-500/30">
                                {d.author?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <span className="font-bold text-slate-200">{d.author}</span>
                          </div>
                          <span className="text-slate-500 font-medium">{d.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-7">{d.text}</p>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 pt-1 pl-7">
                          <button
                            onClick={() => handleLikeComment(d.id)}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <ThumbsUp size={11} /> {d.likes > 999 ? `${(d.likes / 1000).toFixed(1)}K` : d.likes || 0}
                          </button>
                          {d.replies > 0 && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <MessageSquare size={11} /> {d.replies} replies
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] text-center flex flex-col items-center justify-center bg-[#0a0d18] rounded-xl border border-white/[0.08] p-6 my-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#111726] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-3">
                      <MessageSquare size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300 mb-1">No Discussions Yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">Be the first student to post a question or start a discussion for this video!</p>
                  </div>
                )}
              </div>
            ) : subTab === 'notes-summary' ? (
              <div className="p-4 bg-[#05070e] flex-1 min-h-[240px] space-y-2">
                <h3 className="text-xs font-bold text-slate-300">Course Notes Overview</h3>
                <div className="p-4 rounded-xl bg-[#0a0d18] border border-white/[0.08] text-xs text-slate-300 leading-relaxed shadow-sm">
                  {renderMarkdownHtml(defaultNotesText)}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#05070e] flex-1 min-h-[240px] space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300">Related YouTube Videos</h3>
                  {isFetchingRelated && (
                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                      <Sparkles size={11} className="animate-spin" /> Fetching...
                    </span>
                  )}
                </div>
                {isFetchingRelated && relatedVideos.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                    <Sparkles size={14} className="animate-spin text-blue-400" />
                    <span>Searching related YouTube courses...</span>
                  </div>
                ) : relatedVideos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {relatedVideos.map((item, i) => (
                      <a
                        key={item.id || i}
                        href={item.url || `https://www.youtube.com/watch?v=${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-[#0a0d18] border border-white/[0.08] hover:border-blue-500/40 transition-all text-left group flex flex-col justify-between gap-2 shadow-sm"
                      >
                        <div className="flex gap-2 items-start">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="w-16 h-10 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-16 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                              <PlayCircle size={18} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">{item.title || item.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pt-1 border-t border-white/[0.04]">
                          <span className="truncate max-w-[110px] text-slate-400">{item.channelTitle || item.category || 'YouTube'}</span>
                          <span className="text-blue-400 flex items-center gap-0.5"><ExternalLink size={10} /> Watch</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] text-center flex flex-col items-center justify-center bg-[#0a0d18] rounded-xl border border-white/[0.08] p-6 my-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#111726] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-3">
                      <Layers size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300 mb-1">No Related Videos</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">No YouTube videos found matching this topic.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Columns (~33% Width) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0 bg-[#0a0d18] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">
          
          {/* Top Pill Nav Bar (Lucide Icons, Dynamic Badges) */}
          <div className="p-2 border-b border-white/[0.08] bg-[#0c101d] flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
            {[
              { id: 'notes', label: 'NOTES', icon: BookOpen },
              { id: 'contents', label: 'CONTENTS', icon: List },
              { id: 'transcript', label: 'TRANSCRIPT', icon: FileText },
              { id: 'quiz', label: 'QUIZ', icon: HelpCircle },
              { id: 'bookmarks', label: 'BOOKMARKS', badge: activeVideo?.bookmarks?.length || 0, icon: Bookmark },
            ].map(t => {
              const TabIcon = t.icon;
              const isActive = activeTab === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-1.5 px-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#111726]/60'
                  }`}
                >
                  <TabIcon size={12} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span className="whitespace-nowrap">{t.label}</span>
                  {t.badge !== undefined && t.badge > 0 && (
                    <span className={`px-1 py-0.2 rounded-full text-[8px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Workspace Panel Container */}
          <div className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden relative bg-[#0a0d18]">
            {activeTab === 'notes' ? (
              <div className="flex-1 flex flex-col min-h-0">
                
                {/* Formatting Toolbar + Mode Toggle */}
                <div className="p-2 mb-2.5 rounded-xl bg-[#05070e] border border-white/[0.08] flex items-center justify-between text-[11px] shrink-0 shadow-sm flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    {/* Mode Toggle Button */}
                    <button
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isEditingNotes
                          ? 'bg-blue-600 text-white shadow-blue-600/30'
                          : 'bg-[#111726] text-blue-400 hover:bg-blue-600/20 border border-blue-500/30'
                      }`}
                    >
                      {isEditingNotes ? <Eye size={11} /> : <FileText size={11} />}
                      <span>{isEditingNotes ? 'Done / Preview' : 'Edit Raw Notes'}</span>
                    </button>

                    {isEditingNotes && (
                      <>
                        <div className="h-3 w-[1px] bg-white/[0.08] mx-1" />
                        <button onClick={() => handleInsertFormatting('**', '**')} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-[#111726] transition-colors"><Bold size={12} /></button>
                        <button onClick={() => handleInsertFormatting('*', '*')} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-[#111726] transition-colors"><Italic size={12} /></button>
                        <button onClick={() => handleInsertFormatting('`', '`')} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-[#111726] transition-colors"><Code size={12} /></button>
                        <button onClick={() => handleInsertFormatting('- ')} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-[#111726] transition-colors"><List size={12} /></button>
                        <button onClick={() => handleInsertFormatting('1. ')} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-[#111726] transition-colors"><ListOrdered size={12} /></button>
                      </>
                    )}
                    
                    {/* ✨ AI Note Summary Button */}
                    <button
                      onClick={handleAISummarize}
                      disabled={isGeneratingAISummary}
                      className="px-2.5 py-1 ml-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles size={11} className={isGeneratingAISummary ? 'animate-spin' : ''} />
                      <span>{isGeneratingAISummary ? 'Generating...' : 'AI Summary'}</span>
                    </button>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    ✓ Saved
                  </span>
                </div>

                {/* Notes Container: Either Formatted Preview OR Textarea Editor */}
                <div className="flex-1 rounded-xl bg-[#05070e] border border-white/[0.08] p-3.5 flex flex-col min-h-0 shadow-inner">
                  {isEditingNotes ? (
                    <textarea
                      id="notes-editor-textarea"
                      className="w-full flex-1 bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-medium leading-relaxed custom-scrollbar pb-2 min-h-[280px]"
                      placeholder="Take notes while watching the course..."
                      value={activeVideo.videoNotes || defaultNotesText}
                      onChange={(e) => updateVideoData(activeVideo.id, { videoNotes: e.target.value })}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => setIsEditingNotes(true)}
                      className="w-full flex-1 overflow-y-auto custom-scrollbar pr-1 cursor-pointer group"
                      title="Click anywhere to edit notes"
                    >
                      {renderMarkdownHtml(activeVideo.videoNotes || defaultNotesText)}
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                    <span>{noteWordCount} words</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> Auto-saved 2m ago</span>
                  </div>
                </div>
              </div>
            ) : activeTab === 'contents' ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h3 className="text-xs font-bold text-slate-200">Table of Contents</h3>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[10px] font-bold text-slate-400">Auto-scroll</span>
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="accent-blue-500 cursor-pointer rounded"
                    />
                  </label>
                </div>

                {/* Lesson Tree */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {courseChapters.map(c => {
                    const isActive = c.id === activeChapterId;

                    return (
                      <div key={c.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setActiveChapterId(c.id);
                            setSelectedChapterTime(c.startSec);
                            seekToTime(c.startSec);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-black shadow-sm'
                              : 'hover:bg-[#111726]/60 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isActive ? (
                              <PlayCircle size={14} className="text-blue-400 shrink-0 animate-pulse" />
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono w-3 text-center shrink-0">{c.num}</span>
                            )}
                            <span className="truncate">{c.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[9px]">
                            <span className="px-1.5 py-0.5 rounded bg-[#111726] text-slate-400 border border-white/[0.06]">{c.range}</span>
                          </div>
                        </button>

                        {c.subItems && isActive && (
                          <div className="border-l-2 border-blue-500/30 pl-3 ml-3 space-y-1 my-1">
                            {c.subItems.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => seekToTime(sub.startSec)}
                                className="w-full p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-400 hover:text-slate-100 hover:bg-[#111726]/50 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span className="truncate pr-2">• {sub.title}</span>
                                <span className="font-mono text-[9px] text-slate-500 px-1.5 py-0.5 rounded bg-[#111726] shrink-0">{sub.range}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Jump Button */}
                <button
                  onClick={() => seekToTime(selectedChapterTime)}
                  className="mt-2.5 w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Clock size={14} />
                  <span>JUMP TO TIMESTAMP ({formatTime(selectedChapterTime)})</span>
                </button>
              </div>
            ) : activeTab === 'transcript' ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-2 relative shrink-0">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search transcript..."
                    value={transcriptQuery}
                    onChange={(e) => setTranscriptQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#05070e] border border-white/[0.08] text-[11px] text-slate-200 outline-none focus:ring-2 ring-blue-500/40"
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 select-text">
                  {filteredTranscript.map((line, idx) => (
                    <button
                      key={idx}
                      onClick={() => seekToTime(line.start)}
                      className="w-full text-left p-1.5 rounded-lg hover:bg-[#111726]/50 flex items-start gap-2 transition-colors"
                    >
                      <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 shrink-0">
                        {formatTime(line.start)}
                      </span>
                      <p className="text-[11px] text-slate-300 font-medium leading-normal">{line.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : activeTab === 'quiz' ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {parsedQuizItems.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-[#05070e] border border-purple-500/30 space-y-2 shadow-sm">
                    <p className="text-xs font-bold text-purple-300 leading-relaxed">
                      Q{idx + 1}: {formatInlineMarkdown(item.question)}
                    </p>
                    {revealedAnswers[item.id] ? (
                      <div className="text-xs text-slate-300 font-medium bg-[#0a0d18] p-3 rounded-lg border border-white/[0.08] leading-relaxed">
                        {formatInlineMarkdown(item.answer)}
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevealedAnswers(prev => ({ ...prev, [item.id]: true }))}
                        className="py-1 px-3 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/25 transition-all cursor-pointer shadow-sm"
                      >
                        Reveal Answer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Bookmarks Header Bar */}
                <div className="flex items-center justify-between mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <Bookmark size={13} className="text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-200">
                      Saved Bookmarks ({activeVideo.bookmarks?.length || 0})
                    </h3>
                  </div>
                  <button
                    onClick={handleCreateBookmarkNow}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Bookmark Now</span>
                  </button>
                </div>

                {/* Bookmark List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {(!activeVideo.bookmarks || activeVideo.bookmarks.length === 0) ? (
                    <div className="p-6 rounded-xl bg-[#05070e] border border-white/[0.08] text-center space-y-2 my-auto">
                      <Bookmark size={24} className="mx-auto text-slate-600" />
                      <p className="text-xs font-bold text-slate-300">No Bookmarks Saved Yet</p>
                      <p className="text-[10px] text-slate-500">
                        Click "+ Bookmark Now" to mark key timestamps and save study notes!
                      </p>
                    </div>
                  ) : (
                    activeVideo.bookmarks.map(b => {
                      const isEditing = editingBookmarkId === b.id;

                      return (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl bg-[#05070e] border border-white/[0.08] hover:border-blue-500/30 transition-all space-y-2 shadow-sm group"
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400">Timestamp:</span>
                                <input
                                  type="text"
                                  value={editBookmarkTimeStr}
                                  onChange={(e) => setEditBookmarkTimeStr(e.target.value)}
                                  placeholder="05:33 or 1:07:41"
                                  className="w-24 px-2 py-0.5 rounded bg-[#0a0d18] border border-white/[0.12] text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <input
                                type="text"
                                value={editBookmarkNote}
                                onChange={(e) => setEditBookmarkNote(e.target.value)}
                                placeholder="Bookmark description / note..."
                                className="w-full px-2.5 py-1 rounded bg-[#0a0d18] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  onClick={() => setEditingBookmarkId(null)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEditBookmark(b.id)}
                                  className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-blue-500"
                                >
                                  <Check size={10} /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                    {formatTime(b.time)}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-200 truncate">{b.note || 'Bookmark'}</p>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Play Timestamp */}
                                <button
                                  onClick={() => seekToTime(b.time)}
                                  title="Play from timestamp"
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer"
                                >
                                  <Play size={12} />
                                </button>

                                {/* Edit Bookmark */}
                                <button
                                  onClick={() => handleStartEditBookmark(b)}
                                  title="Edit bookmark"
                                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                                >
                                  <FileCode size={12} />
                                </button>

                                {/* Delete Bookmark */}
                                <button
                                  onClick={() => handleDeleteBookmarkItem(b.id)}
                                  title="Delete bookmark"
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. BOTTOM FLOATING LEARNING DOCK (Glassmorphic Premium Dock)
         ───────────────────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 max-w-[1680px] w-full mx-auto px-3 pb-2.5">
        <div className="h-16 px-5 rounded-2xl bg-[#080b18]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/80 flex items-center justify-between gap-4">
          
          {/* Real Dynamic Progress Gauge */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 flex items-center justify-center relative font-black text-xs text-blue-400 bg-blue-500/10 shadow-inner shrink-0">
              {realProgressPercentage}%
            </div>
            <div className="hidden sm:flex flex-col gap-1 w-36">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase tracking-wider text-[9px]">Course Progress</span>
                <span className="text-blue-400">{realProgressPercentage}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#111726] overflow-hidden border border-white/[0.05]">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${realProgressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next Up Chapter Card */}
          <button
            onClick={() => {
              if (nextChapter?.startSec !== undefined) {
                setActiveChapterId(nextChapter.id);
                setSelectedChapterTime(nextChapter.startSec);
                seekToTime(nextChapter.startSec);
              }
            }}
            className="hidden md:flex items-center gap-3 p-1.5 px-3.5 rounded-xl bg-[#0b0f1f] border border-white/[0.08] hover:border-blue-500/40 hover:bg-[#11172b] transition-all text-left cursor-pointer group shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <Play size={11} className="fill-blue-400" />
            </div>
            <div className="text-xs min-w-0">
              <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Next Up • {nextChapter.range || '00:00'}</span>
              <span className="font-bold text-slate-200 truncate block max-w-[180px] group-hover:text-blue-300 transition-colors">
                {cleanNextTitle}
              </span>
            </div>
          </button>

          {/* Last Watched & Streak */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-300">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Last watched</span>
              <span className="text-slate-200">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/[0.08]" />
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-amber-300">
              <Flame size={14} className="fill-amber-400 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-black">7 Days Streak</span>
            </div>
          </div>

          {/* Continue Learning CTA Button */}
          <button
            onClick={() => {
              if (isPlayingVideo) {
                setIsPlayingVideo(false);
              } else {
                setIsPlayingVideo(true);
                seekToTime(selectedChapterTime || activeVideo.lastPosition || 0);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 border border-white/20"
          >
            <Play size={13} className="fill-white" />
            <span>{isPlayingVideo ? 'Playing Now' : 'Continue Learning'}</span>
          </button>
        </div>
      </footer>

      {/* SYLLABUS MODAL */}
      <AnimatePresence>
        {showSyllabusModal && (
          <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#0a0d18] border border-white/[0.1] rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-black text-white">CS50 AI - Full Course Syllabus</h3>
                <button onClick={() => setShowSyllabusModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar text-xs">
                {DEFAULT_CHAPTERS.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#05070e] border border-white/[0.08] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{c.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.duration}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Core module exploring state space graphs and search strategy algorithms.</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowSyllabusModal(false)}
                className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-colors"
              >
                Close Syllabus
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD RESOURCE MODAL */}
      <AnimatePresence>
        {showAddResourceModal && (
          <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#0a0d18] border border-white/[0.1] rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-black text-white">Add Course Resource</h3>
                <button onClick={() => setShowAddResourceModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {/* Source Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#05070e] rounded-xl border border-white/[0.08] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setResourceSourceTab('existing')}
                  className={`py-1.5 px-2 rounded-lg transition-all ${
                    resourceSourceTab === 'existing'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  From Resources Page ({allResources.length})
                </button>
                <button
                  type="button"
                  onClick={() => setResourceSourceTab('new')}
                  className={`py-1.5 px-2 rounded-lg transition-all ${
                    resourceSourceTab === 'new'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Custom Link
                </button>
              </div>

              {resourceSourceTab === 'existing' ? (
                <form onSubmit={handleConnectExistingResource} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      Select Existing Resource from StudyOS
                    </label>
                    {allResources.length > 0 ? (
                      <ResourceSelect
                        value={selectedExistingResourceId}
                        onChange={(val) => setSelectedExistingResourceId(val)}
                        options={allResources.map((res) => ({
                          label: `${res.name} (${res.type || res.category || 'File'})`,
                          value: res.id
                        }))}
                      />
                    ) : (
                      <div className="p-3 rounded-xl bg-[#05070e] border border-white/[0.08] text-[11px] text-slate-400 text-center">
                        No resources saved in your main Resources library yet. Switch to "Create Custom Link" or upload a file.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddResourceModal(false)}
                      className="px-3 py-2 bg-[#111726] text-slate-300 rounded-xl hover:bg-[#182034] text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedExistingResourceId}
                      className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      Connect Selected Resource
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateResource} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Resource Title / Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lecture Notes PDF or Cheatsheet"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05070e] border border-white/[0.08] text-xs text-slate-200 outline-none focus:border-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Link URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={resourceLinkUrl}
                      onChange={(e) => setResourceLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05070e] border border-white/[0.08] text-xs text-slate-200 outline-none focus:border-blue-500/40"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddResourceModal(false)}
                      className="px-3 py-2 bg-[#111726] text-slate-300 rounded-xl hover:bg-[#182034] text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-colors shadow-md cursor-pointer"
                    >
                      Save Resource
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default VideoDetailSidebar;
