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
        <div className="card p-8 bg-emerald-500 text-white border-none shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Send size={80} />
          </div>
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Deliverables</p>
            <h3 className="text-4xl font-black">{submissions.length}</h3>
            <p className="text-xs font-bold text-emerald-100/80">Project milestones reached</p>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-end">
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-slate-900 text-white font-black transition-all shadow-2xl hover:bg-black active:scale-95 group"
          >
            <Send size={24} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
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
            className="card p-10 bg-white dark:bg-slate-900 border-emerald-500/20 shadow-2xl space-y-8"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">Capture Milestone</h4>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmission} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deliverable Title</label>
                <input 
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm" 
                  placeholder="e.g. Phase 1: Prototype Documentation"
                  value={newSub.title}
                  onChange={e => setNewSub({...newSub, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Version</label>
                <input 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm" 
                  placeholder="1.0"
                  value={newSub.version}
                  onChange={e => setNewSub({...newSub, version: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Submission Date</label>
                <input 
                  type="date"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm" 
                  value={newSub.date}
                  onChange={e => setNewSub({...newSub, date: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                >
                  Finalize Record
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions List */}
      <div className="space-y-6">
        {submissions.length > 0 ? (
          submissions.map(sub => (
            <div key={sub.id} className="card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xl font-black text-slate-800 dark:text-white">{sub.title}</h4>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                      v{sub.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Calendar size={12} />
                      {new Date(sub.date).toLocaleDateString()}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <ShieldCheck size={12} />
                      Verified Record
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                  <Download size={14} />
                  Retrieve File
                </button>
                <button 
                  onClick={() => deleteSubmission(sub.id)}
                  className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-40 text-center space-y-6 opacity-30">
            <div className="w-24 h-24 rounded-[3rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Send size={40} className="text-slate-300" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-widest">No Deliverables Logged</p>
              <p className="text-xs font-medium">Capture your final project files and submission proofs here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSubmissions;
