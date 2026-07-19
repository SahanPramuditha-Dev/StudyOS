import React, { useState } from 'react';
import { RefreshCw, Plus, Trash2, CalendarDays } from 'lucide-react';

const SubscriptionsTracker = ({ budgetData, setBudgetData }) => {
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDate, setBillingDate] = useState('');

  const { subscriptions = [], currency = '$' } = budgetData || {};

  const handleAddSubscription = (e) => {
    e.preventDefault();
    if (serviceName && amount && billingDate) {
      const newSub = {
        id: Date.now().toString(),
        serviceName,
        amount: parseFloat(amount),
        billingDate: parseInt(billingDate, 10) // Day of the month (1-31)
      };
      setBudgetData({
        ...budgetData,
        subscriptions: [...subscriptions, newSub]
      });
      setServiceName('');
      setAmount('');
      setBillingDate('');
    }
  };

  const handleRemove = (id) => {
    setBudgetData({
      ...budgetData,
      subscriptions: subscriptions.filter(sub => sub.id !== id)
    });
  };

  const totalMonthly = subscriptions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalYearly = totalMonthly * 12;

  // Compute next billing string
  const getNextBillingDateStr = (day) => {
    const today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();
    if (day < today.getDate()) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    const nextDate = new Date(year, month, day);
    return nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
             <RefreshCw size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Monthly Cost</h4>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{currency}{totalMonthly.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
             <CalendarDays size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Yearly Projection</h4>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{currency}{totalYearly.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[500px]">
        
        {/* Add Subscription Form */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-fit">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Add Subscription</h2>
          <form onSubmit={handleAddSubscription} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                placeholder="Spotify Premium"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cost / Month ({currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="9.99"
                  step="0.01"
                  min="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Billing Day (1-31)</label>
                <input
                  type="number"
                  value={billingDate}
                  onChange={e => setBillingDate(e.target.value)}
                  placeholder="15"
                  min="1"
                  max="31"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm py-3 rounded-xl transition-colors mt-2 shadow-sm shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Subscription
            </button>
          </form>
        </div>

        {/* Subscriptions List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm overflow-y-auto custom-scrollbar p-6">
           <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Active Subscriptions</h2>
           
           <div className="flex flex-col gap-3">
             {subscriptions.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <RefreshCw size={48} className="opacity-20 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-500">No subscriptions tracked yet.</p>
               </div>
             ) : (
               subscriptions.map(sub => (
                 <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group transition-colors hover:border-cyan-500/30">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm shrink-0">
                       <span className="font-bold text-sm">{sub.serviceName.charAt(0)}</span>
                     </div>
                     <div>
                       <h3 className="font-bold text-slate-800 dark:text-white">{sub.serviceName}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                         Next billing: {getNextBillingDateStr(sub.billingDate)}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     <span className="text-sm font-black text-rose-500">
                       {currency}{sub.amount.toFixed(2)}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                     </span>
                     <button 
                       onClick={() => handleRemove(sub.id)}
                       className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                       title="Remove Subscription"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsTracker;
