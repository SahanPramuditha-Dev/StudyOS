import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, Plus, X, Activity, Briefcase, GraduationCap, DollarSign, Gift, Pencil } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const incomeCategoryIcons = {
  'Salary': Briefcase,
  'Financial Aid': GraduationCap,
  'Allowance': DollarSign,
  'Other': Gift
};

const BudgetDashboard = ({ budgetData, setBudgetData }) => {
  const { expenses = [], incomes = [], currency = '$', totalBudget = 0, savingsGoals = [] } = budgetData;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary');
  const [editingIncome, setEditingIncome] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (title && amount) {
      const newIncome = {
        id: Date.now().toString(),
        title,
        amount: parseFloat(amount),
        category,
        date: new Date().toISOString()
      };
      setBudgetData({
        ...budgetData,
        incomes: [...incomes, newIncome]
      });
      setTitle('');
      setAmount('');
    }
  };

  const handleDeleteIncome = (id) => {
    setBudgetData({
      ...budgetData,
      incomes: incomes.filter(inc => inc.id !== id)
    });
  };

  const handleSaveIncomeEdit = (event) => {
    event.preventDefault();
    if (!editingIncome?.title || !editingIncome?.amount) return;
    setBudgetData({
      ...budgetData,
      incomes: incomes.map((income) => income.id === editingIncome.id ? {
        ...income,
        title: editingIncome.title,
        amount: Number(editingIncome.amount),
        category: editingIncome.category,
        date: new Date(editingIncome.date).toISOString(),
        notes: editingIncome.notes || '',
      } : income),
    });
    setEditingIncome(null);
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const netCashFlow = totalIncome - totalSpent;

  // A funded budget with no spending is in its healthiest state. For all other
  // cases, calculate the score from savings rate, budget use, and active goals.
  let healthScore = 0;
  if (totalBudget > 0 && totalSpent === 0) {
    healthScore = 100;
  } else {
    if (totalIncome > 0) {
      const savingsRate = (totalIncome - totalSpent) / totalIncome;
      healthScore += Math.max(0, Math.min(40, savingsRate * 100)); // Up to 40 pts for 40%+ savings rate
    }
    if (totalBudget > 0) {
      const budgetUtil = totalSpent / totalBudget;
      if (budgetUtil <= 0.8) healthScore += 40;
      else if (budgetUtil <= 1.0) healthScore += 20;
    }
    if (savingsGoals.length > 0) {
      healthScore += 20;
    }
    healthScore = Math.round(healthScore);
  }

  let scoreColor = 'text-amber-500';
  let scoreStroke = '#f59e0b';
  let scoreBg = 'from-amber-500/10 to-amber-900/10 border-amber-500/20';
  
  if (healthScore >= 80) {
    scoreColor = 'text-emerald-500';
    scoreStroke = '#10b981';
    scoreBg = 'from-emerald-500/10 to-emerald-900/10 border-emerald-500/20';
  } else if (healthScore < 50) {
    scoreColor = 'text-rose-500';
    scoreStroke = '#f43f5e';
    scoreBg = 'from-rose-500/10 to-rose-900/10 border-rose-500/20';
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const cashFlowHistory = useMemo(() => {
    const entries = [
      ...incomes.map((item) => ({ date: new Date(item.date), income: Number(item.amount) || 0, expense: 0 })),
      ...expenses.map((item) => ({ date: new Date(item.date), income: 0, expense: Number(item.amount) || 0 })),
    ].sort((a, b) => a.date - b.date).slice(-10);
    return (entries.length ? entries : [{ income: 0, expense: 0 }]).reduce((history, entry) => {
      const previousBalance = history.at(-1)?.balance || 0;
      return [...history, { income: entry.income, expense: entry.expense, balance: previousBalance + entry.income - entry.expense }];
    }, []);
  }, [expenses, incomes]);

  const scoreFactors = totalBudget > 0 && totalSpent === 0
    ? [{ label: 'Fresh budget', value: 100, max: 100 }]
    : [
      { label: 'Budget use', value: totalBudget > 0 && totalSpent <= totalBudget ? 40 : 0, max: 40 },
      { label: 'Savings rate', value: totalIncome > 0 ? Math.round(Math.max(0, Math.min(40, ((totalIncome - totalSpent) / totalIncome) * 100))) : 0, max: 40 },
      { label: 'Savings goals', value: savingsGoals.length > 0 ? 20 : 0, max: 20 },
    ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      
      {/* Cash Flow Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Health Score Radial */}
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className={`relative rounded-3xl border bg-gradient-to-br ${scoreBg} p-6 shadow-lg backdrop-blur-xl flex items-center justify-between overflow-hidden group`}>
          <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="z-10 flex flex-col justify-between h-full">
            <p className={`text-[10px] font-black uppercase tracking-widest ${scoreColor} mb-2`}>Health Score</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-4xl font-black ${scoreColor}`}>{healthScore}</p>
              <span className={`text-xs font-bold ${scoreColor} opacity-70`}>/100</span>
            </div>
            <p className={`text-xs font-semibold mt-2 opacity-80 ${scoreColor}`}>
              {healthScore >= 80 ? 'Excellent shape!' : healthScore >= 50 ? 'Doing okay.' : 'Needs attention.'}
            </p>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {scoreFactors.map((factor) => `${factor.label} ${factor.value}/${factor.max}`).join(' · ')}
            </p>
          </div>
          
          <div className="relative w-24 h-24 shrink-0 z-10">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-200 dark:text-slate-800" />
              <motion.circle 
                cx="50" cy="50" r="40" 
                stroke={scoreStroke} 
                strokeWidth="8" 
                fill="none" 
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 251.2" }}
                animate={{ strokeDasharray: `${(healthScore / 100) * 251.2}, 251.2` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center ${scoreColor}`}>
              <Activity size={24} />
            </div>
          </div>
        </motion.div>

        {/* Total Income */}
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-900/10 p-6 shadow-lg backdrop-blur-xl group overflow-hidden">
          <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={cashFlowHistory}>
                 <Area type="monotone" dataKey="income" stroke="none" fill="#10b981" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
              <Wallet size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Total Income</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{currency}{totalIncome.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-rose-900/10 p-6 shadow-lg backdrop-blur-xl group overflow-hidden">
           <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={cashFlowHistory}>
                 <Area type="monotone" dataKey="expense" stroke="none" fill="#f43f5e" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
              <CreditCard size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Total Expenses</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{currency}{totalSpent.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Net Cash Flow */}
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className={`relative rounded-3xl border p-6 shadow-lg backdrop-blur-xl group overflow-hidden ${netCashFlow >= 0 ? 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-cyan-900/10' : 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-900/10'}`}>
          <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${netCashFlow >= 0 ? 'bg-cyan-500/20 text-cyan-500' : 'bg-amber-500/20 text-amber-500'}`}>
              <DollarSign size={20} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${netCashFlow >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}`}>Net Cash Flow</p>
            <p className={`text-3xl font-black mt-1 ${netCashFlow >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {netCashFlow >= 0 ? '+' : '-'}{currency}{Math.abs(netCashFlow).toFixed(2)}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
        
        {/* Advanced Income Tracker */}
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/20 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Wallet size={14} className="text-emerald-500" /> Income Sources
            </h3>
          </div>
          
          <form onSubmit={handleAddIncome} className="flex flex-col gap-3 mb-6 shrink-0 relative z-10 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Graphic Design Gig"
                className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                required
              />
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Amount`}
                className="w-28 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none font-semibold text-slate-600 dark:text-slate-300"
              >
                {Object.keys(incomeCategoryIcons).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button 
                type="submit"
                className="px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
            {incomes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <Wallet size={32} className="opacity-40" />
                </div>
                <p className="text-sm font-semibold">No income sources added yet.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {incomes.slice().reverse().map((inc, idx) => {
                  const Icon = incomeCategoryIcons[inc.category] || Gift;
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={inc.id} 
                      onClick={() => setSelectedTransaction({ ...inc, type: 'income' })}
                      className="flex cursor-pointer justify-between items-center p-4 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{inc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">{inc.category}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(inc.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-500 font-black text-lg">+{currency}{inc.amount.toFixed(2)}</span>
                        <button
                          onClick={(event) => { event.stopPropagation(); setEditingIncome({ ...inc, date: new Date(inc.date).toISOString().slice(0, 10) }); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all rounded-xl"
                          aria-label={`Edit ${inc.title}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(event) => { event.stopPropagation(); handleDeleteIncome(inc.id); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-xl"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Expenses List */}
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/20 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <CreditCard size={14} className="text-rose-500" /> Recent Transactions
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <CreditCard size={32} className="opacity-40" />
                </div>
                <p className="text-sm font-semibold">No recent transactions</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {expenses.slice().reverse().map((exp, idx) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={exp.id} 
                    onClick={() => setSelectedTransaction({ ...exp, type: 'expense' })}
                    className="flex cursor-pointer justify-between items-center p-4 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{exp.title}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md inline-block">{exp.category}</p>
                      </div>
                    </div>
                    <span className="text-rose-500 font-black text-lg">-{currency}{exp.amount.toFixed(2)}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
        
      </div>
      {editingIncome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setEditingIncome(null)}>
          <form onSubmit={handleSaveIncomeEdit} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-800 dark:text-white">Edit income</h3><p className="text-xs font-medium text-slate-400">Update the source details and save.</p></div><button type="button" onClick={() => setEditingIncome(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></div>
            <input value={editingIncome.title} onChange={(event) => setEditingIncome({ ...editingIncome, title: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Income source" required />
            <div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="0.01" value={editingIncome.amount} onChange={(event) => setEditingIncome({ ...editingIncome, amount: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Amount" required /><input type="date" value={editingIncome.date} onChange={(event) => setEditingIncome({ ...editingIncome, date: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" required /></div>
            <select value={editingIncome.category} onChange={(event) => setEditingIncome({ ...editingIncome, category: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">{Object.keys(incomeCategoryIcons).map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <textarea value={editingIncome.notes || ''} onChange={(event) => setEditingIncome({ ...editingIncome, notes: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Notes (optional)" rows="3" />
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setEditingIncome(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 dark:border-slate-700">Cancel</button><button className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600">Save changes</button></div>
          </form>
        </div>
      )}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between"><div><p className={`text-[10px] font-black uppercase tracking-widest ${selectedTransaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedTransaction.type}</p><h3 className="mt-1 text-xl font-black text-slate-800 dark:text-white">{selectedTransaction.title}</h3></div><button onClick={() => setSelectedTransaction(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</p><p className={`mt-1 text-lg font-black ${selectedTransaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedTransaction.type === 'income' ? '+' : '-'}{currency}{Number(selectedTransaction.amount).toFixed(2)}</p></div><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</p><p className="mt-1 font-bold text-slate-800 dark:text-white">{selectedTransaction.category || 'Uncategorised'}</p></div><div className="col-span-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p><p className="mt-1 font-bold text-slate-800 dark:text-white">{new Date(selectedTransaction.date).toLocaleDateString()}</p></div>{selectedTransaction.notes && <div className="col-span-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</p><p className="mt-1 text-slate-600 dark:text-slate-300">{selectedTransaction.notes}</p></div>}</div>
            <button onClick={() => { if (selectedTransaction.type === 'income') setEditingIncome({ ...selectedTransaction, date: new Date(selectedTransaction.date).toISOString().slice(0, 10) }); setSelectedTransaction(null); }} className="mt-5 w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white hover:bg-cyan-600">{selectedTransaction.type === 'income' ? 'Edit income' : 'Edit in Expenses'}</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BudgetDashboard;
