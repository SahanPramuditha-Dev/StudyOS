import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, GraduationCap, Plus, Trash2, WalletCards } from 'lucide-react';

const BudgetPlanner = ({ budgetData, setBudgetData }) => {
  const { categories = [], categoryBudgets = {}, expenses = [], recurringTransactions = [], studentPlan = {}, currency = '$' } = budgetData;
  const [limitCategory, setLimitCategory] = useState(categories[0] || '');
  const [limit, setLimit] = useState('');
  const [recurringTitle, setRecurringTitle] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringType, setRecurringType] = useState('expense');
  const [studentField, setStudentField] = useState('Tuition');
  const [studentAmount, setStudentAmount] = useState('');

  const currentMonthExpenses = useMemo(() => expenses.filter((expense) => {
    const date = new Date(expense.date);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }), [expenses]);

  const spentByCategory = useMemo(() => currentMonthExpenses.reduce((totals, expense) => ({
    ...totals,
    [expense.category]: (totals[expense.category] || 0) + Number(expense.amount || 0),
  }), {}), [currentMonthExpenses]);

  const saveCategoryLimit = (event) => {
    event.preventDefault();
    if (!limitCategory || !limit || Number(limit) < 0) return;
    setBudgetData({ ...budgetData, categoryBudgets: { ...categoryBudgets, [limitCategory]: Number(limit) } });
    setLimit('');
  };

  const addRecurring = (event) => {
    event.preventDefault();
    if (!recurringTitle || !recurringAmount || Number(recurringAmount) <= 0) return;
    setBudgetData({
      ...budgetData,
      recurringTransactions: [...recurringTransactions, {
        id: crypto.randomUUID(), title: recurringTitle, amount: Number(recurringAmount), type: recurringType,
        dayOfMonth: new Date().getDate(), active: true,
      }],
    });
    setRecurringTitle(''); setRecurringAmount('');
  };

  const addStudentCost = (event) => {
    event.preventDefault();
    if (!studentField || !studentAmount || Number(studentAmount) <= 0) return;
    const costs = [...(studentPlan.costs || []), { id: crypto.randomUUID(), title: studentField, amount: Number(studentAmount) }];
    setBudgetData({ ...budgetData, studentPlan: { ...studentPlan, costs } });
    setStudentAmount('');
  };

  const alerts = Object.entries(categoryBudgets).map(([category, amount]) => {
    const spent = spentByCategory[category] || 0;
    return { category, amount, spent, percentage: amount > 0 ? (spent / amount) * 100 : 0 };
  }).filter((item) => item.percentage >= 80);

  const removeRecurring = (id) => setBudgetData({ ...budgetData, recurringTransactions: recurringTransactions.filter((item) => item.id !== id) });
  const removeStudentCost = (id) => setBudgetData({ ...budgetData, studentPlan: { ...studentPlan, costs: (studentPlan.costs || []).filter((item) => item.id !== id) } });

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white';
  const cardClass = 'rounded-3xl border border-white/20 bg-white/50 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50';

  return <div className="space-y-6">
    <div className="grid gap-6 xl:grid-cols-3">
      <section className={cardClass}>
        <h2 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><WalletCards size={14} className="text-cyan-500" /> Category budgets</h2>
        <form onSubmit={saveCategoryLimit} className="space-y-3">
          <select value={limitCategory} onChange={(e) => setLimitCategory(e.target.value)} className={inputClass} aria-label="Budget category">
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder={`Monthly limit (${currency})`} className={inputClass} required />
          <button className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-600"><Plus size={16} className="mr-1 inline" /> Save limit</button>
        </form>
        <div className="mt-5 space-y-3">
          {Object.entries(categoryBudgets).length === 0 ? <p className="text-sm font-semibold text-slate-400">Set limits to track each category.</p> : Object.entries(categoryBudgets).map(([category, amount]) => {
            const spent = spentByCategory[category] || 0; const percentage = Math.min(100, amount ? (spent / amount) * 100 : 0);
            return <div key={category}><div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>{category}</span><span>{currency}{spent.toFixed(2)} / {currency}{Number(amount).toFixed(2)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={percentage >= 100 ? 'h-full bg-rose-500' : percentage >= 80 ? 'h-full bg-amber-500' : 'h-full bg-cyan-500'} style={{ width: `${percentage}%` }} /></div></div>;
          })}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><CalendarClock size={14} className="text-violet-500" /> Recurring transactions</h2>
        <form onSubmit={addRecurring} className="space-y-3">
          <input value={recurringTitle} onChange={(e) => setRecurringTitle(e.target.value)} placeholder="e.g. Hostel rent" className={inputClass} required />
          <div className="flex gap-3"><input type="number" min="0" step="0.01" value={recurringAmount} onChange={(e) => setRecurringAmount(e.target.value)} placeholder={`Amount (${currency})`} className={inputClass} required /><select value={recurringType} onChange={(e) => setRecurringType(e.target.value)} className={inputClass}><option value="expense">Expense</option><option value="income">Income</option></select></div>
          <button className="w-full rounded-xl bg-violet-500 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-600"><Plus size={16} className="mr-1 inline" /> Add monthly item</button>
        </form>
        <div className="mt-5 space-y-2">{recurringTransactions.length === 0 ? <p className="text-sm font-semibold text-slate-400">No recurring items yet.</p> : recurringTransactions.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><div><p className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly {item.type}</p></div><div className="flex items-center gap-2"><span className="text-sm font-black text-violet-500">{currency}{Number(item.amount).toFixed(2)}</span><button onClick={() => removeRecurring(item.id)} aria-label={`Remove ${item.title}`} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button></div></div>)}</div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><GraduationCap size={14} className="text-emerald-500" /> Student plan</h2>
        <form onSubmit={addStudentCost} className="space-y-3"><input value={studentField} onChange={(e) => setStudentField(e.target.value)} placeholder="e.g. Tuition" className={inputClass} required /><input type="number" min="0" step="0.01" value={studentAmount} onChange={(e) => setStudentAmount(e.target.value)} placeholder={`Planned amount (${currency})`} className={inputClass} required /><button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"><Plus size={16} className="mr-1 inline" /> Add study cost</button></form>
        <div className="mt-5 space-y-2">{(studentPlan.costs || []).length === 0 ? <p className="text-sm font-semibold text-slate-400">Track tuition, books, and semester costs.</p> : studentPlan.costs.map((cost) => <div key={cost.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><span className="text-sm font-bold text-slate-800 dark:text-white">{cost.title}</span><div className="flex items-center gap-2"><span className="text-sm font-black text-emerald-500">{currency}{Number(cost.amount).toFixed(2)}</span><button onClick={() => removeStudentCost(cost.id)} aria-label={`Remove ${cost.title}`} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button></div></div>)}</div>
      </section>
    </div>

    <section className={cardClass}><h2 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><AlertTriangle size={14} className="text-amber-500" /> Spending alerts</h2>{alerts.length === 0 ? <p className="text-sm font-semibold text-emerald-500">You’re within every category budget this month.</p> : <div className="space-y-2">{alerts.map((alert) => <div key={alert.category} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-700 dark:text-amber-300">{alert.category} is {Math.round(alert.percentage)}% used ({currency}{alert.spent.toFixed(2)} of {currency}{Number(alert.amount).toFixed(2)}).</div>)}</div>}</section>
  </div>;
};

export default BudgetPlanner;
