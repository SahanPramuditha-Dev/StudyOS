import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RequestRoleModal } from '../modals/RequestRoleModal';

export const PermissionGuard = ({ 
  module, 
  action, 
  children, 
  fallback, 
  showUpgradePrompt = true 
}) => {
  const { hasPermission, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const moduleGranted = module ? hasPermission(module) : true;
  const actionGranted = action && profile?.actions ? profile.actions.includes(action) : true;

  const hasAccess = moduleGranted && actionGranted;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-8 backdrop-blur-sm shadow-xl animate-in fade-in duration-300">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
        <Lock size={26} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black text-white capitalize">Access Restricted</h3>
        <p className="text-xs text-slate-400 font-medium">
          Your current role (<strong>{profile?.role || 'user'}</strong>) does not have access to the <span className="text-amber-400 font-bold">{module}</span> module {action ? `(${action} permission)` : ''}.
        </p>
      </div>

      {showUpgradePrompt && (
        <div className="pt-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
          >
            <ShieldAlert size={16} />
            Request Role Upgrade
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      <RequestRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTargetRole={module === 'courses' ? 'educator' : module === 'workspace' ? 'team_lead' : 'admin'}
      />
    </div>
  );
};

export default PermissionGuard;
