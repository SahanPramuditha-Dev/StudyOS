import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Landmark, CreditCard, PiggyBank, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2, Edit } from 'lucide-react';
import EmptyState from '../../../components/EmptyState';

const accountTypeIcons = {
  'Cash': Wallet,
  'Bank account': Landmark,
  'Savings account': PiggyBank,
  'Debit card': CreditCard,
  'Credit card': CreditCard,
  'Digital wallet': Wallet,
  'Other accounts': Wallet
};

const AccountsManager = ({ budgetData, setBudgetData }) => {
  const { accounts = [], expenses = [], incomes = [], currency = 'Rs.' } = budgetData;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank account');
  const [balance, setBalance] = useState('');

  // Transfer states
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!name || !balance) return;

    const newAcc = {
      id: `acc_${Date.now()}`,
      name,
      type,
      balance: parseFloat(balance),
      currency
    };

    setBudgetData({
      ...budgetData,
      accounts: [...accounts, newAcc]
    });

    setName('');
    setBalance('');
    setIsAddModalOpen(false);
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!fromAccountId || !toAccountId || !amt || fromAccountId === toAccountId) return;

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amt };
      if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amt };
      return acc;
    });

    setBudgetData({
      ...budgetData,
      accounts: updatedAccounts
    });

    setTransferAmount('');
    setIsTransferModalOpen(false);
  };

  const handleDeleteAccount = (id) => {
    setBudgetData({
      ...budgetData,
      accounts: accounts.filter(a => a.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Accounts & Wallets</h2>
          <p className="text-xs text-slate-500">Manage cash, bank accounts, digital wallets & cards</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} /> Transfer Money
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Account
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={36} />}
          title="No Accounts or Wallets Added"
          description="Add your cash wallet, bank account, debit card, or digital wallet to start tracking balances and transactions."
          actions={
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Add Your First Account
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const IconComp = accountTypeIcons[acc.type] || Wallet;
            return (
              <motion.div
                key={acc.id}
                whileHover={{ y: -4 }}
                className={`p-5 rounded-3xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg relative overflow-hidden group cursor-pointer ${
                  selectedAccount?.id === acc.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200/60 dark:border-slate-800'
                }`}
                onClick={() => setSelectedAccount(acc)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <IconComp size={20} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(acc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-500">{acc.type}</p>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{acc.name}</h3>

                <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex items-baseline justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Balance</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {currency} {acc.balance.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Selected Account Activity */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Account Details: {selectedAccount.name}
            </h3>
            <button
              onClick={() => setSelectedAccount(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Expenses</h4>
              <div className="space-y-2">
                {expenses.filter(e => e.accountId === selectedAccount.id).slice(0, 5).map(e => (
                  <div key={e.id} className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{e.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(e.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-black text-rose-500">- {currency} {e.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Incomes</h4>
              <div className="space-y-2">
                {incomes.filter(i => i.accountId === selectedAccount.id).slice(0, 5).map(i => (
                  <div key={i.id} className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{i.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(i.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-black text-emerald-500">+ {currency} {i.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal Add Account */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Add New Account</h3>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Bank Student"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Account Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    <option>Cash</option>
                    <option>Bank account</option>
                    <option>Savings account</option>
                    <option>Debit card</option>
                    <option>Credit card</option>
                    <option>Digital wallet</option>
                    <option>Other accounts</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Current Balance ({currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
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
                    Save Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Transfer */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Transfer Money</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">From Account</label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currency} {a.balance})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">To Account</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currency} {a.balance})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Amount ({currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    Execute Transfer
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

export default AccountsManager;
