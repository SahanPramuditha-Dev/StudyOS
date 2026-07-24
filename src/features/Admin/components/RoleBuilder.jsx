import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import toast from 'react-hot-toast';

const MODULE_KEYS = [
  'courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders', 'analytics', 'adminPanel', 'manageUsers', 'changePermissions'
];
const ACTION_KEYS = ['create', 'edit', 'delete', 'export'];

const RoleBuilder = ({ roles, onRoleUpdate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setDraft({
      name: '',
      role: 'custom_' + Date.now(),
      modules: [],
      actions: []
    });
  };

  const handleSave = async () => {
    if (!draft.name) return toast.error('Role name is required');
    try {
      if (draft.id) {
        await FirestoreService.updateCustomRole(draft.id, draft);
        toast.success('Role updated');
      } else {
        const newId = await FirestoreService.createCustomRole(draft);
        draft.id = newId;
        toast.success('Role created');
      }
      onRoleUpdate();
      setDraft(null);
      setIsCreating(false);
    } catch (e) {
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await FirestoreService.deleteCustomRole(id);
      toast.success('Role deleted');
      onRoleUpdate();
    } catch (e) {
      toast.error('Failed to delete role');
    }
  };

  const toggleModule = (mod) => {
    setDraft(prev => ({
      ...prev,
      modules: prev.modules.includes(mod) ? prev.modules.filter(m => m !== mod) : [...prev.modules, mod]
    }));
  };

  const toggleAction = (act) => {
    setDraft(prev => ({
      ...prev,
      actions: prev.actions.includes(act) ? prev.actions.filter(a => a !== act) : [...prev.actions, act]
    }));
  };

  if (draft) {
    return (
      <div className="card space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black">{draft.id ? 'Edit Role' : 'Create Custom Role'}</h2>
          <div className="flex gap-2">
            <button onClick={() => { setDraft(null); setIsCreating(false); }} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold">Save Role</button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Role Name</label>
            <input 
              className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none" 
              value={draft.name} 
              onChange={e => setDraft({...draft, name: e.target.value})} 
              placeholder="e.g. Content Manager"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Module Access</label>
            <div className="flex flex-wrap gap-2">
              {MODULE_KEYS.map(mod => (
                <button
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    draft.modules.includes(mod) ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Action Permissions</label>
            <div className="flex flex-wrap gap-2">
              {ACTION_KEYS.map(act => (
                <button
                  key={act}
                  onClick={() => toggleAction(act)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    draft.actions.includes(act) ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black">Role Builder</h2>
          <p className="text-sm text-slate-500">Manage dynamic custom roles.</p>
        </div>
        <button onClick={handleStartCreate} className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold flex items-center gap-2">
          <Plus size={16} /> New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-start">
            <div>
              <p className="font-black text-slate-800 dark:text-white">{role.name}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">ID: {role.role}</p>
              <p className="text-xs text-slate-500 mt-2">{role.modules?.length || 0} modules, {role.actions?.length || 0} actions</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDraft(role)} className="p-2 text-slate-400 hover:text-primary-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Edit3 size={16} />
              </button>
              <button onClick={() => handleDelete(role.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 text-sm">
            No custom roles found. Create one above.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleBuilder;
