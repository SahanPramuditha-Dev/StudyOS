import React, { useMemo } from 'react';
import { Shield, Users, TrendingUp, Lock, BarChart2, CheckCircle2 } from 'lucide-react';
import { PREDEFINED_ROLES, MODULE_KEYS } from '../../../constants/predefinedRoles';

const ROLE_COLORS = {
  superadmin: { bar: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
  admin:      { bar: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',     dot: 'bg-blue-500' },
  educator:   { bar: 'bg-emerald-500',badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  team_lead:  { bar: 'bg-amber-500',  badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  user:       { bar: 'bg-primary-500',badge: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20', dot: 'bg-primary-500' },
  restricted: { bar: 'bg-slate-400',  badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
};

const FRIENDLY_MODULES = {
  courses:           'Courses',
  videos:            'Videos',
  notes:             'Notes',
  resources:         'Resources',
  projects:          'Projects',
  workspace:         'Workspace',
  reminders:         'Calendar',
  analytics:         'Analytics',
  adminPanel:        'Admin Panel',
  manageUsers:       'User Mgmt',
  changePermissions: 'Permissions',
};

export const RoleAnalyticsWidget = ({ users = [] }) => {
  // --- Derived data ---
  const roleCounts = useMemo(() => {
    const counts = {};
    PREDEFINED_ROLES.forEach(r => { counts[r.role] = 0; });
    counts['unknown'] = 0;
    users.forEach(u => {
      const role = u.role || 'user';
      if (counts[role] !== undefined) counts[role]++;
      else counts['unknown']++;
    });
    return counts;
  }, [users]);

  const total = users.length || 1;

  // Module coverage per role: count of roles that grant each module
  const moduleCoverage = useMemo(() => {
    return MODULE_KEYS.map(mod => {
      const grantedByRoles = PREDEFINED_ROLES.filter(r => r.modules.includes(mod));
      const usersWithAccess = users.filter(u => {
        const role = PREDEFINED_ROLES.find(r => r.role === (u.role || 'user'));
        return role?.modules.includes(mod);
      }).length;
      return { mod, grantedByRoles: grantedByRoles.length, usersWithAccess };
    }).sort((a, b) => b.usersWithAccess - a.usersWithAccess);
  }, [users]);

  const blockedUsers = users.filter(u => u.status?.isBlocked).length;
  const restrictedUsers = roleCounts['restricted'] || 0;
  const privilegedUsers = (roleCounts['superadmin'] || 0) + (roleCounts['admin'] || 0);
  const educatorCount = (roleCounts['educator'] || 0) + (roleCounts['team_lead'] || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Role Distribution & Permission Analytics
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live breakdown of user roles and feature access coverage across {total} users
            </p>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: total, icon: Users, color: 'text-primary-500', bg: 'bg-primary-500/10 border-primary-500/20' },
          { label: 'Privileged Accounts', value: privilegedUsers, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Educators & Leads', value: educatorCount, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Restricted / Guest', value: restrictedUsers, icon: Lock, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl border ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Role Distribution Bar Chart */}
        <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-500" />
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Users by Role</h4>
          </div>

          <div className="space-y-3.5">
            {PREDEFINED_ROLES.map(roleObj => {
              const count = roleCounts[roleObj.role] || 0;
              const pct = Math.round((count / total) * 100);
              const colors = ROLE_COLORS[roleObj.role] || ROLE_COLORS.user;
              return (
                <div key={roleObj.role} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{roleObj.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${colors.badge}`}>
                        {roleObj.role}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white w-8 text-right">{count}</span>
                      <span className="text-slate-400 font-bold w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stacked proportion visual */}
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Proportion Overview</p>
            <div className="flex h-5 w-full rounded-full overflow-hidden gap-px">
              {PREDEFINED_ROLES.map(roleObj => {
                const pct = Math.max(Math.round(((roleCounts[roleObj.role] || 0) / total) * 100), 0);
                const colors = ROLE_COLORS[roleObj.role] || ROLE_COLORS.user;
                if (pct === 0) return null;
                return (
                  <div
                    key={roleObj.role}
                    className={`h-full ${colors.bar} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                    title={`${roleObj.name}: ${pct}%`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {PREDEFINED_ROLES.map(roleObj => {
                const colors = ROLE_COLORS[roleObj.role] || ROLE_COLORS.user;
                return (
                  <div key={roleObj.role} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    {roleObj.name.split('/')[0].trim()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Module Permission Coverage Heatmap */}
        <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Module Access Coverage</h4>
          </div>

          <div className="space-y-2.5">
            {moduleCoverage.map(({ mod, usersWithAccess }) => {
              const pct = Math.round((usersWithAccess / total) * 100);
              const isHighAccess = pct >= 70;
              const isMidAccess = pct >= 40;
              const barColor = isHighAccess ? 'bg-emerald-500' : isMidAccess ? 'bg-amber-500' : 'bg-red-400';
              const textColor = isHighAccess ? 'text-emerald-600 dark:text-emerald-400' : isMidAccess ? 'text-amber-600 dark:text-amber-400' : 'text-red-500';
              return (
                <div key={mod} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {FRIENDLY_MODULES[mod] || mod}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-[11px] ${textColor}`}>{usersWithAccess} users</span>
                      <span className="text-slate-400 font-bold w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[
              { color: 'bg-emerald-500', label: '≥70% Access' },
              { color: 'bg-amber-500',   label: '40–69%' },
              { color: 'bg-red-400',     label: '<40% Access' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-blue-500" />
          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
            Permission Matrix — System Roles vs Modules
          </h4>
        </div>

        <table className="w-full min-w-[700px] text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">Module</th>
              {PREDEFINED_ROLES.map(r => (
                <th key={r.role} className="text-center py-2 px-2 text-[9px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  {r.name.split('/')[0].trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULE_KEYS.map((mod, idx) => (
              <tr key={mod} className={idx % 2 === 0 ? 'bg-slate-50/60 dark:bg-slate-800/20' : ''}>
                <td className="py-2 pr-4 font-bold text-slate-700 dark:text-slate-300">
                  {FRIENDLY_MODULES[mod] || mod}
                </td>
                {PREDEFINED_ROLES.map(roleObj => {
                  const granted = roleObj.modules.includes(mod);
                  return (
                    <td key={roleObj.role} className="text-center py-2 px-2">
                      {granted ? (
                        <span className="text-emerald-500 font-black text-base">✓</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 font-black">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
