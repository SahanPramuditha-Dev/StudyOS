import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, CheckCircle, TrendingUp } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

const SavingsGoals = ({ budgetData, setBudgetData }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  const { savingsGoals = [], currency = '$' } = budgetData || {};

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (title && targetAmount) {
      const newGoal = {
        id: Date.now().toString(),
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0)
      };
      setBudgetData({
        ...budgetData,
        savingsGoals: [...savingsGoals, newGoal]
      });
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
    }
  };

  const handleAddFunds = (id, amount) => {
    setBudgetData({
      ...budgetData,
      savingsGoals: savingsGoals.map(g => 
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    });
  };

  const totalSaved = savingsGoals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
             <Target size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Saved</h4>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{currency}{totalSaved.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Progress</h4>
            <span className="text-xs font-bold text-cyan-500">{totalProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(totalProgress, 100)}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-cyan-500 rounded-full"
            />
          </div>
          <p className="text-xs font-bold text-slate-400 mt-2 text-right">Goal: {currency}{totalTarget.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[500px]">
        
        {/* Add Goal Form */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-fit">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Create New Goal</h2>
          
          {/* Preset Student Shortcuts */}
          <div className="mb-4 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Student Presets:</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Gaming Laptop', target: 250000, initial: 50000 },
                { name: 'New Phone', target: 120000, initial: 20000 },
                { name: 'University Trip', target: 45000, initial: 10000 },
                { name: 'Emergency Fund', target: 100000, initial: 25000 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(p.name);
                    setTargetAmount(p.target.toString());
                    setCurrentAmount(p.initial.toString());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500 hover:text-white transition-all text-[11px] font-bold"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddGoal} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Goal Name</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Emergency Fund"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Target Amount ({currency})</label>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="10000"
                min="1"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Initial Saving (Optional {currency})</label>
              <input
                type="number"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                placeholder="500"
                min="0"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm py-3 rounded-xl transition-colors mt-2 shadow-sm shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Goal
            </button>
          </form>
        </div>

        {/* Goals List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm overflow-y-auto custom-scrollbar p-6">
           <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Active Goals</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {savingsGoals.length === 0 ? (
               <EmptyState
                 compact
                 icon={<Target size={32} />}
                 title="No Savings Goals Yet"
                 description="Create a target goal (e.g. Gaming Laptop, Emergency Fund) to track your progress."
               />
             ) : (
               savingsGoals.map(goal => {
                 const progress = (goal.currentAmount / goal.targetAmount) * 100;
                 const isCompleted = progress >= 100;
                 return (
                   <div key={goal.id} className={`p-5 rounded-2xl border transition-all ${isCompleted ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           {isCompleted && <CheckCircle size={16} className="text-emerald-500" />}
                           {goal.title}
                         </h3>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                           {currency}{goal.currentAmount.toFixed(0)} / {currency}{goal.targetAmount.toFixed(0)}
                         </p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                         <span className="text-xs font-bold text-cyan-500">{Math.min(progress, 100).toFixed(0)}%</span>
                       </div>
                     </div>
                     
                     <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 1 }}
                          className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        />
                     </div>
                     
                     {!isCompleted && (
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleAddFunds(goal.id, 50)}
                           className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                         >
                           + {currency}50
                         </button>
                         <button 
                           onClick={() => handleAddFunds(goal.id, 100)}
                           className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex justify-center"
                         >
                           + {currency}100
                         </button>
                       </div>
                     )}
                   </div>
                 );
               })
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoals;
