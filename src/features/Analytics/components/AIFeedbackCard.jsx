import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Send, ArrowLeft, Bot, User } from 'lucide-react';
import { getAnalyticsFeedback, chatWithAI } from '../../../services/aiService';

const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-black text-white underline decoration-white/30 underline-offset-2 mx-1">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-indigo-100 font-semibold mx-0.5">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

const AIFeedbackCard = ({ stats }) => {
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat integration inside the card
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const fetchFeedback = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAnalyticsFeedback(stats);
      setFeedback(result);
    } catch (err) {
      console.error(err);
      setError('Failed to load AI insights.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (stats) {
      fetchFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  // Initializing chat logs when entering chat mode
  useEffect(() => {
    if (isChatActive && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I am your AI Coach. Based on your stats: Watch Time: ${stats.timeSpent}, Notes: ${stats.totalNotes}, Tasks: ${stats.completedTasks}. How can I assist you with your studies today?`
        }
      ]);
    }
  }, [isChatActive, stats, messages.length]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isChatLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsChatLoading(true);

    try {
      const context = JSON.stringify({ stats });
      const response = await chatWithAI(messages, inputValue, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I hit a snag loading the response.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="col-span-full rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />
      
      {/* Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black">
              {isChatActive ? 'AI Coach Session' : 'AI Weekly Summary'}
            </h3>
            <p className="text-indigo-100 text-sm font-medium">
              {isChatActive ? 'Chat directly with your personal study guide' : 'Personalized feedback based on your stats'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-20">
          {isChatActive ? (
            <button 
              onClick={() => setIsChatActive(false)}
              className="px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-md transition-all text-sm font-bold flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              View Summary
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsChatActive(true)}
                className="px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-md transition-all text-sm font-bold flex items-center gap-2"
              >
                <Sparkles size={16} />
                Ask AI Coach
              </button>
              <button 
                onClick={fetchFeedback}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Analyzing...' : 'Refresh'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="relative z-10 bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <AnimatePresence mode="wait">
          {!isChatActive ? (
            // Feedback Summary View
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[100px] flex items-center"
            >
              {isLoading && !feedback ? (
                <div className="flex flex-col gap-3 w-full animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
              ) : error ? (
                <p className="text-red-200 font-medium">{error}</p>
              ) : (
                <p className="text-lg leading-relaxed text-white/90 font-medium">
                  {feedback ? renderFormattedText(feedback) : 'Study more to generate personalized insights!'}
                </p>
              )}
            </motion.div>
          ) : (
            // Integrated Chat View
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Message List */}
              <div className="max-h-[260px] overflow-y-auto space-y-3 pr-2 scrollbar-none">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-400 text-white' : 'bg-white/25 text-indigo-100'}`}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[80%] text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600/90 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>
                      {renderFormattedText(msg.content)}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-white/25 rounded-lg text-indigo-100">
                      <Bot size={12} />
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                      <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message to your coach..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm font-semibold text-white placeholder-white/50 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isChatLoading}
                  className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 rounded-xl transition-colors shadow-md"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIFeedbackCard;
