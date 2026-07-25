import React, { useState } from 'react';
import { 
  Zap, Play, Plus, CheckCircle2, XCircle, ArrowRight, Shield, 
  Mail, HardDrive, UserCheck, Clock, Sliders, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminAutomationModule = () => {
  const [rules, setRules] = useState([
    {
      id: 'rule_01',
      name: 'Educational Domain Onboarding',
      trigger: 'New User Signup',
      condition: 'Email ends with ".edu" or ".ac.lk"',
      action: 'Assign Student Role + Grant 5GB Storage + Send Welcome Email',
      enabled: true,
      executionsToday: 42
    },
    {
      id: 'rule_02',
      name: 'Storage Quota Threshold Warning',
      trigger: 'Storage Usage Event',
      condition: 'User storage usage > 90%',
      action: 'Dispatch Quota Warning Notification to User',
      enabled: true,
      executionsToday: 12
    },
    {
      id: 'rule_03',
      name: 'Inactive Account Re-engagement',
      trigger: 'Scheduled Cron Job',
      condition: 'Last active > 60 days',
      action: 'Move to Inactive Queue + Send Re-engagement Email',
      enabled: false,
      executionsToday: 0
    }
  ]);

  const toggleRule = (id) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        const nextState = !r.enabled;
        toast.success(`Automation rule "${r.name}" ${nextState ? 'enabled' : 'disabled'}`);
        return { ...r, enabled: nextState };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Zap size={24} />
            </div>
            IF / THEN Automation Rules Engine
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Configure event-driven workflow automations for onboarding, security triggers, and storage quotas
          </p>
        </div>

        <button
          onClick={() => toast.success('Rule builder wizard opened')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all self-start md:self-auto"
        >
          <Plus size={16} /> Create Automation Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map(rule => (
          <div 
            key={rule.id}
            className={`p-6 rounded-[2.5rem] border transition-all ${
              rule.enabled 
                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm' 
                : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-65'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    rule.enabled ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {rule.enabled ? 'Active Rule' : 'Disabled'}
                  </span>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">{rule.name}</h3>
                </div>

                {/* Workflow Diagram Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">IF Trigger</span>
                    <div className="font-bold text-indigo-500 flex items-center gap-1.5">
                      <Zap size={14} /> {rule.trigger}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">WHEN Condition</span>
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                      {rule.condition}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">THEN Action</span>
                    <div className="font-bold text-green-500 flex items-center gap-1.5">
                      <ArrowRight size={14} /> {rule.action}
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Status & Toggle */}
              <div className="flex items-center gap-6 self-end lg:self-center">
                <div className="text-right space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Today's Runs</span>
                  <span className="font-mono text-sm font-black text-slate-800 dark:text-white">{rule.executionsToday} triggers</span>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    rule.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    rule.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
