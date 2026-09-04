import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, Plus, CheckCircle2, X, ShoppingBag } from 'lucide-react';

const BudgetCalendar = ({ budgetData, setBudgetData }) => {
  const { expenses = [], subscriptions = [], currency = 'Rs.' } = budgetData || {};
  
  // Interactive month navigation offset (0 = current month)
  const [monthOffset, setMonthOffset] = useState(0);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState(null); // { date, monthName, year, expenses }

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderDay, setReminderDay] = useState('15');

  // Calculate target month's days
  const { days, monthName, year, firstDayOffset } = useMemo(() => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    
    const monthStr = targetDate.toLocaleString('default', { month: 'long' });
    
    const daysArr = Array.from({ length: daysInMonth }, (_, i) => {
      // Find expenses for this specific day
      const dayExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getDate() === i + 1 && d.getMonth() === m && d.getFullYear() === y;
      });
      
      const totalSpent = dayExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
      return {
        date: i + 1,
        isToday: i + 1 === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
        expenses: dayExpenses,
        totalSpent
      };
    });
    
    return { days: daysArr, monthName: monthStr, year: y, firstDayOffset: firstDay };
  }, [expenses, monthOffset]);

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!reminderTitle || !reminderAmount) return;

    const newSub = {
      id: `sub_rem_${Date.now()}`,
      serviceName: reminderTitle,
      amount: parseFloat(reminderAmount) || 0,
      billingDate: parseInt(reminderDay, 10) || 15
    };

    if (setBudgetData) {
      setBudgetData({
        ...budgetData,
        subscriptions: [...subscriptions, newSub]
      });
    }

    setReminderTitle('');
    setReminderAmount('');
    setIsAddReminderOpen(false);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Calendar View */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col p-6 h-[600px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon size={20} className="text-cyan-500" />
              {monthName} {year}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMonthOffset(prev => prev - 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setMonthOffset(0)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setMonthOffset(prev => prev + 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar">
            {/* Empty slots for first day offset */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="rounded-xl border border-dashed border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 min-h-[60px]" />
            ))}
            
            {/* Days */}
            {days.map((day) => (
              <div 
                key={day.date} 
                onClick={() => setSelectedDayModal({ date: day.date, monthName, year, expenses: day.expenses, totalSpent: day.totalSpent })}
                className={`rounded-xl border p-2 flex flex-col gap-1 transition-all hover:border-cyan-500 cursor-pointer min-h-[60px] hover:shadow-md ${
                  day.isToday 
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' 
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                }`}
              >
                <span className={`text-xs font-bold ${day.isToday ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {day.date}
                </span>
                
                {day.totalSpent > 0 && (
                  <div className="mt-auto flex flex-col gap-1">
                    <div className="w-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-[10px] font-bold text-rose-500 truncate">-{currency} {day.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Upcoming Sidebar */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col p-6 h-[600px]">
          <div className="flex items-center gap-2 mb-6 shrink-0">
             <Bell size={16} className="text-amber-500" />
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upcoming Bills</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {subscriptions.length === 0 ? (
              <div className="text-xs font-bold text-slate-400 text-center py-4">No upcoming bills tracked.</div>
            ) : (
              subscriptions.map((sub, idx) => {
                const today = new Date();
                let daysUntil = (sub.billingDate || 15) - today.getDate();
                if (daysUntil < 0) {
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  daysUntil += daysInMonth;
                }
                const dateStr = daysUntil === 0 ? 'Today' : `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;

                return (
                  <div key={sub.id || idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm shrink-0 font-bold text-sm">
                      {(sub?.serviceName || sub?.name || 'S').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{sub.serviceName || sub.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">{dateStr}</p>
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {currency} {(sub.amount || 0).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button
            onClick={() => setIsAddReminderOpen(true)}
            className="w-full mt-4 py-3 text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors border border-dashed border-cyan-200 dark:border-cyan-900 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Reminder
          </button>
        </div>
        
      </div>

      {/* Modal: Selected Day Transactions Detail */}
      <AnimatePresence>
        {selectedDayModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    {selectedDayModal.monthName} {selectedDayModal.date}, {selectedDayModal.year}
                  </h3>
                  <p className="text-xs text-slate-400">Total Spent: <span className="font-bold text-rose-500">{currency} {(selectedDayModal.totalSpent || 0).toLocaleString()}</span></p>
                </div>
                <button onClick={() => setSelectedDayModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {(!selectedDayModal.expenses || selectedDayModal.expenses.length === 0) ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    No transactions logged on this day.
                  </div>
                ) : (
                  selectedDayModal.expenses.map((exp, idx) => (
                    <div key={exp.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                          <ShoppingBag size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{exp.title}</p>
                          <p className="text-[10px] font-medium text-slate-400">{exp.category || 'General'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-500">-{currency} {(exp.amount || 0).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedDayModal(null)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Bill Reminder */}
      <AnimatePresence>
        {isAddReminderOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Add Bill Reminder</h3>
              <form onSubmit={handleAddReminder} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Bill Title</label>
                  <input type="text" required placeholder="e.g. WiFi Bill, Hostel Rent" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Amount ({currency})</label>
                    <input type="number" required placeholder="1500" value={reminderAmount} onChange={(e) => setReminderAmount(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Due Day (1-31)</label>
                    <input type="number" required min="1" max="31" value={reminderDay} onChange={(e) => setReminderDay(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddReminderOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-bold text-xs">Save Reminder</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetCalendar;
