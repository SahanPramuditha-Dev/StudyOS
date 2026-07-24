import React, { useState } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  Download, 
  ExternalLink, 
  History,
  FileCheck,
  Calendar,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  X,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../../../../components/EmptyState';

const ProjectSubmissions = ({ project, onUpdate }) => {
  const [submissions, setSubmissions] = useState(project.submissions || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ title: '', version: '1.0', date: new Date().toISOString().split('T')[0] });

  const handleAddSubmission = (e) => {
    e.preventDefault();
    if (!newSub.title.trim()) return;

    const submission = { 
      ...newSub, 
      id: Date.now().toString(),
      status: 'Finalized'
    };

    const updated = [submission, ...submissions];
    setSubmissions(updated);
    onUpdate({ submissions: updated });
    setIsAdding(false);
    setNewSub({ title: '', version: '1.0', date: new Date().toISOString().split('T')[0] });
    toast.success('Project deliverable archived');
  };

  const deleteSubmission = (id) => {
    const updated = submissions.filter(s => s.id !== id);
    setSubmissions(updated);
    onUpdate({ submissions: updated });
    toast.success('Record removed');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 bg-emerald-500 text-white border-none shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Send size={60} />
          </div>
          <div className="relative z-10 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Deliverables</p>
            <h3 className="text-3xl font-black">{submissions.length}</h3>
            <p className="text-[10px] font-bold text-emerald-100/80">Project milestones reached</p>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-end">
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 group"
          >
            <Send size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            Archive Submission
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">Capture Milestone</h4>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmission} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Deliverable Title</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 outline-none font-bold text-xs" 
                  placeholder="e.g. Phase 1: Prototype Documentation"
                  value={newSub.title}
                  onChange={e => setNewSub({...newSub, title: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Version</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 outline-none font-bold text-xs" 
                  placeholder="1.0"
                  value={newSub.version}
                  onChange={e => setNewSub({...newSub, version: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Submission Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-855 outline-none font-bold text-xs text-slate-700 dark:text-slate-200" 
                  value={newSub.date}
                  onChange={e => setNewSub({...newSub, date: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-md shadow-emerald-500/20"
                >
                  Finalize Record
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length > 0 ? (
          submissions.map(sub => (
            <div key={sub.id} className="glass rounded-3xl p-5 bg-white/55 dark:bg-slate-900/55 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:-translate-y-0.5 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{sub.title}</h4>
                    <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                      v{sub.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <Calendar size={10} />
                      {new Date(sub.date).toLocaleDateString()}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1 text-[8px] font-black text-emerald-555 uppercase tracking-widest">
                      <ShieldCheck size={10} />
                      Verified Record
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-805 text-slate-600 dark:text-slate-300 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200 dark:border-slate-800">
                  <Download size={12} />
                  Retrieve File
                </button>
                <button 
                  onClick={() => deleteSubmission(sub.id)}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState 
            compact
            icon={<Send size={32} />}
            title="No deliverables logged"
            description="Archive submission records, code deployments proofs or dashboard reports in this module."
          />
        )}
      </div>
    </div>
  );
};

export default ProjectSubmissions;
