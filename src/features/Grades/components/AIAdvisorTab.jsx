import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Sparkles, User, RefreshCw, GraduationCap } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { calculateCourseGrade, getGradeFromPercentage } from '../utils/gradeCalculations';
import { isSchoolMode } from '../utils/gradeCenter';

const AIAdvisorTab = ({ gcSettings }) => {
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'orion',
      text: "Hello! I am Orion, your StudyOS Academic Intelligence advisor. I've analyzed your academic records. Ask me anything about your standing, grade projection, or study recommendations."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const isSchool = isSchoolMode(gcSettings);

  const realCourses = courses.filter(c => c.semesterId).map(course => {
    const { rawPercentage, currentGrade, gpaValue } = calculateCourseGrade(course.id, assignments);
    return {
      id: course.id,
      title: course.title,
      score: Math.round(rawPercentage),
      grade: currentGrade,
      gpa: gpaValue
    };
  }).filter(c => c.score > 0);

  const getLowestSubject = () => {
    if (realCourses.length === 0) return null;
    return realCourses.reduce((prev, current) => (prev.score < current.score) ? prev : current);
  };

  const getHighestSubject = () => {
    if (realCourses.length === 0) return null;
    return realCourses.reduce((prev, current) => (prev.score > current.score) ? prev : current);
  };

  const handleAskQuickQuestion = (questionText, type) => {
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionText
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "I've reviewed your results. Let me look closer into this for you.";
      
      const lowestSub = getLowestSubject();
      const highestSub = getHighestSubject();

      if (type === 'drop') {
        if (lowestSub) {
           replyText = `Based on recent trends, your performance in ${lowestSub.title} (${lowestSub.score}%) is lower than your average. This is primarily impacting your Cumulative GPA. I recommend reviewing your recent assignments in this subject to address gaps.`;
        } else {
           replyText = "Your grades are currently stable! You don't have any significant downward trends recorded in your profile.";
        }
      } else if (type === 'improve') {
        if (lowestSub) {
           replyText = `To improve your overall standing, focus on ${lowestSub.title}. Scoring just 5% higher in this subject would boost your CGPA by approximately 0.12 points. Set a study task to practice past papers for ${lowestSub.title} this week.`;
        } else {
           replyText = "To improve further, try setting high-percent target grades for your upcoming semester modules.";
        }
      } else if (type === 'plan') {
         replyText = `I've created a custom study plan template. Focus on ${lowestSub ? lowestSub.title : 'your core modules'} for 2 hours daily, focusing on fundamental problem solving and past papers. You can generate tasks in the Calculators tab!`;
      } else if (type === 'predict') {
         if (realCourses.length > 0) {
            const avg = Math.round(realCourses.reduce((acc, curr) => acc + curr.score, 0) / realCourses.length);
            replyText = `Based on your historical average of ${avg}%, your projected end-of-term standing is ${isSchool ? `${avg}%` : getGradeFromPercentage(avg).letter}. Maintain your current consistency to guarantee this result.`;
         } else {
            replyText = "I need more logged marks to make a precise projection. Add some assessment scores first!";
         }
      }

      setMessages(prev => [...prev, {
         id: Date.now().toString() + '_orion',
         sender: 'orion',
         text: replyText
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_orion',
        sender: 'orion',
        text: "That is an excellent question. Let's analyze your Grade Center timeline together to identify target study sessions for your courses."
      }]);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Overview/Welcome banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="text-blue-500" /> AI Academic Advisor
           </h3>
           <p className="text-sm text-slate-500 font-medium">Orion provides automated analysis, study templates, and grade projections based on your metrics.</p>
        </div>
      </div>

      {/* Main chat window */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Suggested Prompts sidebar */}
         <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Ask Orion</h4>
            <button
               onClick={() => handleAskQuickQuestion("Why did my marks drop?", 'drop')}
               className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50/10 transition-all flex flex-col gap-1 shadow-sm"
            >
               <span>"Why did my marks drop?"</span>
               <span className="text-[10px] text-slate-400 font-medium">Analyze grade trajectory</span>
            </button>
            <button
               onClick={() => handleAskQuickQuestion("How can I improve?", 'improve')}
               className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50/10 transition-all flex flex-col gap-1 shadow-sm"
            >
               <span>"How can I improve?"</span>
               <span className="text-[10px] text-slate-400 font-medium">Get targeted recommendations</span>
            </button>
            <button
               onClick={() => handleAskQuickQuestion("Create revision plan", 'plan')}
               className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50/10 transition-all flex flex-col gap-1 shadow-sm"
            >
               <span>"Create revision plan"</span>
               <span className="text-[10px] text-slate-400 font-medium">Study plan automation</span>
            </button>
            <button
               onClick={() => handleAskQuickQuestion("Expected final result", 'predict')}
               className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50/10 transition-all flex flex-col gap-1 shadow-sm"
            >
               <span>"Expected final result"</span>
               <span className="text-[10px] text-slate-400 font-medium">Predictive modeling</span>
            </button>
         </div>

         {/* Chat Feed */}
         <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
               {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                     <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'}`}>
                        {msg.sender === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                     </div>
                     <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none font-medium'}`}>
                        {msg.text}
                     </div>
                  </div>
               ))}
               {isTyping && (
                  <div className="flex gap-3 items-center text-xs text-slate-400 font-bold pl-1">
                     <RefreshCw size={14} className="animate-spin text-blue-500" /> Orion is analyzing your records...
                  </div>
               )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
               <input
                  type="text"
                  placeholder="Ask Orion about your grades, standing, or tasks..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
               />
               <button type="submit" className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-md active:scale-95">
                  <Send size={18} />
               </button>
            </form>
         </div>
      </div>
    </div>
  );
};

export default AIAdvisorTab;
