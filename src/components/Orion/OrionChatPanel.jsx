import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Send, X, RefreshCw, Sparkles, Copy, Zap, Check,
  BookOpen, FlaskConical, LayoutList, Map, CalendarClock,
  MessageCircle, Volume2, VolumeX, Mic
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useOrion, ORION_EMOTIONS, XP_EVENTS } from '../../context/OrionContext';
import { askOrion } from '../../services/orionBrain';
import { useLocation } from 'react-router-dom';
import { useStorage } from '../../hooks/useStorage';
import toast from 'react-hot-toast';
import { orionSounds } from '../../utils/orionSounds';
import { OrionSTT } from '../../utils/orionVoice';

// ─── Slash Commands ────────────────────────────────────────────────────────────

const ORION_COMMANDS = [
  { id: '/summarize',   label: 'Summarize',    desc: 'Summarize this topic',       icon: BookOpen,      color: 'text-violet-400' },
  { id: '/quiz',        label: 'Quiz me',      desc: 'Test my knowledge',           icon: FlaskConical,  color: 'text-sky-400'    },
  { id: '/flashcards',  label: 'Flashcards',   desc: 'Create study cards',          icon: LayoutList,    color: 'text-emerald-400'},
  { id: '/roadmap',     label: 'Roadmap',      desc: 'Create a learning path',      icon: Map,           color: 'text-amber-400'  },
  { id: '/study-plan',  label: 'Study Plan',   desc: 'Generate a schedule',         icon: CalendarClock, color: 'text-rose-400'   },
  { id: '/explain',     label: 'Explain',      desc: 'Explain a concept simply',    icon: Sparkles,      color: 'text-fuchsia-400'},
];

// ─── Quick pill config (shown in header strip) ────────────────────────────────

