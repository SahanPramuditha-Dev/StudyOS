import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, DollarSign, TrendingDown, PiggyBank, CreditCard, Landmark, Settings, Plus,
  Calendar, ShieldCheck, Activity, Users, Scan, Bot, Search, RefreshCw, Grid, List,
  Filter, ArrowUpDown, ChevronDown
} from 'lucide-react';

import BudgetDashboard from './BudgetDashboard';
import BudgetSetup from './BudgetSetup';
import ExpenseTracking from './ExpenseTracking';
import Analytics from './Analytics';
import SavingsGoals from './SavingsGoals';
import SubscriptionsTracker from './SubscriptionsTracker';
import StudentLoansTracker from './StudentLoansTracker';
import BudgetCalendar from './BudgetCalendar';
import FinancialReports from './FinancialReports';
import BudgetPlanner from './BudgetPlanner';
import BudgetOperations from './BudgetOperations';
import QuickAddExpenseModal from './QuickAddExpenseModal';

import StudentSnapshot from './components/StudentSnapshot';
import AccountsManager from './components/AccountsManager';
import CanIAffordThisModal from './components/CanIAffordThisModal';
import DebtAndLentManager from './components/DebtAndLentManager';
import ExpenseSplitter from './components/ExpenseSplitter';
import ReceiptScanner from './components/ReceiptScanner';
import SemesterAndProjectTracker from './components/SemesterAndProjectTracker';
import AIFinanceCoach from './components/AIFinanceCoach';

import { INITIAL_STUDENT_FINANCE_DATA } from './dataDefaults';
import { useStorage } from '../../hooks/useStorage';
import PageHeader from '../../components/PageHeader';

const BudgetHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCanIAffordOpen, setIsCanIAffordOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');

  const [budgetData, setBudgetData] = useStorage('budget_data', INITIAL_STUDENT_FINANCE_DATA);

  const effectiveBudgetData = useMemo(() => {
    if (!budgetData.accounts || budgetData.accounts.length === 0) {
      return {
        ...budgetData,
        accounts: INITIAL_STUDENT_FINANCE_DATA.accounts
      };
    }
    return budgetData;
  }, [budgetData]);

  const {
    currency = 'Rs.',
    totalBudget = 60000,
    expenses = [],
    incomes = [],
    savingsGoals = [],
    accounts = []
  } = effectiveBudgetData;

  const currentMonthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalIncome = incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const budgetRemaining = Math.max(0, totalBudget - totalSpent);
  const activeGoalsCount = savingsGoals.length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <StudentSnapshot
              budgetData={effectiveBudgetData}
              setBudgetData={setBudgetData}
              onOpenCanIAffordModal={() => setIsCanIAffordOpen(true)}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
            <BudgetDashboard budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />
          </div>
        );
      case 'accounts':
        return <AccountsManager budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'expenses':
        return <ExpenseTracking budgetData={effectiveBudgetData} setBudgetData={setBudgetData} globalSearchTerm={searchTerm} />;
      case 'analytics':
        return <Analytics budgetData={effectiveBudgetData} />;
      case 'savings':
        return <SavingsGoals budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'subscriptions':
        return <SubscriptionsTracker budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'debts':
        return <DebtAndLentManager budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'splitter':
        return <ExpenseSplitter budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'receipts':
        return <ReceiptScanner budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'academic':
        return <SemesterAndProjectTracker budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'calendar':
        return <BudgetCalendar budgetData={effectiveBudgetData} setBudgetData={setBudgetData} />;
      case 'reports':
        return <FinancialReports budgetData={budgetData} />;
      case 'aicoach':
        return <AIFinanceCoach budgetData={budgetData} />;
      case 'plan':
        return <BudgetPlanner budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'tools':
        return <BudgetOperations budgetData={budgetData} setBudgetData={setBudgetData} />;
      default:
        return <BudgetDashboard budgetData={budgetData} setBudgetData={setBudgetData} />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'expenses', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'savings', label: 'Goals' },
    { id: 'subscriptions', label: 'Subs' },
    { id: 'debts', label: 'Debts & Peer' },
    { id: 'splitter', label: 'Splitter' },
    { id: 'receipts', label: 'Receipt OCR' },
    { id: 'academic', label: 'Semester & Projects' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'reports', label: 'Reports' },
    { id: 'aicoach', label: 'AI Coach' },
    { id: 'plan', label: 'Plan' },
    { id: 'tools', label: 'Tools' }
  ];

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Student Finance Hub"
        description="Manage your budget, track expenses, and plan your financial goals"
        icon={<Wallet size={32} />}
        className="mb-8"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCanIAffordOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-sm border border-slate-700"
            >
              "Can I Afford This?"
            </button>
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all font-bold text-xs shadow-sm"
            >
              <Plus size={16} /> Quick Add
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs shadow-sm"
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        }
      />

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Balance', value: `${currency} ${totalBalance.toLocaleString()}`, icon: Wallet, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Monthly Budget', value: `${currency} ${totalBudget.toLocaleString()}`, icon: Landmark, tint: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Monthly Spent', value: `${currency} ${totalSpent.toLocaleString()}`, icon: TrendingDown, tint: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Budget Remaining', value: `${currency} ${budgetRemaining.toLocaleString()}`, icon: DollarSign, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Active Goals', value: activeGoalsCount, icon: PiggyBank, tint: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Search & Action Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions, accounts, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setBudgetData({ ...budgetData })}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* 4. Filters & View Controls */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md py-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Main Content Area */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <CanIAffordThisModal
        isOpen={isCanIAffordOpen}
        onClose={() => setIsCanIAffordOpen(false)}
        budgetData={effectiveBudgetData}
        setBudgetData={setBudgetData}
      />

      <QuickAddExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        budgetData={budgetData}
        setBudgetData={setBudgetData}
      />

      <AnimatePresence>
        {isSettingsOpen && (
          <BudgetSetup
            budgetData={budgetData}
            setBudgetData={setBudgetData}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetHub;
