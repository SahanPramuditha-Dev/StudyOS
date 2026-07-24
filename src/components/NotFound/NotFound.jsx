import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-3xl" />
          <div className="relative p-8 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800">
            <Compass size={80} className="text-primary-500" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-8xl font-black text-slate-800 dark:text-white tracking-tighter">
            404
          </h1>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
            Lost in space?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps it never existed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
          >
            <Home size={18} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
