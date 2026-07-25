import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Shield, Copy, Check, Info } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { PREDEFINED_ROLES, MODULE_KEYS, ACTION_KEYS } from '../../../constants/predefinedRoles';
import toast from 'react-hot-toast';

const RoleBuilder = ({ roles = [], onRoleUpdate }) => {
  const [draft, setDraft] = useState(null);

  const handleStartCreate = () => {
    setDraft({
      name: '',
      role: 'custom_' + Date.now(),
      description: '',
      modules: ['courses', 'videos', 'notes', 'resources'],
      actions: ['create', 'edit']
    });
  };

  const handleDuplicate = (tpl) => {
    setDraft({
      name: `Copy of ${tpl.name}`,
      role: `custom_${tpl.role}_${Date.now()}`,
      description: tpl.description || '',
      modules: [...(tpl.modules || [])],
      actions: [...(tpl.actions || [])]
    });
    toast.success(`Loaded "${tpl.name}" as template`);
  };

  const handleSave = async () => {
    if (!draft.name?.trim()) return toast.error('Role name is required');
    try {
      if (draft.id) {
        await FirestoreService.updateCustomRole(draft.id, draft);
        toast.success('Role updated successfully');
      } else {
        const newId = await FirestoreService.createCustomRole(draft);
        draft.id = newId;
        toast.success('Custom role created successfully');
      }
      if (onRoleUpdate) onRoleUpdate();
      setDraft(null);
    } catch (e) {
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom role?')) return;
    try {
      await FirestoreService.deleteCustomRole(id);
      toast.success('Role deleted successfully');
      if (onRoleUpdate) onRoleUpdate();
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
      <div className="card space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="text-primary-500" size={20} />
              {draft.id ? 'Edit Custom Role' : 'Create Custom Role'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Configure fine-grained module and action permissions.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setDraft(null)} 
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/20 transition-all"
            >
              Save Role
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Role Name</label>
              <input 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-bold dark:text-white focus:border-primary-500" 
                value={draft.name} 
                onChange={e => setDraft({...draft, name: e.target.value})} 
                placeholder="e.g. Content Facilitator"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Role Identifier Code</label>
              <input 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-mono font-bold dark:text-white opacity-70" 
                value={draft.role} 
                disabled
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</label>
            <input 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-medium dark:text-white focus:border-primary-500" 
              value={draft.description || ''} 
              onChange={e => setDraft({...draft, description: e.target.value})} 
              placeholder="Describe the scope and responsibilities of this role..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Module Access Grants</label>
            <div className="flex flex-wrap gap-2">
              {MODULE_KEYS.map(mod => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => toggleModule(mod)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    draft.modules.includes(mod) 
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-500/50'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Action Permissions</label>
            <div className="flex flex-wrap gap-2">
              {ACTION_KEYS.map(act => (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleAction(act)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    draft.actions.includes(act) 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-500/50'
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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="text-primary-500" size={22} />
            Role Builder & Access Architecture
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Manage system built-in predefined roles and configure custom dynamic roles for users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleStartCreate} 
            className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-primary-500/20 transition-all active:scale-95"
          >
            <Plus size={16} /> New Custom Role
          </button>
        </div>
      </div>

      {/* Section 1: Predefined System Roles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Predefined System Roles ({PREDEFINED_ROLES.length})
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Built-in System Defaults
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Pre-configured role blueprints available across StudyOS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREDEFINED_ROLES.map((sysRole) => (
            <div 
              key={sysRole.id} 
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      {sysRole.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      {sysRole.role}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${sysRole.badgeColor}`}>
                    System
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {sysRole.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-400">
                  {sysRole.modules?.length || 0} modules • {sysRole.actions?.length || 0} actions
                </div>
                <button 
                  onClick={() => handleDuplicate(sysRole)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-500 hover:text-white text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
                  title="Use as custom role template"
                >
                  <Copy size={12} /> Duplicate Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Custom Dynamic Roles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Custom Database Roles ({roles.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-start hover:border-primary-500/30 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-black text-slate-800 dark:text-white">{role.name}</p>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-primary-500/10 text-primary-500 border border-primary-500/20">
                    Custom
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">ID: {role.role}</p>
                {role.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{role.description}</p>
                )}
                <p className="text-xs font-bold text-slate-400 mt-2">
                  {role.modules?.length || 0} modules granted • {role.actions?.length || 0} actions permitted
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDraft(role)} 
                  className="p-2 text-slate-400 hover:text-primary-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                  title="Edit Role"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(role.id)} 
                  className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                  title="Delete Role"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Info className="mx-auto text-slate-400" size={24} />
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold">No custom database roles found yet.</p>
              <p className="text-slate-400 text-[11px]">
                Predefined system roles above handle standard access. Click "Duplicate Template" or "New Custom Role" to create specialized organization roles.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default RoleBuilder;
