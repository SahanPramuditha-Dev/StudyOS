import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, Sparkles, Award } from 'lucide-react';

const ReportExporter = ({ isOpen, onClose, stats, watchData }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple print helper using a temporary window or iframe to avoid modifying main document state
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>StudyOS - Learning Analytics Report</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1e293b; padding: 40px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 800; margin: 0; color: #4f46e5; }
            .subtitle { font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }
            .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 20px; rounded-radius: 12px; }
            .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .card-value { font-size: 28px; font-weight: 900; margin: 5px 0 0 0; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 top-10 md:top-20 max-w-2xl mx-auto bg-slate-900 border border-slate-800 text-white z-50 rounded-3xl overflow-hidden flex flex-col shadow-2xl max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <Award size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Weekly Study Report</h3>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Export Accountability Scorecard</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content (Printable area + Preview) */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div 
                ref={printRef}
                className="p-6 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-md space-y-6"
              >
                <div className="header flex justify-between items-center border-b pb-4">
                  <div>
                    <h1 className="title text-indigo-600 text-2xl font-black">StudyOS Report</h1>
                    <p className="subtitle text-[10px] text-slate-400 font-bold uppercase tracking-wider">Accountability Scorecard</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500">Date Generated</p>
                    <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4 border rounded-xl bg-slate-50">
                    <p className="card-title text-[9px] text-slate-400 font-bold uppercase">Productivity Index</p>
                    <p className="card-value text-3xl font-black text-indigo-600">{stats.productivityScore}/100</p>
                  </div>
                  <div className="card p-4 border rounded-xl bg-slate-50">
                    <p className="card-title text-[9px] text-slate-400 font-bold uppercase">Streak Momentum</p>
                    <p className="card-value text-3xl font-black text-orange-600">{stats.streak} Days</p>
                  </div>
                  <div className="card p-4 border rounded-xl bg-slate-50">
                    <p className="card-title text-[9px] text-slate-400 font-bold uppercase">Watch Time</p>
                    <p className="card-value text-3xl font-black text-slate-800">{stats.totalWatchTime} Mins</p>
                  </div>
                  <div className="card p-4 border rounded-xl bg-slate-50">
                    <p className="card-title text-[9px] text-slate-400 font-bold uppercase">Course Mastery</p>
                    <p className="card-value text-3xl font-black text-emerald-600">{stats.avgProgress}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide border-b pb-1">AI Coach Evaluation</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold italic bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    "Consistent performance this week. Take strategic breaks every 50 minutes of deep focus to maintain this retention velocity. Ready to scale next week."
                  </p>
                </div>

                <div className="footer text-center text-[10px] text-slate-400 border-t pt-4">
                  Generated via StudyOS Behavioral Insights Engine
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors text-sm font-bold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors text-sm font-bold flex items-center gap-2"
              >
                <Printer size={16} />
                Print / Save PDF
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReportExporter;
