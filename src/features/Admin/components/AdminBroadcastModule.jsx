import React, { useState } from 'react';
import { 
  Megaphone, Send, Bell, CheckCircle2, AlertTriangle, Info, Clock, 
  Trash2, Filter, ShieldAlert, Sparkles, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminBroadcastModule = () => {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [urgency, setUrgency] = useState('info');
  const [audience, setAudience] = useState('all');

  const [activeBroadcasts, setActiveBroadcasts] = useState([
    { id: 'b_101', title: 'Scheduled Platform Maintenance', message: 'StudyOS will undergo database optimization tonight at 02:00 UTC for 30 minutes.', urgency: 'warning', audience: 'All Users', dispatched: '2 hours ago', status: 'Active' },
    { id: 'b_102', title: 'Orion AI v2.4 Release', message: 'Check out the new instant flashcard auto-generation feature in Review Hub!', urgency: 'info', audience: 'Learners', dispatched: '1 day ago', status: 'Active' }
  ]);

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast.error('Please fill in title and announcement message');
      return;
    }

    const created = {
      id: `b_${Date.now().toString().slice(-3)}`,
      title: broadcastTitle,
      message: broadcastMessage,
      urgency,
      audience: audience === 'all' ? 'All Users' : audience === 'students' ? 'Learners' : 'Admins',
      dispatched: 'Just now',
      status: 'Active'
    };

    setActiveBroadcasts([created, ...activeBroadcasts]);
    setBroadcastTitle('');
    setBroadcastMessage('');
    toast.success('System broadcast dispatched live to active users!');
  };

  const handleDeactivate = (id) => {
    setActiveBroadcasts(activeBroadcasts.filter(b => b.id !== id));
    toast.success('Broadcast banner deactivated');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <Megaphone size={24} />
          </div>
          Broadcast & Announcement Center
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Launch system-wide alert banners, maintenance notices, and targeted audience broadcasts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dispatch Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 self-start">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Send size={16} className="text-amber-500" /> Dispatch New Announcement
          </h3>

          <form onSubmit={handleDispatch} className="space-y-4 text-xs font-bold">
            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Announcement Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled System Maintenance"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="all">All Platform Users</option>
                <option value="students">Learners / Students Only</option>
                <option value="admins">Admins & Staff Only</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="info">Info (Blue Banner)</option>
                <option value="warning">Warning / Maintenance (Amber Banner)</option>
                <option value="critical">Critical Emergency (Red Banner)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Banner Message</label>
              <textarea
                rows={4}
                required
                placeholder="Enter live announcement text displayed at top of student dashboard..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Send size={16} /> Dispatch Live Broadcast
            </button>
          </form>
        </div>

        {/* Active Broadcasts History */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Bell size={16} className="text-amber-500" /> Active System Broadcast Banners
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {activeBroadcasts.length} Active
            </span>
          </div>

          <div className="p-6 space-y-4 flex-1">
            {activeBroadcasts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No active broadcast banners currently running.
              </div>
            ) : (
              activeBroadcasts.map(b => (
                <div 
                  key={b.id} 
                  className={`p-5 rounded-2xl border space-y-3 transition-all ${
                    b.urgency === 'critical'
                      ? 'bg-red-500/5 border-red-500/20'
                      : b.urgency === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {b.urgency === 'critical' ? (
                        <ShieldAlert size={18} className="text-red-500" />
                      ) : b.urgency === 'warning' ? (
                        <AlertTriangle size={18} className="text-amber-500" />
                      ) : (
                        <Info size={18} className="text-blue-500" />
                      )}
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">{b.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-md">
                        {b.audience}
                      </span>
                      <button
                        onClick={() => handleDeactivate(b.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Deactivate Banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{b.message}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1">
                    <span>Dispatched: {b.dispatched}</span>
                    <span className="text-green-500 flex items-center gap-1 font-black">
                      <CheckCircle2 size={12} /> Live Banner Active
                    </span>
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
