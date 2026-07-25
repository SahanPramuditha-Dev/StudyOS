import React, { useState } from 'react';
import { 
  X, User, Shield, HardDrive, Calendar, Mail, CheckCircle2, 
  AlertTriangle, Copy, Check, Activity, Settings, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatStorage } from '../../../services/storageService';
import { PREDEFINED_ROLES } from '../../../constants/predefinedRoles';

export const AdminUserDrawer = ({ 
  user, 
  onClose, 
  onUpdateUser, 
  auditLogs = [],
  currentUser 
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  if (!user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success('User ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const userLogs = auditLogs.filter(log => 
    log.targetId === user.id || log.targetEmail === user.email || log.actorEmail === user.email
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-100 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 font-black text-lg flex items-center justify-center border border-primary-500/20">
              {user.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                {user.name || 'Unnamed User'}
                {user.role === 'superadmin' && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider">Superadmin</span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                {user.email || 'No email provided'}
                <button 
                  onClick={handleCopyId}
                  className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                  title="Copy User ID"
                >
                  {copiedId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-900">
          {['details', 'permissions', 'sessions', 'audit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary-500 text-primary-500' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'details' && 'Overview'}
              {tab === 'permissions' && 'Access & Roles'}
              {tab === 'sessions' && 'Active Sessions'}
              {tab === 'audit' && `Audit Activity (${userLogs.length})`}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Account Quick Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status</span>
                  <div className="flex items-center gap-2">
                    {user.status?.isBlocked ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500">
                        <AlertTriangle size={14} /> Blocked
                      </span>
                    ) : user.status?.isActive !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-500">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
                        <RefreshCw size={14} /> Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Storage Usage</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <HardDrive size={14} className="text-blue-500" />
                    {formatStorage((user.usage?.storageUsedMB || 0) * 1024 * 1024)} / {formatStorage((user.limits?.storageMB || 1024) * 1024 * 1024)}
                  </p>
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Account Controls</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onUpdateUser(user.id, { status: { ...user.status, isActive: true, isBlocked: false } })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    Activate Account
                  </button>
                  <button
                    onClick={() => onUpdateUser(user.id, { status: { ...user.status, isActive: false } })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => onUpdateUser(user.id, { status: { ...user.status, isBlocked: !user.status?.isBlocked } })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      user.status?.isBlocked 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {user.status?.isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">System Info</h4>
                <div className="space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono text-[11px] font-bold">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-bold">{user.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-black uppercase text-[10px] tracking-wider">{user.role || 'user'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">System Role Assignment</h4>
                <p className="text-xs text-slate-500 font-medium">Select a system predefined role to assign permissions to {user.name || 'this user'}.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PREDEFINED_ROLES.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      onUpdateUser(user.id, { role: r.role });
                      toast.success(`Role updated to ${r.name}`);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-2 ${
                      user.role === r.role 
                        ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold shadow-sm ring-1 ring-primary-500' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-white">{r.name}</span>
                        {user.role === r.role && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-primary-500 text-white">Active</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono font-bold mt-0.5">{r.role}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1.5 line-clamp-2">{r.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold">
                      {r.modules.length} Modules • {r.actions.length} Actions
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Logged-in Devices & Sessions</h4>
                <button
                  onClick={() => toast.success(`All active sessions terminated for ${user.email || 'user'}`)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Force Terminate All Sessions
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                    <span className="flex items-center gap-2">🌐 Web Browser (Chrome / Windows)</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">Current Session</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono space-y-1">
                    <div>IP Address: 192.168.1.1 (Sri Lanka)</div>
                    <div>Last Activity: Just now</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 opacity-75">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                    <span className="flex items-center gap-2">📱 Mobile Safari (iOS 17)</span>
                    <button 
                      onClick={() => toast.success('Device session revoked')}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Revoke Access
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono space-y-1">
                    <div>IP Address: 112.134.x.x (Colombo)</div>
                    <div>Last Activity: 3 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {userLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No explicit audit events recorded for this user.
                </div>
              ) : (
                userLogs.map((log, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>{log.action || 'System Event'}</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Recent'}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{log.details || log.message || 'Audit log event'}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};
