import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ArrowUpRight, ArrowDownLeft, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';
import EmptyState from '../../../components/EmptyState';

const DebtAndLentManager = ({ budgetData, setBudgetData }) => {
  const { debts = [], peerMoney = { youOwe: [], othersOweYou: [] }, currency = 'Rs.' } = budgetData;

  const [activeTab, setActiveTab] = useState('debts'); // 'debts' | 'peer'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Forms
  const [peerType, setPeerType] = useState('youOwe'); // 'youOwe' | 'othersOweYou'
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');

  const totalDebt = debts.reduce((acc, d) => acc + (d.remainingAmount || 0), 0);
  const totalMonthlyPayment = debts.reduce((acc, d) => acc + (d.monthlyPayment || 0), 0);

  const totalYouOwe = peerMoney.youOwe.filter(p => !p.paid).reduce((acc, p) => acc + p.amount, 0);
  const totalOthersOwe = peerMoney.othersOweYou.filter(p => !p.paid).reduce((acc, p) => acc + p.amount, 0);

  const handleAddPeerItem = (e) => {
    e.preventDefault();
    if (!person || !amount) return;

    const newItem = {
      id: `po_${Date.now()}`,
      name: person,
      amount: parseFloat(amount),
      reason,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      paid: false
    };

    setBudgetData({
      ...budgetData,
      peerMoney: {
        ...peerMoney,
        [peerType]: [...peerMoney[peerType], newItem]
      }
    });

    setPerson('');
    setAmount('');
    setReason('');
    setIsAddModalOpen(false);
  };

  const handleTogglePaid = (type, id) => {
    const updatedList = peerMoney[type].map(item =>
      item.id === id ? { ...item, paid: !item.paid } : item
    );

    setBudgetData({
      ...budgetData,
      peerMoney: {
        ...peerMoney,
        [type]: updatedList
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Debt & Peer Money Manager</h2>
          <p className="text-xs text-slate-500">Track student loans, credit cards, borrowed & lent money</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Track Peer Money
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Formal Debt</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{currency} {totalDebt.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-2">Monthly Payment: {currency} {totalMonthlyPayment.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-3xl border border-rose-500/20 bg-rose-500/10 backdrop-blur-xl shadow-lg">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">You Owe (Friends)</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{currency} {totalYouOwe.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-rose-500 mt-2">{peerMoney.youOwe.filter(p => !p.paid).length} pending payments</p>
        </div>

        <div className="p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl shadow-lg">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Others Owe You</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{currency} {totalOthersOwe.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-emerald-500 mt-2">{peerMoney.othersOweYou.filter(p => !p.paid).length} pending receivables</p>
        </div>
      </div>

      {/* Main Peer Money View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* You Owe Section */}
        <div className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg">
          <h3 className="text-base font-black text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
            <ArrowUpRight size={18} /> You Owe
          </h3>

          <div className="space-y-3">
            {peerMoney.youOwe.length === 0 ? (
              <EmptyState
                compact
                icon={<ArrowUpRight size={24} />}
                title="No Money Owed"
                description="You don't owe money to any friends right now."
              />
            ) : (
              peerMoney.youOwe.map((item) => (
                <div key={item.id} className={`p-4 rounded-2xl border flex items-center justify-between ${item.paid ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-rose-500/5 border-rose-500/20'}`}>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.reason || 'Personal loan'} • Due: {item.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-rose-500 text-base">{currency} {item.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleTogglePaid('youOwe', item.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${item.paid ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500 text-white'}`}
                    >
                      {item.paid ? 'Paid' : 'Mark Paid'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Others Owe You Section */}
        <div className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg">
          <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
            <ArrowDownLeft size={18} /> Others Owe You
          </h3>

          <div className="space-y-3">
            {peerMoney.othersOweYou.length === 0 ? (
              <EmptyState
                compact
                icon={<ArrowDownLeft size={24} />}
                title="No Receivables"
                description="No friends owe you money right now."
              />
            ) : (
              peerMoney.othersOweYou.map((item) => (
                <div key={item.id} className={`p-4 rounded-2xl border flex items-center justify-between ${item.paid ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.reason || 'Lent money'} • Due: {item.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-500 text-base">{currency} {item.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleTogglePaid('othersOweYou', item.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${item.paid ? 'bg-emerald-500/20 text-emerald-600' : 'bg-emerald-500 text-white'}`}
                    >
                      {item.paid ? 'Received' : 'Mark Received'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Add Peer Entry */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Track Borrowed / Lent Money</h3>
              <form onSubmit={handleAddPeerItem} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Record Type</label>
                  <select
                    value={peerType}
                    onChange={(e) => setPeerType(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    <option value="youOwe">You owe someone (Borrowed)</option>
                    <option value="othersOweYou">Someone owes you (Lent)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun"
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Amount ({currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Group Dinner split"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DebtAndLentManager;
