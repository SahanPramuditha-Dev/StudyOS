import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell } from 'lucide-react';

const BudgetCalendar = ({ budgetData }) => {
  const { expenses = [], currency = '$' } = budgetData || {};
  
  // Calculate current month's days
  const { days, monthName, year, firstDayOffset } = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    
    const monthStr = today.toLocaleString('default', { month: 'long' });
    
    const daysArr = Array.from({ length: daysInMonth }, (_, i) => {
      const dayDate = new Date(y, m, i + 1);
      // Find expenses for this specific day
      const dayExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getDate() === i + 1 && d.getMonth() === m && d.getFullYear() === y;
      });
      
      const totalSpent = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      
      return {
        date: i + 1,
        isToday: i + 1 === today.getDate(),
        expenses: dayExpenses,
        totalSpent
      };
    });
    
    return { days: daysArr, monthName: monthStr, year: y, firstDayOffset: firstDay };
  }, [expenses]);

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
              <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
          
          <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
            {/* Empty slots for first day offset */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="rounded-xl border border-dashed border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30" />
            ))}
            
            {/* Days */}
            {days.map((day) => (
              <div 
                key={day.date} 
                className={`rounded-xl border p-2 flex flex-col gap-1 transition-colors hover:border-cyan-500/30 cursor-pointer ${
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
                      <span className="text-[10px] font-bold text-rose-500 truncate">-{currency}{day.totalSpent.toFixed(0)}</span>
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
            {!budgetData?.subscriptions || budgetData.subscriptions.length === 0 ? (
              <div className="text-xs font-bold text-slate-400 text-center py-4">No upcoming bills tracked.</div>
            ) : (
              budgetData.subscriptions.map((sub, idx) => {
                const today = new Date();
                let daysUntil = sub.billingDate - today.getDate();
                if (daysUntil < 0) {
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  daysUntil += daysInMonth;
                }
                const dateStr = daysUntil === 0 ? 'Today' : `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm shrink-0 font-bold text-sm">
                      {sub.serviceName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{sub.serviceName}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">{dateStr}</p>
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {currency}{sub.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button className="w-full mt-4 py-3 text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors border border-dashed border-cyan-200 dark:border-cyan-900 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
            + Add Reminder
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default BudgetCalendar;
