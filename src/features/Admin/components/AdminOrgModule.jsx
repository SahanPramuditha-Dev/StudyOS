import React, { useState } from 'react';
import { 
  Building2, Users, HardDrive, Cpu, Plus, Search, Filter, 
  CheckCircle2, Globe, Shield, Edit3, Trash2, ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminOrgModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', domain: '', tier: 'Enterprise', maxUsers: 500 });

  const [organizations, setOrganizations] = useState([
    { id: 'org_001', name: 'University of Colombo', domain: 'stu.cmb.ac.lk', members: 1240, storageUsedGB: 184, aiTokensUsed: '4.2M', tier: 'University Enterprise', status: 'Active' },
    { id: 'org_002', name: 'Faculty of Science', domain: 'sci.cmb.ac.lk', members: 450, storageUsedGB: 62, aiTokensUsed: '1.8M', tier: 'Faculty License', status: 'Active' },
    { id: 'org_003', name: 'Royal College Study Club', domain: 'royalcollege.lk', members: 180, storageUsedGB: 14, aiTokensUsed: '450K', tier: 'School Tier', status: 'Active' }
  ]);

  const handleAddOrg = (e) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.domain) {
      toast.error('Please fill in Organization Name and Domain');
      return;
    }
    const created = {
      id: `org_${Date.now().toString().slice(-3)}`,
      name: newOrg.name,
      domain: newOrg.domain,
      members: 1,
      storageUsedGB: 0,
      aiTokensUsed: '0',
      tier: newOrg.tier,
      status: 'Active'
    };
    setOrganizations([created, ...organizations]);
    setShowAddOrgModal(false);
    setNewOrg({ name: '', domain: '', tier: 'Enterprise', maxUsers: 500 });
    toast.success(`Organization "${created.name}" created successfully!`);
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
              <Building2 size={24} />
            </div>
            Campus & Organization Management
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Multi-tenancy administration, domain auto-onboarding, and institutional pool quotas
          </p>
        </div>

        <button
          onClick={() => setShowAddOrgModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all self-start md:self-auto"
        >
          <Plus size={16} /> Add Organization
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Institutions</span>
          <div className="text-3xl font-black text-slate-800 dark:text-white">{organizations.length}</div>
          <div className="text-[11px] font-bold text-blue-500">Active Multi-Tenancy Tenants</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Members</span>
          <div className="text-3xl font-black text-slate-800 dark:text-white">
            {organizations.reduce((acc, o) => acc + o.members, 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-green-500">Auto-Linked via Domain Match</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pool Storage Consumed</span>
          <div className="text-3xl font-black text-slate-800 dark:text-white">
            {organizations.reduce((acc, o) => acc + o.storageUsedGB, 0)} GB
          </div>
          <div className="text-[11px] font-bold text-purple-500">Institutional Shared Pool</div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search organizations or email domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500/20 text-xs font-medium outline-none transition-all"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">{filteredOrgs.length} Organizations Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Domain Auto-Join Rule</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Storage Pool</th>
                <th className="px-6 py-4">AI Usage</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredOrgs.map(org => (
                <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Building2 size={16} className="text-blue-500" />
                      {org.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{org.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg">
                      @{org.domain}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{org.members} users</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{org.storageUsedGB} GB</td>
                  <td className="px-6 py-4 font-mono text-purple-500 font-bold">{org.aiTokensUsed} tokens</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {org.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toast.success(`Managing settings for ${org.name}`)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                      title="Organization Settings"
                    >
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Org Modal */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Building2 size={20} className="text-blue-500" /> Create New Organization
            </h3>

            <form onSubmit={handleAddOrg} className="space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Moratuwa"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Email Domain Auto-Join Rule</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. uom.lk"
                  value={newOrg.domain}
                  onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Subscription Tier</label>
                <select
                  value={newOrg.tier}
                  onChange={(e) => setNewOrg({ ...newOrg, tier: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="University Enterprise">University Enterprise</option>
                  <option value="Faculty License">Faculty License</option>
                  <option value="School Tier">School Tier</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
