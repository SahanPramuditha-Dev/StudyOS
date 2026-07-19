import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, DollarSign, TrendingDown, PiggyBank, CreditCard, Landmark, Settings, Plus } from 'lucide-react';
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
import { useStorage } from '../../hooks/useStorage';
import PageHeader from '../../components/PageHeader';

const BudgetHub = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [budgetData, setBudgetData] = useStorage('budget_data', { isSetupComplete: false, currency: '$' });

  // Create each active monthly recurring item once its scheduled day arrives.
  useEffect(() => {
    const recurringItems = budgetData.recurringTransactions || [];
    if (!recurringItems.length) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const dueItems = recurringItems.filter((item) => item.active && now.getDate() >= item.dayOfMonth && item.lastProcessedMonth !== monthKey);
    if (!dueItems.length) return;

    const timestamp = now.toISOString();
    setBudgetData((previous) => ({
      ...previous,
      expenses: [...(previous.expenses || []), ...dueItems.filter((item) => item.type === 'expense').map((item) => ({
        id: crypto.randomUUID(), title: item.title, amount: item.amount, category: 'Bills', date: timestamp, recurringId: item.id,
      }))],
      incomes: [...(previous.incomes || []), ...dueItems.filter((item) => item.type === 'income').map((item) => ({
        id: crypto.randomUUID(), title: item.title, amount: item.amount, category: 'Other', date: timestamp, recurringId: item.id,
      }))],
      recurringTransactions: recurringItems.map((item) => dueItems.some((due) => due.id === item.id) ? { ...item, lastProcessedMonth: monthKey } : item),
    }));
  }, [budgetData.recurringTransactions, setBudgetData]);

  // Keyboard shortcut for Quick Add Expense (Cmd+E or Ctrl+E)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsQuickAddOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!budgetData.isSetupComplete) {
    return <BudgetSetup budgetData={budgetData} setBudgetData={setBudgetData} isInitialSetup={true} />;
  }

  const { totalBudget = 0, expenses = [], currency = '$' } = budgetData;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = totalBudget - totalSpent;
  const progressPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <BudgetDashboard budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'expenses': return <ExpenseTracking budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'analytics': return <Analytics budgetData={budgetData} />;
      case 'savings': return <SavingsGoals budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'subscriptions': return <SubscriptionsTracker budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'loans': return <StudentLoansTracker budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'calendar': return <BudgetCalendar budgetData={budgetData} />;
      case 'reports': return <FinancialReports budgetData={budgetData} />;
      case 'plan': return <BudgetPlanner budgetData={budgetData} setBudgetData={setBudgetData} />;
      case 'tools': return <BudgetOperations budgetData={budgetData} setBudgetData={setBudgetData} />;
      default: return <BudgetDashboard budgetData={budgetData} setBudgetData={setBudgetData} />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'savings', label: 'Savings' },
    { id: 'subscriptions', label: 'Subs' },
    { id: 'loans', label: 'Loans' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'reports', label: 'Reports' },
    { id: 'plan', label: 'Plan' },
    { id: 'tools', label: 'Tools' }
  ];

  return (
    <div className="w-full max-w-[1680px] mx-auto">
      <PageHeader
        title="Finance Hub"
        description="Manage your budget, track expenses, and plan your financial goals"
        icon={<Wallet size={32} />}
        className="mb-8"
        action={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsQuickAddOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors font-bold text-sm shadow-sm"
              title="Shortcut: Cmd/Ctrl + E"
            >
              <Plus size={16} /> Quick Add
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm shadow-sm"
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Monthly Budget', value: `${currency}${totalBudget.toFixed(2)}`, icon: Landmark, tint: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
          { label: 'Monthly Spent', value: `${currency}${totalSpent.toFixed(2)}`, icon: TrendingDown, tint: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
          { label: 'Remaining', value: `${currency}${remaining.toFixed(2)}`, icon: DollarSign, tint: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Budget Used', value: `${progressPercent}%`, icon: CreditCard, tint: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
          { label: 'Active Goals', value: '0', icon: PiggyBank, tint: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative rounded-3xl border ${stat.border} bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-5 shadow-lg overflow-hidden group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg.replace('/10', '/5')} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.tint} shadow-inner`}>
                <stat.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsQuickAddOpen(true)}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center z-[90]"
      >
        <Plus size={24} />
      </motion.button>

      <AnimatePresence>
        {isSettingsOpen && (
          <BudgetSetup 
            budgetData={budgetData} 
            setBudgetData={setBudgetData} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}
      </AnimatePresence>
      
      <QuickAddExpenseModal 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        budgetData={budgetData}
        setBudgetData={setBudgetData}
      />
    </div>
  );
};

export default BudgetHub;
