import React, { useState } from 'react';
import { 
  Code, Webhook, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Terminal, GitCommit, Play, RefreshCw, Send, Copy, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminDevModule = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('user.signup');
  const [copiedKey, setCopiedKey] = useState(false);

  const [webhooks, setWebhooks] = useState([
    { id: 'wh_001', name: 'Discord Signup Alert Channel', url: 'https://discord.com/api/webhooks/1092837/xyz', event: 'user.signup', status: 'Active', lastTrigger: '12 mins ago' },
    { id: 'wh_002', name: 'Slack Security Breach Channel', url: 'https://hooks.slack.com/services/T00/B00/X00', event: 'security.alert', status: 'Active', lastTrigger: '3 days ago' }
  ]);

  const handleAddWebhook = (e) => {
    e.preventDefault();
    if (!webhookUrl) {
      toast.error('Please enter a valid webhook URL');
      return;
    }
    const created = {
      id: `wh_${Date.now().toString().slice(-3)}`,
      name: selectedEvent === 'user.signup' ? 'New User Signup Webhook' : 'Security Alert Webhook',
      url: webhookUrl,
      event: selectedEvent,
      status: 'Active',
      lastTrigger: 'Never'
    };
    setWebhooks([created, ...webhooks]);
    setWebhookUrl('');
    toast.success('Webhook endpoint registered!');
  };

  const handleTestWebhook = (name) => {
    toast.success(`Test payload dispatched to "${name}"`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500">
            <Code size={24} />
          </div>
          Developer Center & Webhook Diagnostics
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Manage outbound event webhooks, application version build manifests, and API integrations
        </p>
      </div>

      {/* Build Info Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frontend Build Version</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">v2.4.12-release</div>
          <div className="text-[11px] font-bold text-teal-500 flex items-center gap-1">
            <GitCommit size={14} /> Git Commit: 8f4a1bc
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Firebase Functions SDK</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">v12.4.0</div>
          <div className="text-[11px] font-bold text-green-500">Cloud Functions Operational</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Webhook Triggers</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white">{webhooks.length} Active</div>
          <div className="text-[11px] font-bold text-blue-500">Discord & Slack Listeners</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Register Webhook Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 self-start">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Webhook size={16} className="text-teal-500" /> Register Outbound Webhook
          </h3>

          <form onSubmit={handleAddWebhook} className="space-y-4 text-xs font-bold">
            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Target Trigger Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="user.signup">user.signup (New Account Created)</option>
                <option value="security.alert">security.alert (Failed Logins / Escalation)</option>
                <option value="storage.quota">storage.quota (Quota Exceeded Alert)</option>
                <option value="ai.error">ai.error (Orion API Request Failure)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Webhook Endpoint URL</label>
              <input
                type="url"
                required
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Register Endpoint
            </button>
          </form>
        </div>

        {/* Active Webhooks Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Webhook size={16} className="text-teal-500" /> Active Webhook Subscriptions
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {webhooks.length} Endpoints
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Webhook Target</th>
                  <th className="px-6 py-4">Trigger Event</th>
                  <th className="px-6 py-4">Last Dispatched</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {webhooks.map(wh => (
                  <tr key={wh.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{wh.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{wh.url}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-0.5 rounded-md">
                        {wh.event}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{wh.lastTrigger}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleTestWebhook(wh.name)}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-wider hover:bg-teal-500/20 transition-colors"
                      >
                        Test Payload
                      </button>
                      <button
                        onClick={() => setWebhooks(webhooks.filter(w => w.id !== wh.id))}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
