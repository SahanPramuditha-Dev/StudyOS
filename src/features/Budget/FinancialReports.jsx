import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialReports = ({ budgetData }) => {
  const { totalBudget = 0, expenses = [], incomes = [], currency = 'Rs.' } = budgetData || {};
  const [timeframe, setTimeframe] = useState('This Year');
  
  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalIncome = incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netSavings = totalIncome - totalSpent;

  // Generate real monthly trend chart data from expenses
  const trendData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(m => ({ month: m, amount: 0 }));

    expenses.forEach(exp => {
      if (!exp.date) return;
      const d = new Date(exp.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].amount += (exp.amount || 0);
      }
    });

    if (timeframe === 'This Month') {
      const currentMonthIdx = new Date().getMonth();
      return [monthlyData[currentMonthIdx]];
    } else if (timeframe === 'Last 6 Months') {
      const currentMonthIdx = new Date().getMonth();
      const start = Math.max(0, currentMonthIdx - 5);
      return monthlyData.slice(start, currentMonthIdx + 1);
    }

    return monthlyData;
  }, [expenses, timeframe]);

  // Group expenses by category for the Top Categories widget
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category || 'Other'] = (acc[curr.category || 'Other'] || 0) + (curr.amount || 0);
    return acc;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, amount], index) => {
      const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
      const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      return { name, amount, color: colors[index % colors.length], percent };
    });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Title,Category,Amount,Date\n";
    
    incomes.forEach(inc => {
      csvContent += `Income,${inc.title},-,${inc.amount},${new Date(inc.date).toLocaleDateString()}\n`;
    });
    
    expenses.forEach(exp => {
      csvContent += `Expense,${exp.title},${exp.category},${exp.amount},${new Date(exp.date).toLocaleDateString()}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reports & Financial Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Generate, view, and export your financial summaries.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl transition-colors font-bold text-xs shadow-sm shadow-cyan-500/20"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={16} className="text-sky-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Budget (YTD)</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{currency} {totalBudget.toLocaleString()}</p>
          <div className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 inline-block px-2.5 py-1 rounded-lg">
            +5% from last month
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-rose-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Expenses (YTD)</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{currency} {totalSpent.toLocaleString()}</p>
          <div className="mt-4 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 inline-block px-2.5 py-1 rounded-lg">
            Based on logged expenses
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Savings (YTD)</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{currency} {netSavings.toLocaleString()}</p>
          <div className="mt-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-2.5 py-1 rounded-lg">
            Based on tracked income & expenses
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Trends</h3>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1 outline-none cursor-pointer"
            >
              <option>This Year</option>
              <option>Last 6 Months</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(val) => [`${currency} ${val.toLocaleString()}`, 'Expenses']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Top Categories</h3>
          <div className="flex-1 flex flex-col gap-5">
            {topCategories.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500 text-center py-8">No expenses logged yet.</p>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                    <span className="text-slate-800 dark:text-white">{currency} {cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percent}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={`h-full ${cat.color} rounded-full`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
