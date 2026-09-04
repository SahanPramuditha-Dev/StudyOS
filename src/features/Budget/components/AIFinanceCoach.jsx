import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Send, Lightbulb, TrendingUp, AlertCircle, Award } from 'lucide-react';

const AIFinanceCoach = ({ budgetData }) => {
  const { expenses = [], incomes = [], currency = 'Rs.' } = budgetData;

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your StudyOS AI Financial Coach. Ask me anything about your budget, safe spending limits, or saving for your goals!'
    }
  ]);

  const proactiveInsights = [
    {
      type: 'warning',
      title: '💡 Financial Insight',
      text: 'Food spending increased 22% this month. Your average lunch expense is Rs. 520. Cooking lunch twice a week could save ~Rs. 4,000/month.'
    },
    {
      type: 'goal',
      title: '🎯 Goal Alert',
      text: 'You are currently saving Rs. 4,000/month. Increasing this to Rs. 6,000 would help you reach your Gaming Laptop goal 2 months earlier!'
    }
  ];

  const handleSendQuery = (e) => {
    e.preventDefault();
    const totalSpent = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const foodSpent = expenses.filter(e => (e.category || '').toLowerCase().includes('food')).reduce((acc, curr) => acc + curr.amount, 0);

    const userMsg = { sender: 'user', text: inputQuery };
    let aiResponseText = `Based on your live StudyOS balance and transactions, your current net cashflow is ${currency} ${(totalIncome - totalSpent).toLocaleString()}. You are maintaining a healthy budget utilization!`;

    const q = inputQuery.toLowerCase();
    if (q.includes('food') || q.includes('canteen') || q.includes('lunch')) {
      aiResponseText = `You have spent ${currency} ${foodSpent.toLocaleString()} on Food & Dining this month. Bringing lunch twice a week could save ~${currency} 4,000/month!`;
    } else if (q.includes('afford') || q.includes('phone') || q.includes('gpu') || q.includes('laptop')) {
      aiResponseText = `Purchasing a major item now may reduce your emergency savings cushion below your 1-month target. Use the 'Can I Afford This?' tool for a detailed breakdown.`;
    } else if (q.includes('save') || q.includes('goal')) {
      aiResponseText = `You have active goals logged. You are currently saving ~${currency} 4,000/month towards your targets. Increasing this by ${currency} 2,000 saves 2 full months!`;
    }

    setMessages((prev) => [...prev, userMsg, { sender: 'ai', text: aiResponseText }]);
    setInputQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">AI Finance Assistant & Coach</h2>
          <p className="text-xs text-slate-500">Proactive student insights & conversational budget guidance</p>
        </div>
      </div>

      {/* Proactive Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proactiveInsights.map((insight, i) => (
          <div key={i} className="p-5 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl shadow-sm">
            <h4 className="text-sm font-black text-cyan-700 dark:text-cyan-300 mb-1 flex items-center gap-2">
              {insight.title}
            </h4>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>

      {/* Chat Box */}
      <div className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-500 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* 1-Tap Suggested Prompt Bubbles */}
        <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/60">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Suggested Questions:</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              'How much did I spend on food this month?',
              'Can I afford a new phone right now?',
              'How can I save LKR 5,000 more this month?'
            ].map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputQuery(promptText);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500 hover:text-white transition-all text-xs font-bold text-left border border-slate-200/40 dark:border-slate-700"
              >
                💬 {promptText}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendQuery} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask AI: 'Where did I spend the most this month?' or 'Can I afford a new phone?'"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Send size={14} /> Ask AI
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIFinanceCoach;
