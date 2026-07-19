import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, TrendingDown, Landmark } from 'lucide-react';

const FinancialReports = ({ budgetData }) => {
  const { totalBudget = 0, expenses = [], incomes = [], currency = '$' } = budgetData || {};
  
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = totalBudget - totalSpent;
  const netSavings = totalIncome - totalSpent;

  // Group expenses by category for the Top Categories widget
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reports</h2>
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
          <p className="text-3xl font-black text-slate-800 dark:text-white">{currency}{totalBudget.toFixed(2)}</p>
          <div className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 inline-block px-2 py-1 rounded-lg">
            +5% from last month
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-rose-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Expenses (YTD)</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{currency}{totalSpent.toFixed(2)}</p>
          <div className="mt-4 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 inline-block px-2 py-1 rounded-lg">
            +12% from last month
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Savings (YTD)</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{currency}{netSavings.toFixed(2)}</p>
          <div className="mt-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded-lg">
            Based on tracked income & expenses
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Trends</h3>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1 outline-none">
              <option>This Year</option>
              <option>Last 6 Months</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <div className="text-center">
               <TrendingUp size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
               <p className="text-slate-500 text-sm font-semibold">Interactive trend chart rendering...</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Top Categories</h3>
          <div className="flex-1 flex flex-col gap-5">
            {topCategories.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500 text-center py-8">No expenses yet.</p>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                    <span className="text-slate-800 dark:text-white">{currency}{cat.amount.toFixed(2)}</span>
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
          <button className="w-full mt-6 py-2 text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors">
            View All Categories →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
