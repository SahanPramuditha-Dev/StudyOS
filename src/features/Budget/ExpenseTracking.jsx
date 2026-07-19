import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, X, Paperclip, Users, SplitSquareHorizontal, Search, Download, Trash2, CheckSquare, Pencil } from 'lucide-react';
import { suggestCategory } from './utils';

const ExpenseTracking = ({ budgetData, setBudgetData }) => {
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

  // Phase 4 States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] || '');
    }
  }, [categories, category]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const suggested = suggestCategory(newTitle, categories);
    if (suggested) {
      setCategory(suggested);
    }
  };

  const handleAddExpense = (e) => {
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
        receiptName: hasReceipt ? 'Receipt attached' : '',
        notes: '',
        date: new Date().toISOString()
      };
      setBudgetData({
        ...budgetData,
        expenses: [...(budgetData.expenses || []), newExpense]
      });
      setTitle('');
      setAmount('');
      setHasReceipt(false);
      setIsSplit(false);
      setSplitCount(2);
    }
  };

  const handleDelete = (id) => {
    setBudgetData({
      ...budgetData,
      expenses: budgetData.expenses.filter(exp => exp.id !== id)
    });
  };

  const handleSaveEdit = (event) => {
    event.preventDefault();
    if (!editingExpense?.title || !editingExpense?.amount) return;
    setBudgetData({
      ...budgetData,
      expenses: (budgetData.expenses || []).map((expense) => expense.id === editingExpense.id ? {
        ...expense,
        title: editingExpense.title,
        amount: Number(editingExpense.amount),
        category: editingExpense.category,
        date: new Date(editingExpense.date).toISOString(),
        notes: editingExpense.notes || '',
        hasReceipt: Boolean(editingExpense.hasReceipt),
        receiptName: editingExpense.hasReceipt ? (editingExpense.receiptName || 'Receipt attached') : '',
      } : expense),
    });
    setEditingExpense(null);
  };

  const filteredExpenses = (budgetData.expenses || [])
    .filter(exp => filterCategory === 'All' || exp.category === filterCategory)
    .filter(exp => exp.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice().reverse();

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedExpenses(filteredExpenses.map(exp => exp.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (id) => {
    setSelectedExpenses(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setBudgetData({
      ...budgetData,
      expenses: budgetData.expenses.filter(exp => !selectedExpenses.includes(exp.id))
    });
    setSelectedExpenses([]);
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Amount', 'Category', 'Date', 'IsSplit', 'OriginalAmount', 'HasReceipt'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(exp => [
        `"${exp.title}"`, 
        exp.amount, 
        `"${exp.category}"`, 
        new Date(exp.date).toLocaleDateString(),
        exp.isSplit ? 'Yes' : 'No',
        exp.originalAmount || exp.amount,
        exp.hasReceipt ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 h-full pb-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-stretch">
        
        {/* Add Expense Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/20 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl h-full flex flex-col relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Banknote size={14} className="text-cyan-500" /> Add Expense
            </h2>
          </div>
          <form onSubmit={handleAddExpense} className="flex flex-col gap-4 relative z-10 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Title <span className="font-normal text-slate-400">(Auto-categorizes)</span></label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Lunch, Uber"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Amount ({currency})</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="15.50"
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
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none appearance-none font-semibold text-slate-600 dark:text-slate-300"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-3 mt-auto pt-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="split" 
                    checked={isSplit}
                    onChange={(e) => setIsSplit(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                  />
                  <label htmlFor="split" className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
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
                  id="receipt" 
                  checked={hasReceipt}
                  onChange={(e) => setHasReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                />
                <label htmlFor="receipt" className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
                  <Paperclip size={14} /> Attach Receipt
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-cyan-500/20 mt-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              Add Expense
            </button>
          </form>
        </motion.div>

        {/* Expense History List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-3xl border border-white/20 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-full min-h-[500px] relative"
        >
          <div className="p-4 border-b border-white/10 dark:border-slate-800/80 shrink-0 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
               <Banknote size={14} className="text-rose-500" /> Expense History
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 appearance-none font-semibold"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button 
                onClick={handleExportCSV}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-cyan-500 hover:border-cyan-500 transition-colors shadow-sm"
                title="Export to CSV"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {selectedExpenses.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-900/50 p-3 px-6 flex justify-between items-center z-10 shrink-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{selectedExpenses.length} selected</span>
                  <button 
                    onClick={() => setSelectedExpenses([])}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3 custom-scrollbar relative z-10">
            {filteredExpenses.length > 0 && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <input 
                  type="checkbox" 
                  checked={filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select All</span>
              </div>
            )}
            
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-4 py-12">
                 <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                    <Banknote size={32} className="opacity-40" />
                 </div>
                 <p className="text-sm font-semibold">No expenses found.</p>
              </div>
            ) : (
              filteredExpenses.map((exp, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={exp.id} 
                  className={`flex justify-between items-center p-4 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl border ${selectedExpenses.includes(exp.id) ? 'border-cyan-500 dark:border-cyan-500' : 'border-slate-100 dark:border-slate-700/50'} shadow-sm group cursor-pointer`}
                  onClick={() => handleSelectExpense(exp.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox"
                        checked={selectedExpenses.includes(exp.id)}
                        onChange={() => {}} // handled by parent onClick
                        className="w-5 h-5 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-50 border-slate-300 dark:bg-slate-900 dark:border-slate-700 pointer-events-none"
                      />
                    </div>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-inner">
                      <Banknote size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-[200px]">{exp.title}</h4>
                        {exp.isSplit && (
                          <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0" title={`Split between ${exp.splitCount} people (Total: ${currency}${exp.originalAmount})`}>
                            <SplitSquareHorizontal size={10} /> 1/{exp.splitCount}
                          </span>
                        )}
                        {exp.hasReceipt && (
                          <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 p-1.5 rounded-md shrink-0" title="Receipt attached">
                            <Paperclip size={12} />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md truncate max-w-[80px]">{exp.category}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-rose-500 font-black text-sm sm:text-lg block">-{currency}{exp.amount.toFixed(2)}</span>
                      {exp.isSplit && (
                        <span className="text-[10px] text-slate-400 font-bold block line-through">{currency}{exp.originalAmount?.toFixed(2)}</span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingExpense({ ...exp, date: new Date(exp.date).toISOString().slice(0, 10) });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all rounded-xl shrink-0"
                      title="Edit expense"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(exp.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-xl shrink-0"
                      title="Delete expense"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {editingExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setEditingExpense(null)}>
            <motion.form initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onSubmit={handleSaveEdit} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-800 dark:text-white">Edit transaction</h3><p className="text-xs font-medium text-slate-400">Update the details and save your changes.</p></div><button type="button" onClick={() => setEditingExpense(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"><X size={18} /></button></div>
              <input value={editingExpense.title} onChange={(event) => setEditingExpense({ ...editingExpense, title: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Title" required />
              <div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="0.01" value={editingExpense.amount} onChange={(event) => setEditingExpense({ ...editingExpense, amount: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Amount" required /><input type="date" value={editingExpense.date} onChange={(event) => setEditingExpense({ ...editingExpense, date: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" required /></div>
              <select value={editingExpense.category} onChange={(event) => setEditingExpense({ ...editingExpense, category: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <textarea value={editingExpense.notes || ''} onChange={(event) => setEditingExpense({ ...editingExpense, notes: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Notes (optional)" rows="3" />
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={Boolean(editingExpense.hasReceipt)} onChange={(event) => setEditingExpense({ ...editingExpense, hasReceipt: event.target.checked })} className="h-4 w-4 rounded text-cyan-500" /> Receipt attached</label>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setEditingExpense(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 dark:border-slate-700">Cancel</button><button className="flex-1 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white hover:bg-cyan-600">Save changes</button></div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExpenseTracking;
