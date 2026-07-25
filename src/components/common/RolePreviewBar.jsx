import React, { useState, useEffect, useRef } from 'react';
import { Eye, Shield, X, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { PREDEFINED_ROLES } from '../../constants/predefinedRoles';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SIMULATED_ROLE_KEY = 'studyos_simulated_role';

export const useSimulatedRole = () => {
  const [simulatedRole, setSimulatedRoleState] = useState(() => {
    try {
      return localStorage.getItem(SIMULATED_ROLE_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setSimulatedRoleState(localStorage.getItem(SIMULATED_ROLE_KEY) || null);
      } catch {
        setSimulatedRoleState(null);
      }
    };

    window.addEventListener('studyos_simulated_role_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('studyos_simulated_role_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setSimulatedRole = (roleCode) => {
    try {
      if (roleCode) {
        localStorage.setItem(SIMULATED_ROLE_KEY, roleCode);
      } else {
        localStorage.removeItem(SIMULATED_ROLE_KEY);
      }
    } catch {}
    setSimulatedRoleState(roleCode);
    window.dispatchEvent(new Event('studyos_simulated_role_change'));
  };

  return [simulatedRole, setSimulatedRole];
};

export const RoleSimulationBanner = () => {
  const { profile } = useAuth();
  const [simulatedRole, setSimulatedRole] = useSimulatedRole();

  if (!simulatedRole || simulatedRole === profile?.role) return null;

  const roleObj = PREDEFINED_ROLES.find(r => r.role === simulatedRole) || PREDEFINED_ROLES[4];

  const handleReset = () => {
    setSimulatedRole(null);
    toast.success('Restored native profile role');
  };

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Eye size={16} className="text-amber-600 dark:text-amber-400 animate-pulse" />
        <span>
          Role Simulation Active: Previewing app as <strong className="font-extrabold text-amber-900 dark:text-amber-200">{roleObj.name}</strong>
        </span>
      </div>
      <button
        onClick={handleReset}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-bold border border-amber-500/40 transition-colors text-[11px]"
      >
        <RefreshCw size={12} />
        Reset to Native ({profile?.role || 'User'})
      </button>
    </div>
  );
};

export const NavbarRoleSelector = () => {
  const { profile, isAdmin } = useAuth();
  const [simulatedRole, setSimulatedRole] = useSimulatedRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const canSimulate = isAdmin || profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'educator';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!canSimulate) return null;

  const activeRoleCode = simulatedRole || profile?.role || 'user';
  const activeRoleObj = PREDEFINED_ROLES.find(r => r.role === activeRoleCode) || PREDEFINED_ROLES[4];
  const isSimulating = Boolean(simulatedRole && simulatedRole !== profile?.role);

  const handleSelectRole = (roleCode) => {
    if (roleCode === profile?.role) {
      setSimulatedRole(null);
      toast.success('Restored native profile role');
    } else {
      setSimulatedRole(roleCode);
      toast.success(`Previewing UI as "${PREDEFINED_ROLES.find(r => r.role === roleCode)?.name}"`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
          isSimulating
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="Switch UI Role Preview"
      >
        <Eye size={15} className={isSimulating ? 'text-amber-500 animate-pulse' : 'text-primary-500'} />
        <span className="hidden md:inline font-semibold">
          {isSimulating ? `Role: ${activeRoleObj.name.split('/')[0]}` : 'Role Simulator'}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-primary-500/10 text-primary-500">
                <Eye size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Role Simulator</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Preview UI as different permissions</p>
              </div>
            </div>
            {isSimulating && (
              <button
                onClick={() => {
                  setSimulatedRole(null);
                  toast.success('Reset simulator');
                  setIsOpen(false);
                }}
                className="p-1 rounded text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1 font-semibold"
                title="Reset simulation"
              >
                <RefreshCw size={12} /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
            {PREDEFINED_ROLES.map((r) => {
              const isSelected = activeRoleCode === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => handleSelectRole(r.role)}
                  className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold truncate text-[11px]">{r.name.split('/')[0]}</span>
                    {isSelected && <Check size={12} className="text-primary-500 shrink-0" />}
                  </div>
                  <span className="text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 mt-1">
                    {r.role}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Active: <strong className="text-primary-600 dark:text-primary-400">{activeRoleObj.name}</strong></span>
            <span>{activeRoleObj.modules.length} Modules</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const RolePreviewBar = NavbarRoleSelector;
