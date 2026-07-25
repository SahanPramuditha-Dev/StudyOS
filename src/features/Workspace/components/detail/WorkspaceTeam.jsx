import React, { useState, useEffect } from 'react';
import { Users, Mail, UserPlus, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FirestoreService } from '../../../../services/firestore';
import Select from '../../../../components/ui/Select';

const WorkspaceTeam = ({ project }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [members, setMembers] = useState([
    { id: '1', email: 'owner@studyos.local', role: 'owner', status: 'active' }
  ]);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (project?.members) {
      setMembers(project.members);
    }
  }, [project]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    try {
      setIsInviting(true);
      await FirestoreService.inviteToWorkspace(project.id, inviteEmail, inviteRole);
      
      const newMember = {
        id: Math.random().toString(),
        email: inviteEmail,
        role: inviteRole,
        status: 'pending'
      };
      setMembers([...members, newMember]);
      setInviteEmail('');
      toast.success('Invitation sent successfully');
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = (memberId) => {
    setMembers(members.filter(m => m.id !== memberId));
    toast.success('Member removed');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-xl">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Workspace Team</h2>
          <p className="text-xs text-slate-400 font-semibold">Manage members and their roles for this workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-[10px] font-black text-slate-450 dark:text-white uppercase tracking-widest ml-1">Current Members</h3>
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="glass flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">{member.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary-500">{member.role}</span>
                      <span className={`text-[7px] px-1.5 py-0.5 rounded-md uppercase font-black ${
                        member.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <button onClick={() => handleRemove(member.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-450 dark:text-white uppercase tracking-widest ml-1">Invite Members</h3>
          <form onSubmit={handleInvite} className="glass bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-805 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="email" 
                  required
                  placeholder="colleague@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 focus:border-primary-500 outline-none text-xs font-semibold dark:text-white"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
              <select 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 focus:border-primary-500 outline-none text-xs font-black uppercase tracking-widest cursor-pointer text-slate-700 dark:text-slate-200"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member (Can edit)</option>
                <option value="team_lead">Workspace Lead (Full management)</option>
                <option value="educator">Educator / Mentor (Guide & Review)</option>
                <option value="admin">Workspace Admin (Settings & Roles)</option>
                <option value="viewer">Viewer (Read only)</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isInviting}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-600/10 active:scale-95"
            >
              {isInviting ? 'Sending...' : <><UserPlus size={14} /> Send Invitation</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTeam;
