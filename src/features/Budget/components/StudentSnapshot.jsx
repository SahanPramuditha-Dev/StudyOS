import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, ShieldCheck, AlertTriangle, ArrowUpRight, TrendingDown, PiggyBank, Plus } from 'lucide-react';
import { roundCurrency } from '../utils';

const StudentSnapshot = ({ budgetData, setBudgetData, onOpenCanIAffordModal, onOpenQuickAdd }) => {
  const {
    accounts = [],
    bills = [],
    savingsGoals = [],
    expenses = [],
    currency = 'Rs.'
  } = budgetData;

  // 1. Total Current Balance across accounts (or net cashflow fallback if accounts balance is 0)
  const calculatedAccountBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalIncomeSum = budgetData.incomes?.reduce((acc, i) => acc + (i.amount || 0), 0) || 0;
  const totalExpensesSum = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netCashflowFallback = Math.max(0, totalIncomeSum - totalExpensesSum);
  const totalBalance = roundCurrency(calculatedAccountBalance > 0 ? calculatedAccountBalance : (netCashflowFallback > 0 ? netCashflowFallback : 45000));

  // 2. Days remaining in current month
  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // 3. Subtract upcoming bills & planned savings
  const upcomingBillsTotal = roundCurrency(bills
    .filter(b => b.status === 'upcoming')
    .reduce((acc, b) => acc + (b.amount || 0), 0));

  const plannedSavingsTotal = roundCurrency(savingsGoals
    .reduce((acc, g) => acc + (g.monthlyRequired || 0), 0));

  const safeSpendingTotal = Math.max(0, roundCurrency(totalBalance - upcomingBillsTotal - plannedSavingsTotal));
  const safeDailySpending = Math.round(safeSpendingTotal / daysRemaining);

  // 4. Today's spending allowance calculation
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todaySpent = roundCurrency(expenses
    .filter(e => new Date(e.date).getTime() >= todayStart)
    .reduce((acc, e) => acc + (e.amount || 0), 0));

  const todayAllowance = safeDailySpending > 0 ? safeDailySpending : 1250;
  const todayRemaining = roundCurrency(todayAllowance - todaySpent);
  const isOverspent = todayRemaining < 0;

  // 5. Calculate Student Financial Health Score (0 - 100)
  const healthScore = useMemo(() => {
    let score = 70; // Base score
    if (!isOverspent) score += 15;
    else score -= 15;

    if (totalBalance > upcomingBillsTotal) score += 10;
    else score -= 15;

    if (savingsGoals.length > 0) score += 5;
    return Math.min(100, Math.max(10, score));
  }, [isOverspent, totalBalance, upcomingBillsTotal, savingsGoals.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Primary Safe Daily Spending Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 relative rounded-3xl bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-slate-900/40 border border-cyan-500/20 backdrop-blur-xl p-6 shadow-xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <DollarSign size={140} className="text-cyan-500" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                Student Smart Formula
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                healthScore >= 80 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                healthScore >= 50 ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                'bg-rose-500/20 text-rose-500 border-rose-500/30'
              }`}>
                Health Score: {healthScore}/100 {healthScore >= 80 ? '🟢 Excellent' : healthScore >= 50 ? '🟡 Good' : '🔴 Warning'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">
              Safe Daily Spending
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCanIAffordModal}
              className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 border border-slate-700"
            >
              "Can I Afford This?"
            </button>
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus size={16} /> Quick Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Money</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {currency} {totalBalance.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Days Remaining</p>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-2">
              <Calendar size={20} /> {daysRemaining} days
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">Safe Daily Spending</p>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {currency} {safeDailySpending.toLocaleString()}/day
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <span>
            Formula: <span className="font-mono text-cyan-600 dark:text-cyan-400">Balance ({totalBalance.toLocaleString()}) − Upcoming Bills ({upcomingBillsTotal.toLocaleString()}) − Planned Savings ({plannedSavingsTotal.toLocaleString()})</span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            You can safely spend ~{currency} {Math.max(0, safeDailySpending).toLocaleString()}/day.
          </span>
        </div>
      </motion.div>

      {/* Today's Spending Limit Widget */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl border backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between ${
          isOverspent
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider opacity-80">
              Today's Spending Limit
            </span>
            {isOverspent ? (
              <AlertTriangle className="text-rose-500" size={20} />
            ) : (
              <ShieldCheck className="text-emerald-500" size={20} />
            )}
          </div>

          <p className="text-3xl font-black text-slate-900 dark:text-white mb-4">
            {currency} {todayAllowance.toLocaleString()}
          </p>

          <div className="space-y-2 mb-4 text-xs font-semibold">
            <div className="flex justify-between">
              <span>Spent Today:</span>
              <span className="font-bold">{currency} {todaySpent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Today:</span>
              <span className="font-bold">{currency} {Math.max(0, todayRemaining).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-2xl text-xs font-bold ${
          isOverspent ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
        }`}>
          {isOverspent
            ? `⚠️ You've exceeded today's recommended spending by ${currency} ${Math.abs(todayRemaining).toLocaleString()}.`
            : `You're within today's recommended spending limit.`}
        </div>

        {/* 1-Tap Quick Student Shortcuts */}
        <div className="mt-4 pt-3 border-t border-slate-200/20 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
          <span className="text-slate-400 uppercase text-[9px] tracking-wider">Quick Log:</span>
          <button onClick={onOpenQuickAdd} className="px-2.5 py-1 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800">
            🍔 Lunch
          </button>
          <button onClick={onOpenQuickAdd} className="px-2.5 py-1 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800">
            🚌 Bus Pass
          </button>
          <button onClick={onOpenQuickAdd} className="px-2.5 py-1 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800">
            🖨️ Printing
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentSnapshot;
