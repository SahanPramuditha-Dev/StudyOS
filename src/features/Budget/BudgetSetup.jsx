import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Plus, Trash2, Download, Upload } from 'lucide-react';

const BudgetSetup = ({ budgetData, setBudgetData, onClose, isInitialSetup = false }) => {
  const [totalBudget, setTotalBudget] = useState(budgetData?.totalBudget || '');
  const [currency, setCurrency] = useState(budgetData?.currency || '$');
  
  const defaultCategories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'];
  const [categories, setCategories] = useState(budgetData?.categories || defaultCategories);
  const [newCat, setNewCat] = useState('');
  
  const fileInputRef = useRef(null);

  const currencies = [
    { symbol: '$', name: 'USD' },
    { symbol: '€', name: 'EUR' },
    { symbol: '£', name: 'GBP' },
    { symbol: '¥', name: 'JPY' },
    { symbol: '₹', name: 'INR' },
    { symbol: 'LKR', name: 'Sri Lankan Rupee' }
  ];

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat('');
    }
  };

  const handleRemoveCategory = (catToRemove) => {
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(budgetData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && importedData.isSetupComplete !== undefined) {
          setBudgetData(importedData);
          setTotalBudget(importedData.totalBudget || '');
          setCurrency(importedData.currency || '$');
          setCategories(importedData.categories || defaultCategories);
          alert('Backup imported successfully! Please close and reopen settings to see all changes.');
        } else {
          alert('Invalid backup file');
        }
      } catch (err) {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (totalBudget && !isNaN(totalBudget)) {
      setBudgetData({
        ...budgetData,
        totalBudget: parseFloat(totalBudget),
        currency,
        categories,
        isSetupComplete: true
      });
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Budget Settings</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configure your finance hub</p>
            </div>
          </div>
          {!isInitialSetup && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* Budget & Currency */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">General Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Monthly Budget Limit</label>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                >
                  {currencies.map(c => (
                    <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Custom Categories */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Categories</h3>
            
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="New Category Name"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!newCat.trim()}
                className="px-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                <Plus size={16} /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                  <button 
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <span className="text-xs font-bold text-slate-400 italic">No categories. Add some above.</span>
              )}
            </div>
          </div>

          {/* Data Management */}
          {!isInitialSetup && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Management</h3>
              <div className="flex gap-4">
                <button 
                  onClick={handleExportBackup}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Export Backup (.json)
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={16} /> Import Backup
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImportBackup} 
                  className="hidden" 
                />
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={handleSave}
            disabled={!totalBudget}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-cyan-500/20"
          >
            {isInitialSetup ? 'Complete Setup' : 'Save Settings'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetSetup;
