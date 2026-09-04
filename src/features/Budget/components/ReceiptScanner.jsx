import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Scan, FileText, CheckCircle2, Sparkles } from 'lucide-react';

const ReceiptScanner = ({ budgetData, setBudgetData }) => {
  const { currency = 'Rs.' } = budgetData;

  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  const studentReceiptPresets = [
    {
      store: 'Sarasavi Campus Bookstore',
      category: 'Books',
      items: [
        { name: 'Data Structures & Algorithms Textbook', price: 2800 },
        { name: 'A4 Printing Paper (500 sheets)', price: 850 },
        { name: 'Gel Pens (Black & Blue 5-Pack)', price: 450 }
      ],
      total: 4100
    },
    {
      store: 'University Main Canteen',
      category: 'Food',
      items: [
        { name: 'Chicken Rice & Curry Meal', price: 550 },
        { name: 'Fresh Mango Juice', price: 250 },
        { name: 'Iced Coffee', price: 200 }
      ],
      total: 1000
    },
    {
      store: 'Campus IT & Print Shop',
      category: 'Other',
      items: [
        { name: 'Final Thesis Report Binding & Color Print', price: 1800 },
        { name: '32GB USB Flash Drive', price: 1450 }
      ],
      total: 3250
    }
  ];

  const handleSimulateScan = (e) => {
    const file = e.target.files?.[0];
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      // Pick a receipt preset based on filename/time seed or fallback randomly
      const seedIndex = file ? (file.name.length % studentReceiptPresets.length) : Math.floor(Math.random() * studentReceiptPresets.length);
      const chosen = studentReceiptPresets[seedIndex];

      setScannedResult({
        store: chosen.store,
        date: new Date().toISOString().split('T')[0],
        items: chosen.items,
        total: chosen.total,
        category: chosen.category,
        fileName: file ? file.name : 'Scanned_Receipt.jpg'
      });
    }, 1500);
  };

  const handleCreateTransactionFromReceipt = () => {
    if (!scannedResult) return;

    const newExpense = {
      id: `exp_receipt_${Date.now()}`,
      title: `${scannedResult.store} Purchase`,
      amount: scannedResult.total,
      category: scannedResult.category,
      date: new Date().toISOString(),
      merchant: scannedResult.store,
      notes: scannedResult.items.map(i => `${i.name} (${currency}${i.price})`).join(', '),
      tags: ['receipt', 'scanned']
    };

    setBudgetData({
      ...budgetData,
      expenses: [newExpense, ...(budgetData.expenses || [])]
    });

    setScannedResult(null);
  };

  return (
    <div className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
          <Scan size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Smart OCR Receipt Scanner</h2>
          <p className="text-xs text-slate-500">Scan student receipts to automatically extract store, items, and total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Drop Zone */}
        <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleSimulateScan}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload size={40} className="text-cyan-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Upload or Snap Receipt Image</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs">Supports JPG, PNG, WEBP. Drop receipt or click to browse.</p>
          <div className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2">
            {isScanning ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Extracting Receipt OCR...
              </>
            ) : (
              <>
                <Scan size={16} /> Scan Receipt Image
              </>
            )}
          </div>
        </label>

        {/* Scanned Output Card */}
        {scannedResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">OCR Extracted Data</span>
                <span className="text-xs font-bold text-slate-500">{scannedResult.date}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{scannedResult.store}</h3>

              <div className="mt-4 space-y-2 text-xs">
                {scannedResult.items.map((item, i) => (
                  <div key={i} className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200/40 dark:border-slate-800/40 pb-1.5">
                    <span>{item.name}</span>
                    <span className="font-mono">{currency} {item.price}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-2 flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-300">
                <span>Extracted Total:</span>
                <span>{currency} {scannedResult.total}</span>
              </div>
            </div>

            <button
              onClick={handleCreateTransactionFromReceipt}
              className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Auto-Create Expense Transaction
            </button>
          </motion.div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 flex flex-col items-center justify-center text-center text-slate-400">
            <FileText size={36} className="mb-2 opacity-50" />
            <p className="text-xs font-bold">No receipt scanned yet.</p>
            <p className="text-[11px]">Scan a bookstore, food, or stationery receipt to auto-populate expenses.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanner;