const QUICK_PILLS = [
  { id: '/summarize',  label: 'Summarize',   icon: BookOpen,     grad: 'from-violet-500/20 to-violet-600/10 border-violet-500/25 text-violet-300 hover:border-violet-400/60' },
  { id: '/quiz',       label: 'Quiz me',     icon: FlaskConical, grad: 'from-sky-500/20 to-sky-600/10 border-sky-500/25 text-sky-300 hover:border-sky-400/60'           },
  { id: '/flashcards', label: 'Flashcards',  icon: LayoutList,   grad: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/25 text-emerald-300 hover:border-emerald-400/60' },
  { id: '/roadmap',    label: 'Roadmap',     icon: Map,          grad: 'from-amber-500/20 to-amber-600/10 border-amber-500/25 text-amber-300 hover:border-amber-400/60'   },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const OwlAvatar = ({ size = 32, emotion }) => {
  const bg = emotion === ORION_EMOTIONS.THINKING    ? 'from-violet-500 to-purple-600' :
             emotion === ORION_EMOTIONS.CELEBRATING ? 'from-yellow-400 to-amber-500'  :
             emotion === ORION_EMOTIONS.WORRIED      ? 'from-rose-500 to-red-600'      :
                                                       'from-amber-500 to-orange-500'  ;
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${bg} flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white/10`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.46 }}>🦉</span>
    </div>
  );
};

const MessageBubble = ({ message, emotion }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (message.role === 'user') {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      >
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] font-medium text-white"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
          }}
        >
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-start gap-2.5 group"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
    >
      <OwlAvatar size={28} emotion={emotion} />
      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div
          className="rounded-2xl rounded-tl-sm px-3.5 py-3"
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="prose prose-sm prose-invert max-w-none text-slate-200 text-[12.5px] leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {message.reward?.xp > 0 && (
            <motion.div
              className="mt-2 inline-flex items-center gap-1.5 text-amber-300 text-[10.5px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Zap size={10} className="fill-current" />
              +{message.reward.xp} XP
            </motion.div>
          )}
        </div>

        {/* Copy action */}
        <button
          onClick={handleCopy}
          className="mt-1 ml-1 text-[10px] text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </motion.div>
  );
};

const ThinkingIndicator = () => (
  <motion.div
    className="flex items-start gap-2.5"
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
  >
    <OwlAvatar size={28} emotion={ORION_EMOTIONS.THINKING} />
    <div
      className="rounded-2xl rounded-tl-sm px-4 py-3"
      style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// ─── Main Chat Panel ──────────────────────────────────────────────────────────

const OrionChatPanel = () => {
  const dragControls = useDragControls();
  const {
    isChatOpen, setIsChatOpen, emotion, setEmotion,
    isThinking, setIsThinking, addXP, speak, pageContext,
    voiceEnabled, toggleVoice, startListening, stopListening, isListening, cancelSpeech,
  } = useOrion();

  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [assignments] = useStorage('studyos_assignments', []);
  const [courses]     = useStorage('studyos_courses', []);
  const [goals]       = useStorage('studyos_goals', []);
  const [notes]       = useStorage('studyos_notes', []);
  const [orionData]   = useStorage('studyos_orion', {});
  const [orionMemory] = useStorage('studyos_orion_memory', {});

  const studyData = { assignments, courses, goals, orionXP: orionData.xp, orionLevel: orionData.level, orionMemory };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (messages.length === 0) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const welcomeText = `${greeting}! I'm **Orion**, your personal AI study mentor. 🦉\n\nI'm currently in **${pageContext.role}** mode for this page. Ask me anything, or use **/** for quick commands!`;
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeText,
          emotion: ORION_EMOTIONS.HAPPY,
          reward: null,
        }]);
        speak(welcomeText);
      }
    }
  }, [isChatOpen]); // eslint-disable-line

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith('/')) {
      const query = val.slice(1).toLowerCase();
      const filtered = ORION_COMMANDS.filter(c =>
        c.id.slice(1).includes(query) || c.label.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0);
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (cmd) => {
    setInput(cmd.id + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const sendMessage = useCallback(async (text = input, hiddenContext = null) => {
    const trimmed = text.trim();
    if (!trimmed && !hiddenContext) return;
    if (isThinking) return;

    setInput('');
    setShowCommands(false);

    const userMsg = { id: Date.now(), role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setEmotion(ORION_EMOTIONS.THINKING);
    orionSounds.messageSent();

    try {
      const conversationHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      let finalPrompt = hiddenContext ? `${hiddenContext}\n\nUser Question: ${trimmed}` : trimmed;

      // ── /quiz: Active Recall Quiz from user's actual notes ──────────────────
      if (trimmed.startsWith('/quiz')) {
        const topic = trimmed.replace('/quiz', '').trim();
        const relevantNotes = notes
          .filter(n => !n.archived)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 3);
        const notesContext = relevantNotes.length > 0
          ? relevantNotes.map(n => `### ${n.title}\n${n.content?.slice(0, 800) || ''}`).join('\n\n')
          : '';
        finalPrompt = `Generate an active recall quiz${topic ? ` about "${topic}"` : ' based on the student\'s recent notes'}.

${notesContext ? `Student's recent notes:\n${notesContext}\n\n` : ''}Rules:
- Generate exactly 4 multiple-choice questions (A/B/C/D)
- Cover different aspects (definitions, applications, comparisons)
- After each question, put the correct answer and a 1-sentence explanation
- Format as markdown with clear Q1, Q2 labels
- End with an encouraging message and award XP`;
      }

      // ── /study-plan: Personalized study plan from goals + assignments ───────
      if (trimmed.startsWith('/study-plan')) {
        const activeGoals = (goals?.goals || goals || []).filter?.(g => !g.completed)?.slice(0, 5) || [];
        const pendingAssignments = (assignments || [])
          .filter(a => a.status !== 'Submitted' && a.deadline)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 6);
        const enrolledCourses = (courses || []).slice(0, 4);
        
        finalPrompt = `Create a personalized 7-day study plan for this student.

Student's active goals: ${activeGoals.length > 0 ? activeGoals.map(g => g.title).join(', ') : 'None set'}

Pending assignments (sorted by deadline): ${pendingAssignments.length > 0
          ? pendingAssignments.map(a => `${a.title} (due: ${a.deadline})`).join(', ')
          : 'None'}

Enrolled courses: ${enrolledCourses.length > 0 ? enrolledCourses.map(c => c.title || c.name).join(', ') : 'None'}

Rules:
- Create a realistic Mon-Sun schedule in a markdown table
- Balance subjects, rest, and assignment deadlines
- Include daily focus areas and estimated time
- Add practical study tips at the bottom
- Be specific to this student's actual data, not generic`;
      }

      const response = await askOrion(finalPrompt, {
        pathname: location.pathname,
        studyData,
        conversationHistory,
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message,
        emotion: response.emotion,
        reward: response.reward,
      }]);

      setEmotion(response.emotion || ORION_EMOTIONS.HAPPY);
      orionSounds.messageReceived();

      if (response.reward?.xp > 0) addXP('AI_CONVERSATION');
      
      let textToSpeak = response.message;
      if (response.action && response.action !== 'none') {
        textToSpeak += ` Tip: ${response.action.replace(/_/g, ' ')} might help!`;
      }
      speak(textToSpeak);

    } catch (err) {
      console.error('Orion chat error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Hmm, my thought process got a bit fuzzy there. Could you try again? 🦉',
        emotion: ORION_EMOTIONS.CONFUSED,
        reward: null,
      }]);
      setEmotion(ORION_EMOTIONS.CONFUSED);
      toast.error('Orion had trouble connecting. Try again!');
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, messages, location.pathname, studyData, addXP, speak, setIsThinking, setEmotion]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') {
      if (isListening) stopListening();
      setIsChatOpen(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setEmotion(ORION_EMOTIONS.HAPPY);
    speak('Chat cleared! Fresh start — ask me anything! 🦉');
  };

  useEffect(() => {
    const handleDocumentAnalysis = (e) => {
      const { filename, content } = e.detail;
      const safeContent = content.slice(0, 6000);
      const hiddenContext = `[DOCUMENT ATTACHED: "${filename}"]\n${safeContent}`;
      const uiMessage = `Please analyze the attached document: **${filename}**`;
      setTimeout(() => sendMessage(uiMessage, hiddenContext), 500);
    };
    window.addEventListener('orion-analyze-document', handleDocumentAnalysis);
    return () => window.removeEventListener('orion-analyze-document', handleDocumentAnalysis);
  }, [sendMessage]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setInput('');
      startListening((res) => {
        setInput(res.interim || res.final);
        if (res.isFinal) {
          sendMessage(res.final);
        }
      });
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          key="orion-chat"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          className="fixed bottom-[165px] right-6 z-[9998] w-[360px] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(8, 14, 32, 0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            maxHeight: '70vh',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.93 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 20, scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          {/* ── TOP ACCENT LINE & DRAG HANDLE ── */}
          <div className="relative h-[2px] w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 shrink-0">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/20 opacity-0 group-hover/header:opacity-100 transition-opacity pointer-events-none" />
          </div>

          {/* ── HEADER ── */}
          <div 
            className="shrink-0 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing group/header"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-3">
              <OwlAvatar size={36} emotion={emotion} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-black text-white tracking-widest uppercase">ORION</p>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
                  >
                    AI Mentor
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{pageContext.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-colors ${voiceEnabled ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                style={{ background: 'rgba(255,255,255,0.04)' }}
                title={voiceEnabled ? "Voice output on" : "Voice output off"}
              >
                {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={clearChat}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                title="Clear chat"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── QUICK PILLS ── */}
          <div
            className="shrink-0 px-3 py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {QUICK_PILLS.map(cmd => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => sendMessage(cmd.id)}
                  className={`group shrink-0 flex items-center text-[10.5px] font-semibold rounded-full border bg-gradient-to-r transition-all duration-300 ease-out ${cmd.grad}`}
                >
                  <div className="flex items-center justify-center w-[24px] h-[24px] shrink-0">
                    <Icon size={11} />
                  </div>
                  <div className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 overflow-hidden transition-all duration-300 ease-out">
                    <span className="pr-2.5 whitespace-nowrap block">
                      {cmd.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── MESSAGES ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} emotion={msg.emotion || emotion} />
            ))}
            {isThinking && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ── SLASH COMMAND SUGGESTIONS ── */}
          <AnimatePresence>
            {showCommands && (
              <motion.div
                className="shrink-0 overflow-y-auto"
                style={{
                  maxHeight: 160,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(8, 14, 32, 0.98)',
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {filteredCommands.map(cmd => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleCommandSelect(cmd)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <Icon size={13} className={`shrink-0 ${cmd.color}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{cmd.id}</p>
                        <p className="text-[10px] text-slate-500">{cmd.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── INPUT ── */}
          <div
            className="shrink-0 px-3 pt-2.5 pb-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-end gap-2">
              <div
                className="flex-1 relative rounded-xl overflow-hidden transition-all duration-300"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.08)' 
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isListening}
                  placeholder={isListening ? "Listening..." : "Ask Orion anything... or type /"}
                  rows={1}
                  className="w-full resize-none bg-transparent text-slate-200 text-[13px] px-3.5 py-2.5 outline-none placeholder-slate-500 max-h-24 overflow-y-auto disabled:opacity-50 focus:bg-white/[0.02]"
                  style={{ lineHeight: '1.45' }}
                />
              </div>
              
              {OrionSTT.isSupported() && (
                <motion.button
                  onClick={toggleListening}
                  disabled={isThinking}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: isListening
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(255,255,255,0.06)',
                    border: isListening ? '1px solid rgba(239,68,68,0.4)' : '1px solid transparent'
                  }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.06 }}
                  title="Voice input"
                >
                  <Mic size={14} className={isListening ? 'text-red-400' : 'text-slate-400'} />
                  {isListening && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border border-red-500 pointer-events-none"
                      animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              )}

              <motion.button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isThinking}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: !input.trim() || isThinking
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg,#f59e0b,#ea580c)',
                  boxShadow: input.trim() && !isThinking ? '0 4px 14px rgba(245,158,11,0.35)' : 'none',
                }}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.06 }}
                aria-label="Send"
              >
                <Send size={14} className="text-white" />
              </motion.button>
            </div>

            {/* Footer */}
            <p className="text-center text-[9.5px] text-slate-700 mt-2 tracking-wide">
              Powered by Gemini · Enter to send · ESC to close
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrionChatPanel;
