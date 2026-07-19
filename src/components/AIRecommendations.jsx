import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { getRecommendations } from '../services/aiService';

const AIRecommendations = ({ title, description }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!title) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRecommendations(title, description || 'No description provided.');
      setRecommendations(result);
    } catch (err) {
      console.error(err);
      setError('Failed to load AI recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (title && !recommendations) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={64} className="text-indigo-500" />
      </div>
      
      <div className="relative z-10 flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Sparkles size={16} />
          AI Study Recommendations
        </h3>
        
        <button 
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-500 transition-colors disabled:opacity-50"
          title="Refresh Recommendations"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative z-10 text-sm text-slate-700 dark:text-slate-300">
        {isLoading && !recommendations ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-indigo-200 dark:bg-indigo-800/50 rounded w-3/4"></div>
            <div className="h-4 bg-indigo-200 dark:bg-indigo-800/50 rounded w-5/6"></div>
            <div className="h-4 bg-indigo-200 dark:bg-indigo-800/50 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <p className="text-rose-500 font-medium">{error}</p>
        ) : recommendations ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-indigo leading-relaxed prose-p:my-2 prose-ul:my-2 prose-li:my-1">
            <ReactMarkdown>{recommendations}</ReactMarkdown>
          </div>
        ) : (
          <p>Click refresh to get personalized study topics.</p>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
