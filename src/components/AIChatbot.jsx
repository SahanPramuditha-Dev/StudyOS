import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, RefreshCw, ChevronDown, GraduationCap, MessageCircle, Copy, PlusSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithAI } from '../services/aiService';
import toast from 'react-hot-toast';
import { useStorage } from '../hooks/useStorage';
import { useLocation } from 'react-router-dom';

const AVAILABLE_COMMANDS = [
  { id: '/summarize', label: 'Summarize', desc: 'Summarize the current context' },
  { id: '/quiz', label: 'Quiz', desc: 'Test my knowledge' },
  { id: '/flashcards', label: 'Flashcards', desc: 'Create study cards' },
  { id: '/roadmap', label: 'Roadmap', desc: 'Create a learning path' },
  { id: '/study-plan', label: 'Study Plan', desc: 'Generate a schedule' },
  { id: '/explain', label: 'Explain', desc: 'Explain a concept clearly' },
  { id: '/debug', label: 'Debug', desc: 'Find errors in my code' },
  { id: '/translate', label: 'Translate', desc: 'Translate text' },
  { id: '/revise', label: 'Revise', desc: 'Improve my writing' },
  { id: '/assignment', label: 'Assignment', desc: 'Help with homework' },
  { id: '/deadline', label: 'Deadline', desc: 'Check upcoming due dates' },
];

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);
  const fabRef = useRef(null);
  const location = useLocation();

  const placeholders = ["Ask about your deadlines...", "Type / for smart commands...", "Explain recursion...", "Summarize my notes..."];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Load context data from storage
  const [budgetData] = useStorage('budget_data', null);
  const [assignments] = useStorage('ASSIGNMENTS', []);
  const [courses] = useStorage('COURSES', []);
  const [goals] = useStorage('GOALS', []);
  const [grades] = useStorage('GRADES', []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.message) {
        setInput(e.detail.message);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          chatWindowRef.current && 
          !chatWindowRef.current.contains(event.target) &&
          (!fabRef.current || !fabRef.current.contains(event.target))) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    
    if (val.startsWith('/')) {
      const search = val.toLowerCase();
      const filtered = AVAILABLE_COMMANDS.filter(cmd => cmd.id.startsWith(search));
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0);
    } else {
      setShowCommands(false);
    }
  };

  const applyCommand = (cmdId) => {
    setInput(cmdId + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    let parsedContent = input.trim();
    
    // Smart Commands Parser
    if (parsedContent.startsWith('/')) {
      const commandEnd = parsedContent.indexOf(' ');
      const command = commandEnd === -1 ? parsedContent : parsedContent.slice(0, commandEnd);
      const payload = commandEnd === -1 ? '' : parsedContent.slice(commandEnd + 1);
      parsedContent = `[SMART COMMAND: ${command}] Please fulfill this command based on my request or the current workspace context: ${payload}`;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { role: 'user', content: input.trim(), parsedContent, timestamp };
    setMessages(prev => [...prev, { role: 'user', content: input.trim(), timestamp }]);
    setInput('');
    setIsLoading(true);

    try {
      // Build smart context
      const contextObj = {
        currentPage: location.pathname,
        assignments: assignments.filter(a => a.status !== 'Submitted').map(a => ({ title: a.title, status: a.status, deadline: a.deadline })),
        courses: courses.map(c => ({ title: c.title, code: c.code })),
        goals: goals.map(g => ({ title: g.title, progress: g.progress })),
        budget: budgetData ? 'Available' : 'None',
      };
      
      const contextStr = JSON.stringify(contextObj);
      const response = await chatWithAI(messages, userMessage.parsedContent, contextStr, isTutorMode);
      setMessages(prev => [...prev, { role: 'ai', content: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={fabRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all z-[99]"
          >
            <Sparkles size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-full max-w-[380px] h-[600px] max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100] border border-slate-200/50 dark:border-slate-700/50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xl leading-tight tracking-wide flex items-center gap-1.5">
                    Nova
                    <div className="flex gap-0.5 text-yellow-400 mt-0.5">
                      <Sparkles size={14} className="fill-current" />
                    </div>
                  </h3>
                  <p className="text-[9px] text-white/70 font-bold tracking-widest uppercase whitespace-nowrap mt-0.5 flex items-center gap-1.5">
                    Powered by <span className="bg-white/20 px-1 py-0.5 rounded text-white shadow-sm">Gemini 3.5 Flash</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTutorMode(!isTutorMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap mr-1 ${
                    isTutorMode 
                      ? 'bg-white text-violet-600 shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105' 
                      : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/20'
                  }`}
                  title="Toggle Tutor Mode (Socratic method)"
                >
                  {isTutorMode ? <GraduationCap size={12} strokeWidth={3} /> : <MessageCircle size={12} strokeWidth={3} />}
                  {isTutorMode ? 'Tutor Mode' : 'Chat Mode'}
                </button>
                <button onClick={handleReset} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="New Chat">
                  <PlusSquare size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-transparent flex flex-col">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                      <Sparkles size={36} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{getGreeting()}!</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">I am Nova, your intelligent brain. How can I help?</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                    {AVAILABLE_COMMANDS.slice(0, 4).map(cmd => (
                      <button 
                        key={cmd.id}
                        onClick={() => applyCommand(cmd.id)}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-lg hover:-translate-y-1 transition-all text-xs font-bold text-slate-600 dark:text-slate-300 gap-1.5 group"
                      >
                        <span className="text-indigo-500 group-hover:scale-110 transition-transform">{cmd.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm shrink-0 mt-1">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div 
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-br-sm shadow-md shadow-indigo-500/20' 
                          : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 rounded-bl-sm shadow-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                    {msg.role === 'ai' && (
                      <div className="flex items-center gap-3 mt-1.5 px-2 opacity-60 hover:opacity-100 transition-opacity">
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied to clipboard'); }} className="text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Copy">
                          <Copy size={12} />
                        </button>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{msg.timestamp}</span>
                      </div>
                    )}
                    {msg.role === 'user' && msg.timestamp && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 mr-1 font-medium">{msg.timestamp}</span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 shrink-0 relative">
              <AnimatePresence>
                {showCommands && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-4 right-4 mb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar"
                  >
                    {filteredCommands.map((cmd) => (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => applyCommand(cmd.id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col items-start gap-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-indigo-500 dark:text-indigo-400 text-sm tracking-wide bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-md">{cmd.id}</span>
                          <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">{cmd.label}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 pl-1">{cmd.desc}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={placeholders[placeholderIdx]}
                  className="w-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-full pl-5 pr-12 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 border border-transparent focus:border-indigo-500/50 transition-all placeholder:text-slate-400 placeholder:transition-opacity"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all shadow-sm"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
