import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, FolderKanban, BookOpen, Plus, DollarSign, Award, CheckCircle2, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import { roundCurrency } from '../utils';

const SemesterAndProjectTracker = ({ budgetData, setBudgetData }) => {
  const { semesterFinance = {}, projectBudgets = [], financialAid = [], currency = 'Rs.' } = budgetData;
  const [studyosProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);

  const [activeTab, setActiveTab] = useState('semester'); // 'semester' | 'projects'
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);

  // Custom Category Add State
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');

  // Editing state for category breakdown cards
  const [editingKey, setEditingKey] = useState(null);
  const [editingVal, setEditingVal] = useState('');

  const defaultBreakdown = { tuition: 120000, hostel: 35000, textbooks: 15000, labFees: 8000, transport: 7000 };
  const currentBreakdown = (semesterFinance.breakdown && Object.keys(semesterFinance.breakdown).length > 0)
    ? semesterFinance.breakdown
    : defaultBreakdown;

  const handleSaveCategoryAmount = (key) => {
    const parsed = parseFloat(editingVal);
    if (isNaN(parsed) || parsed < 0) return;

    const newBreakdown = {
      ...currentBreakdown,
      [key]: parsed
    };

    const newEstCost = Object.values(newBreakdown).reduce((acc, curr) => acc + curr, 0);

    setBudgetData({
      ...budgetData,
      semesterFinance: {
        ...semesterFinance,
        breakdown: newBreakdown,
        estimatedCost: newEstCost
      }
    });

    setEditingKey(null);
    setEditingVal('');
  };

  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    if (!newCatName || !newCatAmount) return;

    const catKey = newCatName.toLowerCase().replace(/\s+/g, '_');
    const parsedAmt = parseFloat(newCatAmount) || 0;

    const newBreakdown = {
      ...currentBreakdown,
      [catKey]: parsedAmt
    };

    const newEstCost = Object.values(newBreakdown).reduce((acc, curr) => acc + curr, 0);

    setBudgetData({
      ...budgetData,
      semesterFinance: {
        ...semesterFinance,
        breakdown: newBreakdown,
        estimatedCost: newEstCost
      }
    });

    setNewCatName('');
    setNewCatAmount('');
    setIsAddCategoryModalOpen(false);
  };

  const handleDeleteCategory = (key) => {
    const { [key]: deleted, ...newBreakdown } = currentBreakdown;
    const newEstCost = Object.values(newBreakdown).reduce((acc, curr) => acc + curr, 0);

    setBudgetData({
      ...budgetData,
      semesterFinance: {
        ...semesterFinance,
        breakdown: newBreakdown,
        estimatedCost: newEstCost
      }
    });
  };

  // Form states
  const [projectTitle, setProjectTitle] = useState('');
  const [projectBudgetAmt, setProjectBudgetAmt] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  // Financial Aid Form State
  const [isAidModalOpen, setIsAidModalOpen] = useState(false);
  const [aidName, setAidName] = useState('');
  const [aidAmount, setAidAmount] = useState('');

  const handleAddProjectBudget = (e) => {
    e.preventDefault();
    if (!projectTitle || !projectBudgetAmt) return;

    const newProj = {
      id: `proj_b_${Date.now()}`,
      title: projectTitle,
      budget: roundCurrency(parseFloat(projectBudgetAmt)),
      spent: 0,
      items: []
    };

    setBudgetData({
      ...budgetData,
      projectBudgets: [...projectBudgets, newProj]
    });

    setProjectTitle('');
    setProjectBudgetAmt('');
    setIsAddProjectModalOpen(false);
  };

  const handleLogSemesterCategoryExpense = (e) => {
    e.preventDefault();
    if (!selectedCategoryModal || !itemTitle || !itemAmount) return;

    const amt = parseFloat(itemAmount) || 0;
    const newExpense = {
      id: `exp_sem_${Date.now()}`,
      title: `${selectedCategoryModal.toUpperCase()}: ${itemTitle}`,
      amount: amt,
      category: 'Bills',
      date: new Date().toISOString().split('T')[0]
    };

    setBudgetData({
      ...budgetData,
      expenses: [newExpense, ...(budgetData.expenses || [])]
    });

    setItemTitle('');
    setItemAmount('');
    setSelectedCategoryModal(null);
  };

  const handleLogProjectItemExpense = (e) => {
    e.preventDefault();
    if (!selectedProjectModal || !itemTitle || !itemAmount) return;

    const amt = parseFloat(itemAmount) || 0;
    const updatedProjects = mergedProjectBudgets.map(p => {
      if (p.id === selectedProjectModal.id) {
        return {
          ...p,
          spent: roundCurrency(p.spent + amt),
          items: [...(p.items || []), { title: itemTitle, amount: amt, date: new Date().toISOString().split('T')[0] }]
        };
      }
      return p;
    });

    const newExpense = {
      id: `exp_proj_${Date.now()}`,
      title: `Project (${selectedProjectModal.title}): ${itemTitle}`,
      amount: amt,
      category: 'Other',
      date: new Date().toISOString().split('T')[0]
    };

    setBudgetData({
      ...budgetData,
      projectBudgets: updatedProjects,
      expenses: [newExpense, ...(budgetData.expenses || [])]
    });

    setItemTitle('');
    setItemAmount('');
    setSelectedProjectModal(null);
  };

  const handleAddFinancialAid = (e) => {
    e.preventDefault();
    if (!aidName || !aidAmount) return;

    const newAid = {
      id: `aid_${Date.now()}`,
      name: aidName,
      amount: parseFloat(aidAmount) || 0,
      type: 'Scholarship'
    };

    setBudgetData({
      ...budgetData,
      financialAid: [...financialAid, newAid],
      incomes: [
        { id: `inc_aid_${Date.now()}`, title: `Financial Aid: ${aidName}`, amount: parseFloat(aidAmount) || 0, category: 'Financial Aid', date: new Date().toISOString().split('T')[0] },
        ...(budgetData.incomes || [])
      ]
    });

    setAidName('');
    setAidAmount('');
    setIsAidModalOpen(false);
  };

  // Combine stored budget items with any projects from studyosProjects not yet in projectBudgets
  const mergedProjectBudgets = [
    ...projectBudgets,
    ...studyosProjects
      .filter(sp => !projectBudgets.some(pb => pb.title.toLowerCase() === sp.name.toLowerCase()))
      .map(sp => ({
        id: `sp_${sp.id}`,
        title: sp.name,
        budget: 25000,
        spent: 0,
        items: []
      }))
  ];

  const totalAidAmount = financialAid.reduce((acc, a) => acc + (a.amount || 0), 0);
  const estCost = semesterFinance.estimatedCost || 185000;
  const netOutOfPocket = Math.max(0, estCost - totalAidAmount);

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Academic Semester & Project Finance</h2>
          <p className="text-xs text-slate-500">Connect your budgets directly with StudyOS Academic Life & Projects</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('semester')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
              activeTab === 'semester' ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            Semester Planner
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
              activeTab === 'projects' ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            Project Expenses
          </button>
        </div>
      </div>

      {activeTab === 'semester' ? (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  {semesterFinance.academicYear || '2026'} • {semesterFinance.semesterName || 'Semester 1'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  University Semester Cost Planner
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">Net Out-of-Pocket</p>
                <p className="text-2xl font-black text-cyan-500">{currency} {netOutOfPocket.toLocaleString()}</p>
                {totalAidAmount > 0 && (
                  <p className="text-[11px] font-bold text-emerald-500 mt-0.5">
                    ({currency} {totalAidAmount.toLocaleString()} covered by Aid)
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget Breakdown</span>
              <button
                onClick={() => setIsAddCategoryModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1"
              >
                <Plus size={12} /> + Add Custom Category
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(currentBreakdown).map(([key, val]) => (
                <div key={key} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">{key}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => {
                            setEditingKey(key);
                            setEditingVal(val.toString());
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-500"
                          title="Edit Target Budget"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(key)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Delete Category"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {editingKey === key ? (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          type="number"
                          autoFocus
                          value={editingVal}
                          onChange={(e) => setEditingVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCategoryAmount(key);
                          }}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-cyan-500 text-xs font-bold text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleSaveCategoryAmount(key)}
                          className="p-1 rounded bg-cyan-500 text-white text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{currency} {val.toLocaleString()}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedCategoryModal(key)}
                    className="mt-3 w-full py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 hover:text-white transition-all text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Log Payment
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Aid & Scholarship Tracker Card */}
          <div className="p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="text-emerald-500" size={22} />
                <div>
                  <h4 className="text-base font-black text-slate-800 dark:text-white">Financial Aid & Scholarships</h4>
                  <p className="text-xs text-slate-500">Track grants, Mahapola bursaries, and academic scholarships</p>
                </div>
              </div>
              <button
                onClick={() => setIsAidModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1"
              >
                <Plus size={14} /> + Add Aid
              </button>
            </div>

            {financialAid.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-emerald-500/20 text-xs font-semibold text-slate-500">
                No financial aid or scholarships logged yet. Add your Mahapola, bursaries, or parent allowance to offset semester costs.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {financialAid.map((aid) => (
                  <div key={aid.id} className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">{aid.name}</p>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">{aid.type}</span>
                    </div>
                    <span className="font-black text-emerald-500 text-sm">{currency} {aid.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-slate-800 dark:text-white">Academic Project Expenses</h3>
            <button
              onClick={() => setIsAddProjectModalOpen(true)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Project Budget
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mergedProjectBudgets.map((proj) => {
              const remaining = proj.budget - proj.spent;
              const pct = proj.budget > 0 ? Math.round((proj.spent / proj.budget) * 100) : 0;
              return (
                <div key={proj.id} className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-cyan-500">Project Budget</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{proj.title}</h4>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500">
                      {pct}% used
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <p className="text-[10px] font-bold text-slate-400">Budget</p>
                      <p className="font-black text-slate-800 dark:text-white">{currency} {proj.budget.toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10">
                      <p className="text-[10px] font-bold text-rose-500">Spent</p>
                      <p className="font-black text-rose-500">{currency} {proj.spent.toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <p className="text-[10px] font-bold text-emerald-500">Remaining</p>
                      <p className="font-black text-emerald-500">{currency} {remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-500">Logged Project Items:</p>
                      <button
                        onClick={() => setSelectedProjectModal(proj)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1"
                      >
                        <Plus size={12} /> + Item Expense
                      </button>
                    </div>

                    {(!proj.items || proj.items.length === 0) ? (
                      <p className="text-[11px] text-slate-400 italic">No line items logged yet.</p>
                    ) : (
                      proj.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/40 dark:border-slate-800/40 pb-1">
                          <span>{item.title}</span>
                          <span className="font-mono">{currency} {item.amount.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Log Category Expense */}
      <AnimatePresence>
        {selectedCategoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white capitalize">Log Payment for {selectedCategoryModal}</h3>
              <form onSubmit={handleLogSemesterCategoryExpense} className="space-y-3">
                <input type="text" required placeholder="Payment title (e.g. Hostel Rent March)" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <input type="number" required placeholder={`Amount (${currency})`} value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSelectedCategoryModal(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-bold text-xs">Record Expense</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Log Project Item Expense */}
      <AnimatePresence>
        {selectedProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Add Item for {selectedProjectModal.title}</h3>
              <form onSubmit={handleLogProjectItemExpense} className="space-y-3">
                <input type="text" required placeholder="Item title (e.g. Arduino Board & Sensors)" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <input type="number" required placeholder={`Amount (${currency})`} value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSelectedProjectModal(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-bold text-xs">Add Item Expense</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Financial Aid */}
      <AnimatePresence>
        {isAidModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Add Financial Aid or Scholarship</h3>
              <form onSubmit={handleAddFinancialAid} className="space-y-3">
                <input type="text" required placeholder="Aid Name (e.g. Mahapola Scholarship)" value={aidName} onChange={(e) => setAidName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <input type="number" required placeholder={`Amount (${currency})`} value={aidAmount} onChange={(e) => setAidAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAidModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs">Save Financial Aid</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Custom Category */}
      <AnimatePresence>
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Add Custom Semester Cost Category</h3>
              <form onSubmit={handleAddCustomCategory} className="space-y-3">
                <input type="text" required placeholder="Category Name (e.g. Field Trips, Exam Fees)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <input type="number" required placeholder={`Target Budget (${currency})`} value={newCatAmount} onChange={(e) => setNewCatAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white" />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddCategoryModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-bold text-xs">Add Category</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SemesterAndProjectTracker;
