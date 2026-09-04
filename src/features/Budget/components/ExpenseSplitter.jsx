import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calculator, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const ExpenseSplitter = ({ budgetData, setBudgetData }) => {
  const { currency = 'Rs.' } = budgetData;

  const [title, setTitle] = useState('Dinner at Canteen');
  const [totalAmount, setTotalAmount] = useState('6000');
  const [friends, setFriends] = useState(['You', 'Friend 1', 'Friend 2', 'Friend 3']);
  const [newFriendName, setNewFriendName] = useState('');

  const numPeople = Math.max(1, friends.length);
  const perPersonCost = Math.round((parseFloat(totalAmount) || 0) / numPeople);

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!newFriendName) return;
    setFriends([...friends, newFriendName]);
    setNewFriendName('');
  };

  const handleRemoveFriend = (index) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
          <Users size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">University Expense Splitting</h2>
          <p className="text-xs text-slate-500">Easily split group dinners, project materials, and trips</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500">Event / Purchase Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Total Bill ({currency})</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">People Included ({friends.length})</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add friend name..."
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
              />
              <button
                onClick={handleAddFriend}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {friends.map((f, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2">
                  {f}
                  {f !== 'You' && (
                    <button onClick={() => handleRemoveFriend(idx)} className="text-slate-400 hover:text-rose-500">
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Result */}
        <div className="p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <p className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">Calculation Breakdown</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{title}</h3>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold border-b border-cyan-500/20 pb-2">
                <span>Total Amount:</span>
                <span>{currency} {parseFloat(totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold border-b border-cyan-500/20 pb-2">
                <span>Total People:</span>
                <span>{friends.length} people</span>
              </div>
              <div className="flex justify-between items-center text-base font-black text-cyan-600 dark:text-cyan-400 pt-2">
                <span>Each Person Owes:</span>
                <span>{currency} {perPersonCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Split calculation ready! Each person contributes ~{currency} {perPersonCost.toLocaleString()}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSplitter;
