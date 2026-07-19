import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, DollarSign } from 'lucide-react';

const StudentLoansTracker = ({ budgetData, setBudgetData }) => {
  const [provider, setProvider] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  const { studentLoans = [], currency = '$' } = budgetData || {};

  const handleAddLoan = (e) => {
    e.preventDefault();
    if (provider && principal && interestRate) {
      const newLoan = {
        id: Date.now().toString(),
        provider,
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate),
        amountPaid: parseFloat(amountPaid || 0)
      };
      setBudgetData({
        ...budgetData,
        studentLoans: [...studentLoans, newLoan]
      });
      setProvider('');
      setPrincipal('');
      setInterestRate('');
      setAmountPaid('');
    }
  };

  const handlePayment = (id, amount) => {
    setBudgetData({
      ...budgetData,
      studentLoans: studentLoans.map(loan => 
        loan.id === id ? { ...loan, amountPaid: loan.amountPaid + amount } : loan
      )
    });
  };

  const totalDebt = studentLoans.reduce((acc, curr) => acc + (curr.principal - curr.amountPaid), 0);
  const totalPaid = studentLoans.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalPrincipal = studentLoans.reduce((acc, curr) => acc + curr.principal, 0);
  const payoffProgress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
             <GraduationCap size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Remaining Debt</h4>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{currency}{totalDebt.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payoff Progress</h4>
            <span className="text-xs font-bold text-cyan-500">{payoffProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(payoffProgress, 100)}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-cyan-500 rounded-full"
            />
          </div>
          <p className="text-xs font-bold text-slate-400 mt-2 text-right">Paid: {currency}{totalPaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[500px]">
        
        {/* Add Loan Form */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-fit">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Add Loan</h2>
          <form onSubmit={handleAddLoan} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Provider / Loan Name</label>
              <input
                type="text"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                placeholder="FedLoan Servicing"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Principal Amount ({currency})</label>
              <input
                type="number"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                placeholder="25000"
                min="1"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={e => setInterestRate(e.target.value)}
                  placeholder="4.5"
                  step="0.01"
                  min="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Already Paid ({currency})</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm py-3 rounded-xl transition-colors mt-2 shadow-sm shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Loan
            </button>
          </form>
        </div>

        {/* Loans List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm overflow-y-auto custom-scrollbar p-6">
           <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Active Loans</h2>
           
           <div className="grid grid-cols-1 gap-4">
             {studentLoans.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <GraduationCap size={48} className="opacity-20 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-500">No student loans tracked yet.</p>
               </div>
             ) : (
               studentLoans.map(loan => {
                 const remaining = Math.max(0, loan.principal - loan.amountPaid);
                 const progress = (loan.amountPaid / loan.principal) * 100;
                 return (
                   <div key={loan.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-6 md:items-center">
                     <div className="flex-1">
                       <h3 className="font-bold text-slate-800 dark:text-white">{loan.provider}</h3>
                       <div className="flex items-center gap-4 mt-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           Rate: <span className="text-slate-700 dark:text-slate-300">{loan.interestRate}%</span>
                         </span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           Original: <span className="text-slate-700 dark:text-slate-300">{currency}{loan.principal.toFixed(0)}</span>
                         </span>
                       </div>
                       
                       <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-cyan-500 rounded-full"
                          />
                       </div>
                     </div>
                     
                     <div className="flex flex-col items-end shrink-0 gap-3">
                       <div className="text-right">
                         <span className="text-xs font-bold text-slate-400 block mb-0.5">Remaining</span>
                         <span className="text-lg font-black text-rose-500">{currency}{remaining.toFixed(2)}</span>
                       </div>
                       
                       {remaining > 0 && (
                         <button 
                           onClick={() => handlePayment(loan.id, 100)}
                           className="py-1.5 px-3 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                         >
                           <DollarSign size={14} /> Pay {currency}100
                         </button>
                       )}
                     </div>
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

export default StudentLoansTracker;
