import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Shield, Activity, Settings, Layout, Command, ArrowRight, X, Sparkles, Server } from 'lucide-react';

export const AdminCommandPalette = ({ isOpen, onClose, users = [], onNavigate, onAction }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickNavLinks = [
    { id: 'overview', title: 'Go to Overview Dashboard', category: 'Navigation', icon: Layout },
    { id: 'ai', title: 'Go to Orion AI Telemetry & Prompts', category: 'Navigation', icon: Sparkles },
    { id: 'users', title: 'Go to User Directory', category: 'Navigation', icon: User },
    { id: 'requests', title: 'View Access Requests', category: 'Navigation', icon: Shield },
    { id: 'health', title: 'Check System Health & Integrations', category: 'Navigation', icon: Server },
    { id: 'audit', title: 'View Audit Logs', category: 'Navigation', icon: Activity }
  ];

  const matchedUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(query.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(query.toLowerCase())) ||
    (u.id && u.id.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  const matchedNav = quickNavLinks.filter(n =>
    n.title.toLowerCase().includes(query.toLowerCase()) ||
    n.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-20 px-4 transition-opacity">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <Search size={20} className="text-slate-400 ml-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search users by name/email, or jump to tab..."
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium"
          />
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-4">
          
          {/* Quick Nav Section */}
          {matchedNav.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Quick Navigation</div>
              <div className="space-y-1">
                {matchedNav.map(nav => (
                  <button
                    key={nav.id}
                    onClick={() => {
                      onNavigate(nav.id);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl flex items-center justify-between text-left hover:bg-primary-500/10 hover:text-primary-500 transition-colors group text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <nav.icon size={16} className="text-slate-400 group-hover:text-primary-500" />
                      <span>{nav.title}</span>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {query.trim().length > 0 && matchedUsers.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Matching Users</div>
              <div className="space-y-1">
                {matchedUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      if (onAction) onAction('inspectUser', user);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600 dark:text-slate-300">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{user.name || 'Unnamed User'}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{user.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {user.role || 'user'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim().length > 0 && matchedNav.length === 0 && matchedUsers.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No matching commands or users found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-6 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <div className="flex items-center gap-2">
            <Command size={12} />
            <span>StudyOS Admin Command Palette</span>
          </div>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
