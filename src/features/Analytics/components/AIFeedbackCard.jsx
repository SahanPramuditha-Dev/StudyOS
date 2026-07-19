import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getAnalyticsFeedback } from '../../../services/aiService';

const AIFeedbackCard = ({ stats }) => {
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full xl:col-span-12 rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black">AI Weekly Summary</h3>
            <p className="text-indigo-100 text-sm font-medium">Personalized feedback based on your stats</p>
          </div>
        </div>
        
        <button 
          onClick={fetchFeedback}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="relative z-10 bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-h-[100px] flex items-center">
        {isLoading && !feedback ? (
          <div className="flex items-center gap-3 w-full animate-pulse">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <p className="text-red-200 font-medium">{error}</p>
        ) : (
          <p className="text-lg leading-relaxed text-white/90 font-medium">
            {feedback || 'Study more to generate personalized insights!'}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default AIFeedbackCard;
