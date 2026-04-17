import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Banknote,
  BarChart3,
  BellRing,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Landmark,
  Plus,
  PiggyBank,
  PieChart as PieChartIcon,
  Repeat2,
  Search,
  Sparkles,
  Trash2,
  Wallet,
  Zap,
  BookOpen,
  Film,
  UtensilsCrossed,
  TrainFront,
  MoreHorizontal,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';

const ACCOUNT_OPTIONS = [
  { id: 'cash', label: 'Cash', icon: Wallet, tone: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-500/10' },
  { id: 'bank', label: 'Bank', icon: Landmark, tone: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 'wallet', label: 'eWallet', icon: CircleDollarSign, tone: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
];

const CATEGORY_OPTIONS = [
  { id: 'food', label: 'Food', icon: UtensilsCrossed, color: '#f59e0b', budget: 3200 },
  { id: 'transport', label: 'Transport', icon: TrainFront, color: '#0ea5e9', budget: 1800 },
  { id: 'books', label: 'Books', icon: BookOpen, color: '#8b5cf6', budget: 2500 },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat2, color: '#10b981', budget: 1200 },
  { id: 'entertainment', label: 'Entertainment', icon: Film, color: '#ec4899', budget: 1400 },
  { id: 'misc', label: 'Misc', icon: MoreHorizontal, color: '#64748b', budget: 1000 },
];

const TAG_OPTIONS = [
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'personal', label: 'Personal', icon: Sparkles },
];

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

const currency = (value) => `Rs. ${Math.round(value || 0).toLocaleString()}`;
const dateKey = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const monthKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const formatMonthLabel = (key) => {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
};
const shiftMonth = (key, offset) => {
  const [year, month] = key.split('-').map(Number);
  const next = new Date(year, month - 1 + offset, 1);
  return monthKey(next);
};
const shortDate = (value) =>
  new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const todayInputValue = () => new Date().toISOString().split('T')[0];

const DEFAULT_FINANCE_STATE = {
  monthlyBudget: 12000,
  dailyAllowance: 450,
  savingsGoal: {
    label: 'Headphones',
    target: 5000,
    saved: 1400
  },
  categories: CATEGORY_OPTIONS.map(({ id, label, budget }) => ({
    id,
    label,
    budget
  })),
  accounts: [
    { id: 'cash', label: 'Cash', startingBalance: 3200 },
    { id: 'bank', label: 'Bank', startingBalance: 18000 },
    { id: 'wallet', label: 'eWallet', startingBalance: 2400 }
  ],
  recurring: [
    { id: 'rent', label: 'Rent', amount: 3600, categoryId: 'misc', accountId: 'bank', dayOfMonth: 1, active: true },
    { id: 'spotify', label: 'Spotify', amount: 399, categoryId: 'subscriptions', accountId: 'wallet', dayOfMonth: 5, active: true }
  ],
  recurringGeneratedMonths: [],
  transactions: []
};

const sameMonth = (value, monthStr) => dateKey(value).startsWith(monthStr);

