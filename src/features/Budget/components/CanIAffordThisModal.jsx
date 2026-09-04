import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, HelpCircle, ShieldAlert, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

const CanIAffordThisModal = ({ isOpen, onClose, budgetData, setBudgetData }) => {
  const { accounts = [], bills = [], savingsGoals = [], expenses = [], currency = 'Rs.' } = budgetData;

  const [itemName, setItemName] = useState('RTX 4060 GPU');
  const [itemPrice, setItemPrice] = useState('120000');
  const [assessment, setAssessment] = useState(null);
  const [isLogged, setIsLogged] = useState(false);

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalUpcomingBills = bills.filter(b => b.status === 'upcoming').reduce((acc, b) => acc + b.amount, 0);
  const emergencyGoal = savingsGoals.find(g => g.name.toLowerCase().includes('emergency'));
  const emergencyBalance = emergencyGoal ? emergencyGoal.currentAmount : 25000;

  const handleCalculate = (e) => {
    e.preventDefault();
    const price = parseFloat(itemPrice) || 0;
    setIsLogged(false);

    let status = 'safe'; // 'safe' | 'risky' | 'unaffordable'
    let title = '🟢 Recommended & Safe';
    let reasoning = '';

    const netAvailable = totalBalance - totalUpcomingBills;

    if (price > totalBalance) {
      status = 'unaffordable';
      title = '🔴 Not Afforded';
      reasoning = `Your total balance (${currency} ${totalBalance.toLocaleString()}) is less than the item price (${currency} ${price.toLocaleString()}).`;
    } else if (price > netAvailable || (totalBalance - price) < emergencyBalance) {
      status = 'risky';
      title = '🟡 Possible, but risky';
      reasoning = `You can technically afford it, but purchasing it would reduce your available emergency savings below your target and delay your primary savings goals by approximately 2 months.`;
    } else {
      status = 'safe';
      title = '🟢 Safe Purchase';
      reasoning = `You have sufficient surplus balance (${currency} ${netAvailable.toLocaleString()}) to cover this purchase without affecting upcoming bills or emergency savings.`;
    }

    setAssessment({
      status,
      title,
      reasoning,
      price,
      remainingBalance: totalBalance - price
    });
  };

  const handleLogExpense = () => {
    if (!assessment) return;
    const newExpense = {
      id: Date.now(),
      title: itemName || 'Approved Purchase',
      amount: assessment.price,
      category: 'Shopping',
      date: new Date().toISOString().split('T')[0],
      isSplit: false
    };

    setBudgetData({
      ...budgetData,
      expenses: [newExpense, ...expenses]
    });
    setIsLogged(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">"Can I Afford This?"</h3>
              <p className="text-xs text-slate-500">Student Risk & Savings Impact Analyzer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">Close</button>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Item Name</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. RTX 4060 GPU"
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">Estimated Price ({currency})</label>
              <input
                type="number"
                required
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="120000"
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            Check Purchasing Safety
          </button>
        </form>

        {assessment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border ${
              assessment.status === 'risky'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : assessment.status === 'unaffordable'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <h4 className="text-base font-black mb-2">{assessment.title}</h4>
            <p className="text-xs font-semibold leading-relaxed mb-3">{assessment.reasoning}</p>

            <div className="pt-3 border-t border-slate-200/20 text-xs flex items-center justify-between font-bold">
              <div>
                <span>Post-purchase Balance: </span>
                <span>{currency} {assessment.remainingBalance.toLocaleString()}</span>
              </div>
              
              <button
                type="button"
                onClick={handleLogExpense}
                disabled={isLogged}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  isLogged 
                    ? 'bg-emerald-500 text-white opacity-90 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-sm'
                }`}
              >
                {isLogged ? <><CheckCircle2 size={14} /> Logged to Expenses</> : <><Wallet size={14} /> + Log as Expense</>}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CanIAffordThisModal;
