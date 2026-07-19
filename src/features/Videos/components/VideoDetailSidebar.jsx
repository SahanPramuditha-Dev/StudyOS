import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Bookmark, Trash2, Edit3, Save, Clock, MonitorPlay, AlignLeft, Maximize, Minimize, FileText, Loader2
} from 'lucide-react';
import Select from '../../../components/ui/Select';
import { fetchTranscript } from '../utils/transcriptFetcher';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { generateVideoSummary, generateVideoQuiz } from '../../../services/aiService';
import { Sparkles } from 'lucide-react';

const formatTime = (s) => {
  if (!s || s <= 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  return `${m}:${sec.toString().padStart(2,'0')}`;
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
  projects
}) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [noteForm, setNoteForm] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [isPip, setIsPip] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [notesMode, setNotesMode] = useState('write'); // 'write' or 'preview'
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const transcriptRefs = React.useRef({});

  // Calculate Active Transcript Line
  const activeTranscriptIdx = React.useMemo(() => {
    if (!transcript || !activeVideo?.lastPosition) return -1;
    const pos = activeVideo.lastPosition;
    for (let i = 0; i < transcript.length; i++) {
      const start = transcript[i].start;
      const nextStart = transcript[i + 1]?.start || Infinity;
      if (pos >= start && pos < nextStart) return i;
    }
    return -1;
  }, [transcript, activeVideo?.lastPosition]);

  // Handle Auto-scroll
  React.useEffect(() => {
    if (activeTab === 'transcript' && autoScroll && activeTranscriptIdx !== -1) {
      const el = transcriptRefs.current[activeTranscriptIdx];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTranscriptIdx, activeTab, autoScroll]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen API failed, falling back to CSS fullscreen:", err);
      setIsFullscreen(!isFullscreen);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    if (activeTab === 'transcript' && !transcript && !isFetchingTranscript && activeVideo) {
      setIsFetchingTranscript(true);
      setTranscriptError(null);
      // Extract video ID from activeVideo.url
      const m = activeVideo.url?.match(/(?:youtu\.be\/|v=|embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
      const videoId = m ? m[1] : null;
      if (videoId) {
        fetchTranscript(videoId)
          .then(data => {
            if (isMounted) setTranscript(data);
          })
          .catch(err => {
            if (isMounted) setTranscriptError(err.message);
          })
          .finally(() => {
            if (isMounted) setIsFetchingTranscript(false);
          });
      } else {
        setIsFetchingTranscript(false);
        setTranscriptError("Invalid YouTube URL.");
      }
    }
    return () => { isMounted = false; };
  }, [activeTab, activeVideo, transcript]);

  if (!activeVideo) return null;

  const getEfficiencyScore = () => {
    if (!activeVideo.duration || !activeVideo.totalWatchTime || activeVideo.totalWatchTime < 10) return 100;
    const progressSecs = (activeVideo.progress / 100) * activeVideo.duration;
    if (progressSecs <= 5) return 100;
    const eff = Math.round((progressSecs / activeVideo.totalWatchTime) * 100);
    return Math.min(Math.max(eff, 10), 500);
  };

  const efficiency = getEfficiencyScore();

  const handleStartEdit = (b) => {
    setEditingBookmarkId(b.id);
    setNoteForm(b.note);
  };

  const handleSaveEdit = (b) => {
    onSaveBookmark(b.id, noteForm);
    setEditingBookmarkId(null);
    setNoteForm('');
  };

  const handleAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      const result = await generateVideoSummary(activeVideo.title, activeVideo.url);
      const newNotes = activeVideo.videoNotes ? activeVideo.videoNotes + '\n\n' + result : result;
      updateVideoData(activeVideo.id, { videoNotes: newNotes });
      setNotesMode('preview');
      toast.success('AI Summary added to notes!');
    } catch (e) {
      toast.error('Failed to generate summary');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIQuiz = async () => {
    setIsGeneratingAI(true);
    try {
      const result = await generateVideoQuiz(activeVideo.title, activeVideo.url);
      const newNotes = activeVideo.videoNotes ? activeVideo.videoNotes + '\n\n' + result : result;
      updateVideoData(activeVideo.id, { videoNotes: newNotes });
      setNotesMode('preview');
      toast.success('AI Quiz added to notes!');
    } catch (e) {
      toast.error('Failed to generate quiz');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return createPortal(
    <div className={`fixed z-[99999] flex ${isPip ? 'bottom-6 right-6' : isFullscreen ? 'inset-0' : 'inset-0 items-center justify-center p-4 sm:p-6 lg:p-8'}`}>
      {!isPip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveVideoId(null)}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        />
      )}
      <motion.div
        initial={isPip ? { scale: 0.9, opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
        animate={isPip ? { scale: 1, opacity: 1, x: 0, y: 0 } : { scale: 1, opacity: 1, y: 0 }}
        exit={isPip ? { scale: 0.9, opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`relative overflow-hidden flex ${
          isPip 
            ? 'w-[320px] sm:w-[400px] flex-col rounded-2xl shadow-2xl ring-4 ring-white/20 dark:ring-slate-800 bg-slate-950'
            : isFullscreen
              ? 'w-full h-full max-w-none max-h-none flex-col lg:flex-row bg-white dark:bg-slate-900'
              : 'w-full max-w-[1600px] h-full max-h-[90vh] flex-col lg:flex-row rounded-[2rem] shadow-2xl border border-white/10 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        {/* Left side: Video Player & Theater Controls */}
        <div className={`flex flex-col ${isPip ? 'flex-1' : isFullscreen ? 'flex-1' : 'w-full lg:w-[65%] xl:w-[70%] border-r border-slate-100 dark:border-slate-800 bg-slate-950 flex-shrink-0'}`}>
          {!isFullscreen && (
            <div className={`flex items-center justify-between shrink-0 ${isPip ? 'p-3 text-white' : 'p-4 lg:px-6 lg:py-5 text-white'}`}>
              <h2 className={`font-black line-clamp-1 pr-4 ${isPip ? 'text-sm' : 'text-lg lg:text-xl'}`}>{activeVideo.title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {!isPip && (
                  <button 
                    onClick={toggleFullscreen} 
                    className={`p-2 rounded-xl transition-colors text-slate-400 hover:text-white hover:bg-white/10`} 
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                )}
                <button 
                  onClick={() => {
                    setIsPip(!isPip);
                    if (!isPip && isFullscreen) toggleFullscreen();
                  }} 
                  className={`p-2 rounded-xl transition-colors ${isPip ? 'hover:bg-white/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                  title={isPip ? 'Expand' : 'Picture in Picture'}
                >
                  <MonitorPlay size={isPip ? 16 : 20} />
                </button>
                <button 
                  onClick={() => setActiveVideoId(null)} 
                  className={`p-2 rounded-xl transition-colors ${isPip ? 'hover:bg-red-500 hover:text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <X size={isPip ? 16 : 20} />
                </button>
              </div>
            </div>
          )}
          
          {/* Video Container */}
          <div 
            className={`w-full bg-black relative flex items-center justify-center ${isFullscreen ? 'flex-1' : 'shrink-0'}`} 
            style={(!isPip && !isFullscreen) ? { paddingBottom: '56.25%' } : (isPip ? { aspectRatio: '16/9' } : {})}
          >
            {embedUrl ? (
              <iframe
                id="yt-player"
                ref={iframeRef}
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-none"
                onLoad={(e) => e.target.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'yt-player' }), '*')}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium bg-slate-900">
                Invalid Video URL
              </div>
            )}
          </div>
          
          {/* Glassmorphic Player Controls */}
          {!isPip && !isFullscreen && (
            <div className="p-4 lg:px-6 lg:py-5 flex-shrink-0 flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-950 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => onToggleComplete(activeVideo)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
                    activeVideo.completed
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {activeVideo.completed ? 'Completed' : 'Mark Complete'}
                </button>
                <Select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="!px-4 !py-2.5 !rounded-xl !text-xs !font-black !bg-white/5 !text-slate-300 !border-none !outline-none hover:!bg-white/10 transition-all !ring-0"
                  options={[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => ({ label: `${r}x Speed`, value: r }))}
                />
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                {activeVideo.totalWatchTime > 10 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-sm" title="Learning Efficiency">
                    <Clock size={14} />
                    <span className="text-xs font-black uppercase tracking-widest">{efficiency}%</span>
                  </div>
                )}
                <button
                  onClick={() => onAddBookmark()}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-primary-500 hover:bg-primary-600 text-white transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center gap-2"
                >
                  <Bookmark size={16} />
                  <span className="hidden sm:inline">Quick Bookmark (B)</span>
                  <span className="sm:hidden">Bookmark</span>
                </button>
              </div>
            </div>
          )}

          {/* Video Metadata / Details - fills remaining space */}
          {!isPip && !isFullscreen && (
            <div className="flex-1 p-4 lg:p-6 bg-slate-900 border-t border-white/5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div>
                <h3 className="text-white font-black text-lg mb-1">{activeVideo.title}</h3>
                {activeVideo.author && <p className="text-slate-400 text-sm font-medium">{activeVideo.author}</p>}
              </div>

              {/* Linked Data Badges */}
              {(activeVideo.associatedType === 'Course' || activeVideo.associatedType === 'Project') && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Linked To:</span>
                  {activeVideo.associatedType === 'Course' && courses?.find(c => c.id === activeVideo.associatedId) && (
                    <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                      Course: {courses.find(c => c.id === activeVideo.associatedId).title}
                    </span>
                  )}
                  {activeVideo.associatedType === 'Project' && projects?.find(p => p.id === activeVideo.associatedId) && (
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                      Project: {projects.find(p => p.id === activeVideo.associatedId).title}
                    </span>
                  )}
                </div>
              )}
              
              {/* External Link */}
              <div className="mt-auto pt-4">
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  Watch on YouTube ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Interactive Tools */}
        {!isPip && !isFullscreen && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-50 dark:bg-slate-900/50">
            {/* Tabs Header */}
            <div className="flex items-center p-1.5 mx-4 mt-5 bg-slate-200/50 dark:bg-slate-800/80 rounded-xl overflow-x-auto custom-scrollbar flex-shrink-0 gap-1">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 min-w-0 px-2 py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'notes' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <AlignLeft size={14} className="shrink-0" /> 
                <span className="truncate">Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 min-w-0 px-2 py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'transcript' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileText size={14} className="shrink-0" /> 
                <span className="truncate">Transcript</span>
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex-1 min-w-0 px-2 py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'bookmarks' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Bookmark size={14} className="shrink-0" /> 
                <span className="truncate">Bookmarks</span>
                <span className="bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md text-[10px] shrink-0">{activeVideo.bookmarks?.length || 0}</span>
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 relative">
              {activeTab === 'notes' ? (
                <div className="flex-1 relative flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3 shrink-0 px-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                      <Edit3 size={12} /> Markdown Supported
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAISummary}
                        disabled={isGeneratingAI}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                      >
                        {isGeneratingAI ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Sparkles size={12} />}
                        Summary
                      </button>
                      <button
                        onClick={handleAIQuiz}
                        disabled={isGeneratingAI}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                      >
                        {isGeneratingAI ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Sparkles size={12} />}
                        Quiz
                      </button>
                      <div className="bg-slate-200/50 dark:bg-slate-800/80 p-0.5 rounded-lg flex items-center ml-2">
                      <button 
                        onClick={() => setNotesMode('write')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${notesMode === 'write' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Write
                      </button>
                      <button 
                        onClick={() => setNotesMode('preview')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${notesMode === 'preview' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  </div>
                  
                  {notesMode === 'write' ? (
                    <textarea
                      className="flex-1 w-full p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-200 focus:ring-4 ring-primary-500/10 outline-none resize-none transition-all placeholder:text-slate-400 font-medium leading-relaxed shadow-sm pb-10"
                      placeholder="Jot down general notes, key takeaways, or action items for this video..."
                      value={activeVideo.videoNotes || ''}
                      onChange={(e) => updateVideoData(activeVideo.id, { videoNotes: e.target.value })}
                    />
                  ) : (
                    <div className="flex-1 w-full p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm overflow-y-auto custom-scrollbar shadow-sm">
                      {activeVideo.videoNotes ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 max-w-none">
                          <ReactMarkdown>{activeVideo.videoNotes}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                          <p className="text-sm font-bold text-slate-500">Nothing to preview yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Switch to Write mode to add notes.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {notesMode === 'write' && (
                    <div className="absolute bottom-4 right-5 text-[10px] font-black uppercase tracking-widest text-slate-400 pointer-events-none flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded-md">
                      <CheckCircle2 size={12} /> Autosaved
                    </div>
                  )}
                </div>
              ) : activeTab === 'transcript' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 select-text">
                  {isFetchingTranscript ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Loader2 className="animate-spin mb-3" size={24} />
                      <p className="text-xs font-bold uppercase tracking-widest">Fetching Transcript...</p>
                    </div>
                  ) : transcriptError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80">
                      <FileText size={48} className="mx-auto text-red-300 dark:text-red-500/50 mb-4" />
                      <p className="text-sm font-bold text-red-500">{transcriptError}</p>
                      <p className="text-xs text-slate-500 mt-2">Transcripts may be disabled for this video or blocked by the server.</p>
                    </div>
                  ) : transcript && transcript.length > 0 ? (
                    <div className="space-y-4">
                      <div className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 mb-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between z-10">
                         <div className="flex flex-col">
                           <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Video Transcript</span>
                           <span className="text-[10px] font-bold text-slate-400">Highlight text to copy to notes</span>
                         </div>
                         
                         <label className="flex items-center gap-2 cursor-pointer group">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                             Auto-Scroll
                           </span>
                           <div className={`relative w-8 h-4 rounded-full transition-colors ${autoScroll ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                             <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoScroll ? 'translate-x-4' : 'translate-x-0'}`} />
                           </div>
                           <input type="checkbox" className="hidden" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
                         </label>
                      </div>
                      {transcript.map((line, idx) => {
                        const isActive = idx === activeTranscriptIdx;
                        return (
                          <div 
                            key={idx} 
                            ref={el => transcriptRefs.current[idx] = el}
                            className={`flex gap-4 group p-2 -mx-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-50 dark:bg-primary-500/10 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                          >
                             <button 
                               onClick={() => {
                                 if (iframeRef.current?.contentWindow) {
                                   iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [line.start, true] }), '*');
                                   iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                                 }
                               }}
                               className={`text-[11px] font-black whitespace-nowrap pt-0.5 hover:underline transition-opacity ${isActive ? 'text-primary-600 dark:text-primary-400 opacity-100' : 'text-primary-500 dark:text-primary-400 opacity-50 group-hover:opacity-100'}`}
                             >
                               {formatTime(line.start)}
                             </button>
                             <p className={`text-sm font-medium leading-relaxed transition-colors ${isActive ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                               {line.text}
                             </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                      <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-sm font-bold text-slate-500">No transcript available.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-4">
                  {(!activeVideo.bookmarks || activeVideo.bookmarks.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                      <Bookmark size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-sm font-bold text-slate-500 max-w-[200px]">No bookmarks yet. Press 'B' while watching to save a timestamp.</p>
                    </div>
                  ) : (
                    activeVideo.bookmarks.map((b) => (
                      <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm group transition-all hover:border-primary-500/30">
                        <div className="flex items-center justify-between mb-2.5">
                          <button 
                            onClick={() => {
                              if (iframeRef.current?.contentWindow) {
                                iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [b.time, true] }), '*');
                                iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-black flex items-center gap-1.5 hover:bg-primary-100 transition-colors"
                          >
                            <Clock size={12} />
                            {formatTime(b.time)}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingBookmarkId !== b.id && (
                              <button onClick={() => handleStartEdit(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-colors">
                                <Edit3 size={14} />
                              </button>
                            )}
                            <button onClick={() => onDeleteBookmark(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {editingBookmarkId === b.id ? (
                          <div className="space-y-2 mt-3">
                            <textarea
                              autoFocus
                              className="w-full p-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none font-medium"
                              value={noteForm}
                              onChange={(e) => setNoteForm(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingBookmarkId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                              <button onClick={() => handleSaveEdit(b)} className="px-4 py-2 text-xs font-bold bg-primary-500 text-white rounded-xl hover:bg-primary-600 flex items-center gap-1.5 shadow-sm">
                                <Save size={14} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {b.note}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default VideoDetailSidebar;
