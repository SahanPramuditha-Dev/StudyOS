import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingDown, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#06b6d4', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#3b82f6', '#64748b'];

const Analytics = ({ budgetData }) => {
  const { expenses = [], totalBudget = 0 } = budgetData || {};
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    // Sort descending and calculate percentages
    return Object.entries(grouped)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalSpent]);

  // Aggregate expenses by month for the last 6 months
  const monthlyData = useMemo(() => {
    const data = [];
    for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getFullYear() === d.getFullYear() && expDate.getMonth() === d.getMonth();
      }).reduce((sum, exp) => sum + exp.amount, 0);

      data.push({ month: monthName, amount: monthExpenses, isCurrentMonth: i === 0 });
    }
    return data;
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-slate-300 text-xs font-bold mb-1">{label || payload[0].name}</p>
          <p className="text-white font-black">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        
        {/* Spending Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col p-6">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spending Trends</h3>
              <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">6-Month Overview</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 outline-none">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col p-6">
          <div className="mb-4 shrink-0">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Distribution</h3>
             <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">By Category</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            {expensesByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <Info size={32} className="opacity-20 text-slate-500" />
                <p className="text-sm font-semibold text-slate-500">No category data available.<br/>Add expenses to see breakdown.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="amount"
                        stroke="none"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full mt-4 grid grid-cols-2 gap-x-2 gap-y-3 overflow-y-auto max-h-[120px] custom-scrollbar">
                  {expensesByCategory.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-bold text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                      <span className="font-bold text-slate-800 dark:text-white ml-auto">${cat.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-cyan-50 dark:bg-cyan-500/5 p-6 flex items-center gap-4 border-l-4 border-l-cyan-500">
          <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
             <BarChart3 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Top Spending Category</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {expensesByCategory.length > 0 
                ? `Most spent on ${expensesByCategory[0].name}` 
                : 'Add expenses.'}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
             <TrendingDown size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Recent Trend</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Spending projected slightly below average.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-tr from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-6 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              Nova AI
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Get personalized financial insights.</p>
          </div>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-ai-chat', {
                detail: { message: "Analyze my budget data and give me 3 actionable tips to save money this month." }
              }));
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            Ask Nova
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
