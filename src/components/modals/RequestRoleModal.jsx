import React, { useState } from 'react';
import { X, ShieldAlert, Send, CheckCircle2 } from 'lucide-react';
import { PREDEFINED_ROLES } from '../../constants/predefinedRoles';
import { FirestoreService } from '../../services/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const RequestRoleModal = ({ isOpen, onClose, defaultTargetRole = 'educator' }) => {
  const { user, profile } = useAuth();
  const [targetRole, setTargetRole] = useState(defaultTargetRole);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const selectableRoles = PREDEFINED_ROLES.filter(r => r.role !== 'superadmin' && r.role !== profile?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      return toast.error('Please provide a short reason for requesting this role');
    }

    try {
      setIsSubmitting(true);
      await FirestoreService.requestRoleUpgrade({
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name || profile?.name,
        currentRole: profile?.role || 'user',
        targetRole,
        reason: reason.trim()
      });
      setSubmitted(true);
      toast.success('Role upgrade request submitted successfully');
    } catch (e) {
      toast.error('Failed to submit access request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">Request Role Upgrade</h3>
              <p className="text-xs text-slate-400 font-medium">Submit an access request to platform administrators.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white">Request Submitted!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                An administrator will review your request to become a <strong>{PREDEFINED_ROLES.find(r => r.role === targetRole)?.name}</strong> shortly.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-xs uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectableRoles.map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setTargetRole(r.role)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      targetRole === r.role 
                        ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{r.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reason / Justification</label>
              <textarea
                rows={3}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-medium dark:text-white focus:border-primary-500 resize-none"
                placeholder="Briefly explain why you need this role (e.g. I need to create and manage courses for my class)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-primary-500/20"
              >
                {isSubmitting ? 'Submitting...' : <><Send size={14} /> Send Request</>}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
