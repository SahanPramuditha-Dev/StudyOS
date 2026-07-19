import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Plus, Users } from 'lucide-react';
import { suggestCategory } from './utils';

const QuickAddExpenseModal = ({ isOpen, onClose, budgetData, setBudgetData }) => {
  const categories = budgetData?.categories?.length > 0 
    ? budgetData.categories 
    : ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const currency = budgetData?.currency || '$';

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] || '');
    }
  }, [categories, category]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setCategory(categories[0]);
      setHasReceipt(false);
      setIsSplit(false);
      setSplitCount(2);
    }
  }, [isOpen, categories]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const suggested = suggestCategory(newTitle, categories);
    if (suggested) {
      setCategory(suggested);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && amount) {
      const parsedAmount = parseFloat(amount);
      const finalAmount = isSplit ? parsedAmount / splitCount : parsedAmount;
      
      const newExpense = {
        id: Date.now().toString(),
        title,
        amount: finalAmount,
        originalAmount: isSplit ? parsedAmount : null,
        isSplit,
        splitCount: isSplit ? splitCount : null,
        category,
        hasReceipt,
        date: new Date().toISOString()
      };
      setBudgetData({
        ...budgetData,
        expenses: [...(budgetData.expenses || []), newExpense]
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/80 overflow-hidden"
          >
            <div className="p-5 border-b border-white/10 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center shadow-inner">
                    <Plus size={16} />
                  </span>
                  Quick Add Expense
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Expense Title <span className="font-normal text-slate-400">(Auto-categorizes)</span></label>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Uber, Starbucks"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Amount ({currency})</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="4.50"
                      step="0.01"
                      min="0"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none appearance-none font-semibold"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="qa-split" 
                      checked={isSplit}
                      onChange={(e) => setIsSplit(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <label htmlFor="qa-split" className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
                      <Users size={14} /> Split Bill
                    </label>
                  </div>
                  {isSplit && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total People:</span>
                      <input 
                        type="number" 
                        min="2" 
                        max="20"
                        value={splitCount}
                        onChange={e => setSplitCount(parseInt(e.target.value) || 2)}
                        className="w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-center text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
                {isSplit && amount && (
                  <div className="text-xs font-bold text-emerald-500 text-right px-2">
                    You pay: {currency}{(parseFloat(amount) / splitCount).toFixed(2)}
                  </div>
                )}

                <div className="flex items-center gap-2 px-1">
                  <input 
                    type="checkbox" 
                    id="qa-receipt" 
                    checked={hasReceipt}
                    onChange={(e) => setHasReceipt(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                  />
                  <label htmlFor="qa-receipt" className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
                    <Paperclip size={14} /> Attach Receipt
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Save Expense
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickAddExpenseModal;