const Budget = () => {
  const [finance, setFinance] = useStorage(STORAGE_KEYS.FINANCE, DEFAULT_FINANCE_STATE);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [repeatNote, setRepeatNote] = useState('');

  const [newCategory, setNewCategory] = useState({ label: '', budget: 800 });
  const [newRecurring, setNewRecurring] = useState({
    label: '',
    amount: '',
    categoryId: 'misc',
    accountId: 'cash',
    dayOfMonth: 1
  });
  const [savingsDeposit, setSavingsDeposit] = useState(500);
  const [transfer, setTransfer] = useState({
    amount: '',
    fromAccountId: 'cash',
    toAccountId: 'bank'
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    categoryId: 'food',
    accountId: 'cash',
    tag: 'academic',
    note: '',
    date: todayInputValue()
  });

  const month = useMemo(() => {
    const base = finance && typeof finance === 'object' ? finance : {};
    return {
      monthlyBudget: Math.max(0, Number(base.monthlyBudget) || DEFAULT_FINANCE_STATE.monthlyBudget),
      dailyAllowance: Math.max(0, Number(base.dailyAllowance) || DEFAULT_FINANCE_STATE.dailyAllowance),
      savingsGoal: {
        ...DEFAULT_FINANCE_STATE.savingsGoal,
        ...(base.savingsGoal || {})
      },
      categories: Array.isArray(base.categories) && base.categories.length
        ? base.categories
        : DEFAULT_FINANCE_STATE.categories,
      accounts: Array.isArray(base.accounts) && base.accounts.length
        ? base.accounts
        : DEFAULT_FINANCE_STATE.accounts,
      recurring: Array.isArray(base.recurring) ? base.recurring : [],
      recurringGeneratedMonths: Array.isArray(base.recurringGeneratedMonths) ? base.recurringGeneratedMonths : [],
      transactions: Array.isArray(base.transactions) ? base.transactions : []
    };
  }, [finance]);

  const selectedMonthTransactions = useMemo(
    () => month.transactions.filter((tx) => sameMonth(tx.date, selectedMonth)),
    [month.transactions, selectedMonth]
  );

  const expenseTransactions = selectedMonthTransactions.filter((tx) => tx.type === 'expense');
  const savingsTransactions = month.transactions.filter((tx) => tx.type === 'savings');

  const spent = expenseTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const budgetUsage = month.monthlyBudget > 0 ? Math.min(100, Math.round((spent / month.monthlyBudget) * 100)) : 0;
  const remaining = month.monthlyBudget - spent;
  const savingsTotal = month.savingsGoal.saved + savingsTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const savingsProgress = month.savingsGoal.target > 0 ? Math.min(100, Math.round((savingsTotal / month.savingsGoal.target) * 100)) : 0;
  const todaysSpent = expenseTransactions.filter((tx) => dateKey(tx.date) === dateKey()).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const allowanceLeft = month.dailyAllowance - todaysSpent;
  const previousMonthSpent = month.transactions
    .filter((tx) => sameMonth(tx.date, shiftMonth(selectedMonth, -1)) && tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const monthlyChange = previousMonthSpent ? Math.round(((spent - previousMonthSpent) / previousMonthSpent) * 100) : 0;
  const [selectedYear, selectedMonthIndex] = selectedMonth.split('-').map(Number);
  const daysInSelectedMonth = new Date(selectedYear, selectedMonthIndex, 0).getDate();

  const accountBalances = useMemo(() => {
    return month.accounts.map((account) => {
      const ledger = month.transactions.reduce((sum, tx) => {
        const amount = Number(tx.amount || 0);
        if (tx.type === 'expense' || tx.type === 'savings') {
          return tx.accountId === account.id ? sum - amount : sum;
        }
        if (tx.type === 'income') {
          return tx.accountId === account.id ? sum + amount : sum;
        }
        if (tx.type === 'transfer') {
          if (tx.fromAccountId === account.id) return sum - amount;
          if (tx.toAccountId === account.id) return sum + amount;
        }
        return sum;
      }, Number(account.startingBalance || 0));

      return {
        ...account,
        balance: ledger
      };
    });
  }, [month.accounts, month.transactions]);

  const categorySpend = useMemo(() => {
    return month.categories.map((category) => {
      const total = selectedMonthTransactions
        .filter((tx) => tx.type === 'expense' && tx.categoryId === category.id)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      return {
        ...category,
        spent: total,
        usage: category.budget > 0 ? Math.min(100, Math.round((total / category.budget) * 100)) : 0
      };
    });
  }, [month.categories, selectedMonthTransactions]);

  const pieData = categorySpend.filter((item) => item.spent > 0).map((item) => ({
    name: item.label,
    value: item.spent
  }));

  const weeklyData = useMemo(() => {
    const values = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const total = expenseTransactions
        .filter((tx) => dateKey(tx.date) === key)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      values.push({
        name: d.toLocaleDateString([], { weekday: 'short' }),
        amount: total
      });
    }
    return values;
  }, [expenseTransactions]);

  const dailyAverage = selectedMonthTransactions.length ? Math.round(spent / daysInSelectedMonth) : 0;

  const topCategory = [...categorySpend].sort((a, b) => b.spent - a.spent)[0];
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return selectedMonthTransactions
      .filter((tx) => {
        const category = month.categories.find((cat) => cat.id === tx.categoryId);
        const account = month.accounts.find((acc) => acc.id === tx.accountId || acc.id === tx.fromAccountId);
        if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
        if (accountFilter !== 'all' && tx.accountId !== accountFilter && tx.fromAccountId !== accountFilter) return false;
        if (!query) return true;
        return [
          tx.note,
          tx.title,
          category?.label,
          account?.label,
          tx.tag
        ].some((value) => String(value || '').toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return Number(b.amount || 0) - Number(a.amount || 0);
        if (sortBy === 'lowest') return Number(a.amount || 0) - Number(b.amount || 0);
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [selectedMonthTransactions, categoryFilter, accountFilter, month.categories, month.accounts, search, sortBy]);

  const alertMessage = useMemo(() => {
    if (budgetUsage >= 100) return 'You are over your monthly budget.';
    if (budgetUsage >= 85) return 'You are very close to your monthly budget.';
    const nearLimit = categorySpend.find((item) => item.usage >= 85);
    if (nearLimit) return `${nearLimit.label} is close to its category limit.`;
    if (todaysSpent > month.dailyAllowance) return 'You overspent your daily allowance today.';
    return 'Spending is on track.';
  }, [budgetUsage, categorySpend, todaysSpent, month.dailyAllowance]);

  useEffect(() => {
    const current = monthKey();
    if (selectedMonth !== current) return;
    if (!month.recurring.length) return;
    if (month.recurringGeneratedMonths.includes(current)) return;

    const generated = month.recurring
      .filter((item) => item.active !== false)
      .map((item) => ({
        id: createId(),
        type: 'expense',
        source: 'recurring',
        recurringTemplateId: item.id,
        title: item.label,
        amount: Number(item.amount || 0),
        categoryId: item.categoryId,
        accountId: item.accountId,
        tag: 'personal',
        note: `Recurring: ${item.label}`,
        date: todayInputValue(),
        createdAt: new Date().toISOString()
      }));

    if (!generated.length) return;

    setFinance((prev) => {
      const base = prev && typeof prev === 'object' ? prev : DEFAULT_FINANCE_STATE;
      if ((base.recurringGeneratedMonths || []).includes(current)) return base;
      return {
        ...base,
        transactions: [...generated, ...(base.transactions || [])],
        recurringGeneratedMonths: [...(base.recurringGeneratedMonths || []), current]
      };
    });
  }, [selectedMonth, month.recurring, month.recurringGeneratedMonths, setFinance]);

  const updateFinance = (updater) => {
    setFinance((prev) => {
      const base = prev && typeof prev === 'object' ? prev : DEFAULT_FINANCE_STATE;
      return typeof updater === 'function' ? updater(base) : { ...base, ...updater };
    });
  };

  const clearExpenseForm = () => {
    setExpenseForm({
      amount: '',
      categoryId: 'food',
      accountId: 'cash',
      tag: 'academic',
      note: '',
      date: todayInputValue()
    });
    setEditingId(null);
    setRepeatNote('');
  };

  const editTransaction = (transaction) => {
    setEditingId(transaction.id);
    setExpenseForm({
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      tag: transaction.tag || 'personal',
      note: transaction.note || '',
      date: transaction.date ? transaction.date.split('T')[0] : todayInputValue()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const repeatLast = () => {
    if (!filteredTransactions.length) return;
    const last = filteredTransactions[0];
    setExpenseForm({
      amount: last.amount,
      categoryId: last.categoryId,
      accountId: last.accountId,
      tag: last.tag || 'personal',
      note: last.note || '',
      date: todayInputValue()
    });
    setRepeatNote(`Repeat: ${last.note || last.title || 'last expense'}`);
    toast.success('Last expense loaded into the form.');
  };

  const handleExpenseSubmit = (event) => {
    event.preventDefault();
    const amount = Math.max(0, Number(expenseForm.amount) || 0);
    if (!amount) return toast.error('Enter a valid amount.');
    if (!expenseForm.categoryId) return toast.error('Pick a category.');
    if (!expenseForm.accountId) return toast.error('Pick an account.');

    const nextTransaction = {
      id: editingId || createId(),
      type: 'expense',
      title: month.categories.find((cat) => cat.id === expenseForm.categoryId)?.label || 'Expense',
      amount,
      categoryId: expenseForm.categoryId,
      accountId: expenseForm.accountId,
      tag: expenseForm.tag,
      note: expenseForm.note || repeatNote,
      date: expenseForm.date || todayInputValue(),
      createdAt: editingId ? selectedMonthTransactions.find((tx) => tx.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    updateFinance((prev) => {
      const transactions = editingId
        ? prev.transactions.map((tx) => (tx.id === editingId ? nextTransaction : tx))
        : [nextTransaction, ...prev.transactions];

      return {
        ...prev,
        transactions
      };
    });

    toast.success(editingId ? 'Expense updated.' : 'Expense added.');
    clearExpenseForm();
  };

  const deleteTransaction = (id) => {
    updateFinance((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id)
    }));
    toast.success('Expense deleted.');
    if (editingId === id) clearExpenseForm();
  };

  const addCategory = () => {
    if (!newCategory.label.trim()) return toast.error('Category name is required.');
    const id = newCategory.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (month.categories.some((category) => category.id === id)) return toast.error('Category already exists.');

    updateFinance((prev) => ({
      ...prev,
      categories: [...prev.categories, {
        id,
        label: newCategory.label.trim(),
        budget: Math.max(0, Number(newCategory.budget) || 0)
      }]
    }));
    setNewCategory({ label: '', budget: 800 });
  };

  const addRecurring = () => {
    if (!newRecurring.label.trim()) return toast.error('Recurring name is required.');
    updateFinance((prev) => ({
      ...prev,
      recurring: [
        {
          id: createId(),
          label: newRecurring.label.trim(),
          amount: Math.max(0, Number(newRecurring.amount) || 0),
          categoryId: newRecurring.categoryId,
          accountId: newRecurring.accountId,
          dayOfMonth: Math.max(1, Math.min(31, Number(newRecurring.dayOfMonth) || 1)),
          active: true
        },
        ...prev.recurring
      ]
    }));
    setNewRecurring({
      label: '',
      amount: '',
      categoryId: 'misc',
      accountId: 'cash',
      dayOfMonth: 1
    });
  };

  const removeRecurring = (id) => {
    updateFinance((prev) => ({
      ...prev,
      recurring: prev.recurring.filter((item) => item.id !== id)
    }));
  };

  const addSavingsDeposit = () => {
    const amount = Math.max(0, Number(savingsDeposit) || 0);
    if (!amount) return;
    updateFinance((prev) => ({
      ...prev,
      savingsGoal: {
        ...prev.savingsGoal,
        saved: Number(prev.savingsGoal.saved || 0) + amount
      },
      transactions: [
        {
          id: createId(),
          type: 'savings',
          title: `Savings deposit for ${prev.savingsGoal.label}`,
          amount,
          accountId: 'bank',
          date: todayInputValue(),
          createdAt: new Date().toISOString(),
          note: 'Savings deposit'
        },
        ...prev.transactions
      ]
    }));
    toast.success('Savings updated.');
    setSavingsDeposit(500);
  };

  const transferFunds = () => {
    const amount = Math.max(0, Number(transfer.amount) || 0);
    if (!amount) return toast.error('Enter a transfer amount.');
    if (transfer.fromAccountId === transfer.toAccountId) return toast.error('Choose two different accounts.');

    updateFinance((prev) => ({
      ...prev,
      transactions: [
        {
          id: createId(),
          type: 'transfer',
          title: 'Transfer',
          amount,
          fromAccountId: transfer.fromAccountId,
          toAccountId: transfer.toAccountId,
          date: todayInputValue(),
          createdAt: new Date().toISOString(),
          note: `${transfer.fromAccountId} to ${transfer.toAccountId}`
        },
        ...prev.transactions
      ]
    }));
    setTransfer({ amount: '', fromAccountId: 'cash', toAccountId: 'bank' });
    toast.success('Transfer recorded.');
  };

  const currentCategory = month.categories.find((cat) => cat.id === expenseForm.categoryId) || month.categories[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-8 pt-4 sm:px-6">
      <PageHeader
        title="Budget & Expenses"
        description="Track spending, categories, accounts, and savings in one clean student-friendly workspace."
        icon={<Wallet size={26} />}
        action={
          <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:w-11"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900 sm:min-w-[180px]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Viewing</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{formatMonthLabel(selectedMonth)}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:w-11"
            >
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth(monthKey())}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              Today
            </button>
          </div>
        }
      />

      <section className="card overflow-hidden border-none bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-xl shadow-primary-500/20 dark:from-slate-900 dark:to-primary-950">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] backdrop-blur">
              <Sparkles size={12} />
              Budget Pulse
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Keep spending visible in seconds.</h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              A clean overview of budget usage, savings, and daily allowance with the most important numbers always up top.
            </p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-white/75">Monthly usage</span>
                <span className="font-black">{budgetUsage}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${budgetUsage}%` }} />
              </div>
            </div>
          </div>

          {[
            { label: 'Monthly Budget', value: currency(month.monthlyBudget), icon: CircleDollarSign },
            { label: 'Total Spent', value: currency(spent), icon: Banknote },
            { label: 'Remaining', value: currency(remaining), icon: Wallet },
            { label: 'Savings', value: currency(savingsTotal), icon: PiggyBank },
            { label: 'Daily Allowance', value: currency(allowanceLeft), icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-white/70">
                <Icon size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.24em]">{label}</span>
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(330px,0.82fr)]">
        <div className="space-y-6">
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Quick Expense Entry</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Fast input for everyday student spending.</p>
              </div>
              <button
                type="button"
                onClick={repeatLast}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
              >
                <Repeat2 size={16} />
                Repeat last
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Amount</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xl font-black text-slate-900 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Note</span>
                  <input
                    type="text"
                    value={expenseForm.note}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Optional note"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Category</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">One tap selection</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {month.categories.map((category) => {
                    const categoryMeta = CATEGORY_OPTIONS.find((option) => option.id === category.id);
                    const Icon = categoryMeta?.icon || MoreHorizontal;
                    const active = expenseForm.categoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setExpenseForm((prev) => ({ ...prev, categoryId: category.id }))}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                          active
                            ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200'
                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-white dark:bg-slate-950' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <Icon size={16} style={{ color: categoryMeta?.color || '#64748b' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{category.label}</p>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{currency(category.budget)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Account</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {ACCOUNT_OPTIONS.map((account) => {
                      const active = expenseForm.accountId === account.id;
                      const Icon = account.icon;
                      return (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => setExpenseForm((prev) => ({ ...prev, accountId: account.id }))}
                          className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                            active
                              ? 'border-primary-300 bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10'
                              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          <Icon size={16} className={account.tone} />
                          <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">{account.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tag</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TAG_OPTIONS.map((tag) => {
                      const active = expenseForm.tag === tag.id;
                      const Icon = tag.icon;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setExpenseForm((prev) => ({ ...prev, tag: tag.id }))}
                          className={`flex items-center gap-2 rounded-2xl border px-3 py-3 transition ${
                            active
                              ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200'
                              : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                          }`}
                        >
                          <Icon size={15} />
                          <span className="text-sm font-bold">{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Date</span>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <div className="flex items-end gap-3">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 font-bold text-white transition hover:bg-primary-600"
                  >
                    {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
                    {editingId ? 'Update Expense' : 'Add Expense'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={clearExpenseForm}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentCategory ? `Selected category: ${currentCategory.label}` : 'Choose a category to continue.'}
              </p>
            </form>
          </section>

          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Analytics & Insights</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Simple visuals for category and weekly spending.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <BellRing size={16} className="text-primary-500" />
                {alertMessage}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="mb-4 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-primary-500" />
                  <h4 className="font-bold text-slate-800 dark:text-white">Spending by Category</h4>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary-500" />
                  <h4 className="font-bold text-slate-800 dark:text-white">Weekly Spending</h4>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip formatter={(value) => [currency(value), 'Spent']} />
                      <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Daily Average', value: currency(dailyAverage) },
                { label: 'Top Category', value: topCategory ? topCategory.label : 'None yet' },
                { label: 'Month vs Last', value: `${monthlyChange >= 0 ? '+' : ''}${monthlyChange}%` }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-lg font-black text-slate-800 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Transaction History</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Search, filter, sort, edit, or delete your expenses.</p>
              </div>
              <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 sm:min-w-[220px]">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {month.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">All Accounts</option>
                  {month.accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.label}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="newest">Newest</option>
                  <option value="highest">Highest</option>
                  <option value="lowest">Lowest</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                  No expenses found for this month. Add one above to get started.
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const category = month.categories.find((cat) => cat.id === tx.categoryId);
                  const account = month.accounts.find((acc) => acc.id === tx.accountId || acc.id === tx.fromAccountId);
                  const categoryMeta = CATEGORY_OPTIONS.find((option) => option.id === tx.categoryId);
                  const TagIcon = TAG_OPTIONS.find((tag) => tag.id === tx.tag)?.icon || Sparkles;

                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                          <TagIcon size={17} className={tx.tag === 'academic' ? 'text-primary-500' : 'text-violet-500'} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-800 dark:text-white">{tx.note || tx.title}</p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                              {tx.tag}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {category?.label || 'Category'} · {account?.label || 'Account'} · {shortDate(tx.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-800 dark:text-white">{currency(tx.amount)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{categoryMeta ? categoryMeta.label : 'Expense'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => editTransaction(tx)}
                          className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(tx.id)}
                          className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Monthly Budgets</h3>
            <div className="mt-4 space-y-4">
              {categorySpend.map((category) => {
                const stateColor = category.usage >= 100 ? 'bg-rose-500' : category.usage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={category.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{category.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {currency(category.spent)} of {currency(category.budget)}
                        </p>
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{category.usage}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${stateColor}`} style={{ width: `${category.usage}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Add Custom Category</p>
                <div className="mt-3 grid gap-2">
                  <input
                    type="text"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Category name"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="number"
                      value={newCategory.budget}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, budget: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-28"
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="flex-1 rounded-2xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Accounts</h3>
            <div className="mt-4 space-y-3">
              {accountBalances.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${ACCOUNT_OPTIONS.find((option) => option.id === account.id)?.bg || 'bg-slate-100'}`}>
                      {React.createElement(ACCOUNT_OPTIONS.find((option) => option.id === account.id)?.icon || Wallet, {
                        size: 18,
                        className: ACCOUNT_OPTIONS.find((option) => option.id === account.id)?.tone || 'text-slate-500'
                      })}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{account.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Current balance</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">{currency(account.balance)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-primary-500" />
                <h4 className="font-bold text-slate-800 dark:text-white">Transfer</h4>
              </div>
              <div className="mt-3 grid gap-2">
                <input
                  type="number"
                  value={transfer.amount}
                  onChange={(e) => setTransfer((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={transfer.fromAccountId}
                    onChange={(e) => setTransfer((prev) => ({ ...prev, fromAccountId: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {month.accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.label}</option>
                    ))}
                  </select>
                  <select
                    value={transfer.toAccountId}
                    onChange={(e) => setTransfer((prev) => ({ ...prev, toAccountId: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {month.accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={transferFunds}
                  className="rounded-2xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600"
                >
                  Record Transfer
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Savings Goal</h3>
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{month.savingsGoal.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currency(savingsTotal)} of {currency(month.savingsGoal.target)} saved
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${savingsProgress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{month.savingsGoal.target - savingsTotal > 0 ? `${currency(month.savingsGoal.target - savingsTotal)} left` : 'Goal reached'}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                value={savingsDeposit}
                onChange={(e) => setSavingsDeposit(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Deposit"
              />
              <button
                type="button"
                onClick={addSavingsDeposit}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Add
              </button>
            </div>
          </section>

          <section className="card">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Recurring Expenses</h3>
            <div className="mt-4 space-y-3">
              {month.recurring.map((item) => {
                const category = month.categories.find((cat) => cat.id === item.categoryId);
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {currency(item.amount)} · {category?.label || 'Category'} · Day {item.dayOfMonth}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecurring(item.id)}
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-2">
              <input
                type="text"
                value={newRecurring.label}
                onChange={(e) => setNewRecurring((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="New recurring expense"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  value={newRecurring.amount}
                  onChange={(e) => setNewRecurring((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newRecurring.dayOfMonth}
                  onChange={(e) => setNewRecurring((prev) => ({ ...prev, dayOfMonth: e.target.value }))}
                  placeholder="Day"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newRecurring.categoryId}
                  onChange={(e) => setNewRecurring((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {month.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
                <select
                  value={newRecurring.accountId}
                  onChange={(e) => setNewRecurring((prev) => ({ ...prev, accountId: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {month.accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addRecurring}
                className="rounded-2xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600"
              >
                Add recurring item
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Budget;
