import React, { useRef, useState } from 'react';
import { ArrowLeftRight, Landmark, Plus, Upload, Users } from 'lucide-react';

const BudgetOperations = ({ budgetData, setBudgetData }) => {
  const { accounts = [], sharedExpenses = [], currency = '$' } = budgetData;
  const [accountName, setAccountName] = useState(''); const [balance, setBalance] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [transferAmount, setTransferAmount] = useState('');
  const [shareTitle, setShareTitle] = useState(''); const [sharePerson, setSharePerson] = useState(''); const [shareAmount, setShareAmount] = useState('');
  const inputRef = useRef(null);
  const id = () => crypto.randomUUID();
  const addAccount = (e) => { e.preventDefault(); if (!accountName || !balance) return; setBudgetData({ ...budgetData, accounts: [...accounts, { id: id(), name: accountName, balance: Number(balance) }] }); setAccountName(''); setBalance(''); };
  const transfer = (e) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!from || !to || from === to || !amount) return;

    const fromAcc = accounts.find(a => a.id === from);
    const toAcc = accounts.find(a => a.id === to);
    const fromName = fromAcc ? fromAcc.name : 'Account';
    const toName = toAcc ? toAcc.name : 'Account';

    const newTransferLog = {
      id: id(),
      title: `Transfer: ${fromName} -> ${toName}`,
      amount: amount,
      category: 'Transfer',
      date: new Date().toISOString()
    };

    setBudgetData({
      ...budgetData,
      accounts: accounts.map((account) =>
        account.id === from ? { ...account, balance: account.balance - amount } :
        account.id === to ? { ...account, balance: account.balance + amount } : account
      ),
      expenses: [newTransferLog, ...(budgetData.expenses || [])],
      transfers: [...(budgetData.transfers || []), { id: id(), from, to, amount, date: new Date().toISOString() }]
    });
    setTransferAmount('');
  };
  const addShare = (e) => { e.preventDefault(); if (!shareTitle || !sharePerson || !shareAmount) return; setBudgetData({ ...budgetData, sharedExpenses: [...sharedExpenses, { id: id(), title: shareTitle, person: sharePerson, amount: Number(shareAmount), settled: false }] }); setShareTitle(''); setSharePerson(''); setShareAmount(''); };
  const importCsv = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const rows = String(reader.result).split(/\r?\n/).slice(1).filter(Boolean).map((row) => row.split(',').map((cell) => cell.replace(/^"|"$/g, '').trim())); const imported = rows.map(([title, amount, category = 'Other', date]) => ({ id: id(), title, amount: Number(amount), category, date: date ? new Date(date).toISOString() : new Date().toISOString() })).filter((item) => item.title && Number.isFinite(item.amount)); setBudgetData({ ...budgetData, expenses: [...(budgetData.expenses || []), ...imported] }); }; reader.readAsText(file); event.target.value = ''; };
  const card = 'rounded-3xl border border-white/20 bg-white/50 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50'; const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  return <div className="grid gap-6 pb-8 xl:grid-cols-3">
    <section className={card}><h2 className="mb-5 flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Landmark size={14} /> Accounts</h2><form onSubmit={addAccount} className="space-y-3"><input className={input} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Bank, cash, e-wallet" required /><input className={input} type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder={`Opening balance (${currency})`} required /><button className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white"><Plus size={15} className="mr-1 inline" /> Add account</button></form><div className="mt-4 space-y-2">{accounts.map((account) => <div key={account.id} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm font-bold dark:bg-slate-800"><span>{account.name}</span><span className="text-cyan-500">{currency}{Number(account.balance).toFixed(2)}</span></div>)}</div></section>
    <section className={card}><h2 className="mb-5 flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><ArrowLeftRight size={14} /> Transfer & import</h2><form onSubmit={transfer} className="space-y-3"><select className={input} value={from} onChange={(e) => setFrom(e.target.value)}><option value="">From account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select className={input} value={to} onChange={(e) => setTo(e.target.value)}><option value="">To account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><input className={input} type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder={`Amount (${currency})`} /><button className="w-full rounded-xl bg-violet-500 py-3 text-sm font-bold text-white">Transfer</button></form><button onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-500/40 py-3 text-sm font-bold text-cyan-500"><Upload size={15} /> Import expense CSV</button><input ref={inputRef} type="file" accept=".csv" onChange={importCsv} className="hidden" /></section>
    <section className={card}><h2 className="mb-5 flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Users size={14} /> Shared expenses</h2><form onSubmit={addShare} className="space-y-3"><input className={input} value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} placeholder="Expense" required /><input className={input} value={sharePerson} onChange={(e) => setSharePerson(e.target.value)} placeholder="Who owes you?" required /><input className={input} type="number" value={shareAmount} onChange={(e) => setShareAmount(e.target.value)} placeholder={`Amount owed (${currency})`} required /><button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white"><Plus size={15} className="mr-1 inline" /> Track amount</button></form><div className="mt-4 space-y-2">{sharedExpenses.map((item) => <button key={item.id} onClick={() => setBudgetData({ ...budgetData, sharedExpenses: sharedExpenses.map((expense) => expense.id === item.id ? { ...expense, settled: !expense.settled } : expense) })} className={`flex w-full justify-between rounded-xl p-3 text-left text-sm font-bold ${item.settled ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800' : 'bg-emerald-500/10 text-emerald-600'}`}><span>{item.person} · {item.title}</span><span>{currency}{item.amount.toFixed(2)}</span></button>)}</div></section>
  </div>;
};
export default BudgetOperations;
