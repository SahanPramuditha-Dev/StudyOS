import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Bot, User } from 'lucide-react';
import { chatWithAI } from '../../../services/aiService';

const AIInsightsDrawer = ({ isOpen, onClose, stats }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your StudyOS AI Productivity Coach. Based on your current stats:
- Watch Time: ${stats.totalWatchTime} mins
- Average Course Progress: ${stats.avgProgress}%
- Notes Created: ${stats.totalNotes}
- Productivity Score: ${stats.productivityScore}/100

How can I help you optimize your study routine today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = JSON.stringify({ stats });
      const response = await chatWithAI(messages, inputValue, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while processing that request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How can I improve my productivity score?",
    "Suggest a study schedule for my courses",
    "How do I balance watch time and note taking?"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 text-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg">AI Coach Insights</h3>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Productivity Coaching</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-2 rounded-xl flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm font-semibold leading-relaxed ${msg.role === 'user' ? 'bg-primary-600/90 text-white rounded-tr-none' : 'bg-slate-800/60 text-slate-200 rounded-tl-none border border-slate-800'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-xl text-slate-300">
                    <Bot size={16} />
                  </div>
                  <div className="p-3 bg-slate-800/40 rounded-2xl rounded-tl-none border border-slate-800 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="p-6 bg-slate-950/40 border-t border-slate-800/50 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggested Prompts</p>
                <div className="flex flex-col gap-2">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputValue(p);
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-slate-300 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask your coach anything..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIInsightsDrawer;
