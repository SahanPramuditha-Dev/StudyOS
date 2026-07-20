import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, RefreshCw, Sparkles, Copy, Zap,
  BookOpen, FlaskConical, LayoutList, Map, CalendarClock,
  MessageCircle, ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useOrion, ORION_EMOTIONS, XP_EVENTS } from '../../context/OrionContext';
import { askOrion } from '../../services/orionBrain';
import { useLocation } from 'react-router-dom';
import { useStorage } from '../../hooks/useStorage';
import toast from 'react-hot-toast';

// ─── Slash Commands ────────────────────────────────────────────────────────────

const ORION_COMMANDS = [
  { id: '/summarize',   label: 'Summarize',    desc: 'Summarize this topic',       icon: BookOpen },
  { id: '/quiz',        label: 'Quiz me',      desc: 'Test my knowledge',           icon: FlaskConical },
  { id: '/flashcards',  label: 'Flashcards',   desc: 'Create study cards',          icon: LayoutList },
  { id: '/roadmap',     label: 'Roadmap',      desc: 'Create a learning path',      icon: Map },
  { id: '/study-plan',  label: 'Study Plan',   desc: 'Generate a schedule',         icon: CalendarClock },
  { id: '/explain',     label: 'Explain',      desc: 'Explain a concept simply',    icon: Sparkles },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const OwlAvatar = ({ size = 32, emotion }) => {
  const bg = emotion === ORION_EMOTIONS.THINKING ? 'from-violet-500 to-purple-600' :
             emotion === ORION_EMOTIONS.CELEBRATING ? 'from-amber-400 to-orange-500' :
             'from-amber-500 to-orange-600';
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center shrink-0 shadow-md`}
         style={{ width: size, height: size }}>
      <span style={{ fontSize: size * 0.45 }}>🦉</span>
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
      <div className="flex justify-end">
        <div className="max-w-[82%] bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 group">
      <OwlAvatar size={30} emotion={emotion} />
      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700/80">
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 text-[13px] leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {message.reward?.xp > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <Zap size={11} className="fill-current" />
              +{message.reward.xp} XP earned
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="mt-1 ml-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
        >
          <Copy size={10} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const ThinkingIndicator = ({ emotion }) => (
  <div className="flex items-start gap-2.5">
    <OwlAvatar size={30} emotion={emotion} />
    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700/80">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Chat Panel ──────────────────────────────────────────────────────────

const OrionChatPanel = () => {
  const {
    isChatOpen, setIsChatOpen, emotion, setEmotion,
    isThinking, setIsThinking, addXP, speak, pageContext,
  } = useOrion();

  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load study context from storage
  const [assignments] = useStorage('studyos_assignments', []);
  const [courses] = useStorage('studyos_courses', []);
  const [goals] = useStorage('studyos_goals', []);
  const [orionData] = useStorage('studyos_orion', {});

  const studyData = { assignments, courses, goals, orionXP: orionData.xp, orionLevel: orionData.level };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Focus input when opened
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (messages.length === 0) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `${greeting}! I'm **Orion**, your personal AI study mentor. 🦉\n\nI'm currently in **${pageContext.role}** mode for this page. Ask me anything, or use **/** for quick commands!`,
          emotion: ORION_EMOTIONS.HAPPY,
          reward: null,
        }]);
      }
    }
  }, [isChatOpen]); // eslint-disable-line

  // Slash command filtering
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

  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    setInput('');
    setShowCommands(false);

    const userMsg = { id: Date.now(), role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setEmotion(ORION_EMOTIONS.THINKING);

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role, content: m.content
      }));

      const response = await askOrion(trimmed, {
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

      // Award XP
      if (response.reward?.xp > 0) {
        addXP('AI_CONVERSATION');
      }

      // Handle action hints
      if (response.action && response.action !== 'none') {
        speak(`💡 Tip: ${response.action.replace(/_/g, ' ')} might help with this!`);
      }

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') setIsChatOpen(false);
    if (e.key === 'ArrowUp' && showCommands) {
      // Navigate commands — simplified
    }
  };

  const clearChat = () => {
    setMessages([]);
    setEmotion(ORION_EMOTIONS.HAPPY);
    speak('Chat cleared! Fresh start — ask me anything! 🦉');
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          key="orion-chat"
          className="fixed bottom-[165px] right-6 z-[9998] w-[360px] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226,232,240,0.8)',
            maxHeight: '70vh',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Dark mode wrapper */}
          <div className="dark:bg-slate-900/95 dark:border-slate-700/80 flex flex-col h-full" style={{ maxHeight: '70vh' }}>

            {/* Header */}
            <div className="shrink-0 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <div className="flex items-center gap-2.5">
                <OwlAvatar size={34} emotion={emotion} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">ORION</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">AI Mentor</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{pageContext.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  aria-label="Close Orion chat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Quick command pills */}
            <div className="shrink-0 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
              {ORION_COMMANDS.slice(0, 4).map(cmd => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => sendMessage(cmd.id)}
                    className="shrink-0 flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    <Icon size={10} />
                    {cmd.label}
                  </button>
                );
              })}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar min-h-0">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} emotion={msg.emotion || emotion} />
              ))}
              {isThinking && <ThinkingIndicator emotion={ORION_EMOTIONS.THINKING} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Slash command suggestions */}
            <AnimatePresence>
              {showCommands && (
                <motion.div
                  className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-40 overflow-y-auto"
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <Icon size={14} className="text-primary-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{cmd.id}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{cmd.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Orion anything... or type /"
                    rows={1}
                    className="w-full resize-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-400/50 placeholder-slate-400 dark:placeholder-slate-500 max-h-24 overflow-y-auto custom-scrollbar"
                    style={{ lineHeight: '1.4' }}
                  />
                </div>
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Send message to Orion"
                >
                  <Send size={15} />
                </motion.button>
              </div>
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-1.5">
                Powered by Gemini · Enter to send · ESC to close
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrionChatPanel;
