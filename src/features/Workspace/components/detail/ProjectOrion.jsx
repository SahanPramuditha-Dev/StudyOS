import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  MessageSquare, 
  FileText, 
  CheckCircle,
  Clock,
  Terminal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const ProjectOrion = ({ project }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm Orion, your academic co-pilot. I have synchronized context with **${project.name}**. I can analyze your tasks, audit files, and outline your docs. What are we building today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const taskCount = Object.values(project.board || {}).flat().length;
  const fileCount = project.files?.length || 0;
  const docCount = project.docs?.length || 0;

  const suggestions = [
    { text: 'Analyze pending tasks', icon: CheckCircle, detail: 'Audit kanban bottlenecks' },
    { text: 'Outline project scope', icon: FileText, detail: 'Generate standard README outline' },
    { text: 'Draft submission version', icon: Terminal, detail: 'Create Phase 1 delivery proof' },
  ];

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text.trim()) return;

    const userMessage = { id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    if (typeof textToSend !== 'string') setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = `### Orion Context Analysis\n\nI've queried the workspace database for **${project.name}**:\n\n`;
      if (text.toLowerCase().includes('task')) {
        reply += `- **Pipeline Audit**: Found **${taskCount}** active tasks in this module.\n- **Recommendation**: Prioritize unfinished cards in *In Progress* before finalizing deliverables.`;
      } else if (text.toLowerCase().includes('scope') || text.toLowerCase().includes('outline')) {
        reply += `- **Scope Outline**: Based on **${docCount}** documents, I recommend scaffolding a standard structural index (SRS) containing *Scope*, *Dependencies*, and *Deploy Steps*.`;
      } else {
        reply += `I've analyzed your query regarding "${text}".\n\nWorkspace metrics: **${taskCount}** tasks, **${fileCount}** files, and **${docCount}** docs. How would you like to proceed?`;
      }
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Side Status Panel */}
      <div className="lg:col-span-1 space-y-4 flex flex-col justify-start">
        <div className="glass rounded-3xl p-5 border border-slate-150 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Orion Engine</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Context</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3.5">
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Module</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-205 mt-0.5 truncate">{project.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center border border-slate-100 dark:border-slate-800/80">
                <p className="text-sm font-black text-slate-850 dark:text-white">{taskCount}</p>
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">Tasks</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center border border-slate-100 dark:border-slate-800/80">
                <p className="text-sm font-black text-slate-850 dark:text-white">{fileCount}</p>
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">Files</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center border border-slate-100 dark:border-slate-800/80">
                <p className="text-sm font-black text-slate-850 dark:text-white">{docCount}</p>
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">Docs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Prompts */}
        <div className="space-y-3 mt-2">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3 block">Suggested Tasks</span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug.text)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800/80 hover:border-primary-500/20 hover:shadow-lg hover:shadow-primary-500/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors">
                  <sug.icon size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{sug.text}</p>
                  <p className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 mt-1 leading-none">{sug.detail}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3 flex flex-col h-[550px] bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden">
        {/* Chat Feed */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[85%] items-start ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                    : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                </div>
                <div className={`p-4 rounded-3xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-tr-none shadow-md shadow-primary-500/10 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-150 dark:border-slate-800/80 shadow-xs font-semibold'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[85%] items-start"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5">
                  <Sparkles size={14} />
                </div>
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-150 dark:border-slate-800/80 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Orion is auditing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Query workspace intelligence for ${project.name}...`}
              className="w-full pl-5 pr-12 py-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all text-xs font-semibold text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 p-2 rounded-full bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors shadow-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectOrion;
