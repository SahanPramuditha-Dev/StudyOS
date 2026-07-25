export const MODULE_KEYS = [
  'courses', 
  'videos', 
  'notes', 
  'resources', 
  'projects', 
  'workspace', 
  'reminders', 
  'analytics', 
  'adminPanel', 
  'manageUsers', 
  'changePermissions'
];

export const ACTION_KEYS = ['create', 'edit', 'delete', 'export'];

export const PREDEFINED_ROLES = [
  {
    id: 'tpl-superadmin',
    role: 'superadmin',
    name: 'Platform Owner',
    description: 'Full administrative authority over platform infrastructure, settings, users, audit logs, and system roles.',
    isSystem: true,
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    modules: [...MODULE_KEYS],
    actions: [...ACTION_KEYS]
  },
  {
    id: 'tpl-admin',
    role: 'admin',
    name: 'Platform Administrator',
    description: 'Manages user accounts, platform settings, support requests, audit logs, and content catalog.',
    isSystem: true,
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    modules: [...MODULE_KEYS],
    actions: [...ACTION_KEYS]
  },
  {
    id: 'tpl-educator',
    role: 'educator',
    name: 'Educator / Mentor',
    description: 'Creates study courses, publishes learning materials, tracks student progress, and manages collaborative workspaces.',
    isSystem: true,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders', 'analytics'],
    actions: ['create', 'edit', 'export']
  },
  {
    id: 'tpl-team_lead',
    role: 'team_lead',
    name: 'Workspace Lead',
    description: 'Coordinates group study teams, assigns project milestones, manages group notes, and oversees progress analytics.',
    isSystem: true,
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders', 'analytics'],
    actions: ['create', 'edit', 'delete', 'export']
  },
  {
    id: 'tpl-user',
    role: 'user',
    name: 'Student / Learner',
    description: 'Standard active student using StudyOS for study planning, note taking, video learning, and Orion AI tutoring.',
    isSystem: true,
    badgeColor: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
    modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders'],
    actions: ['create', 'edit', 'export']
  },
  {
    id: 'tpl-restricted',
    role: 'restricted',
    name: 'Auditor / Guest',
    description: 'Read-only observer with access to view assigned courses, notes, and study reports without editing rights.',
    isSystem: true,
    badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    modules: ['courses', 'videos', 'notes', 'resources', 'reminders'],
    actions: ['export']
  }
];

export const getPredefinedRoleByCode = (roleCode) => {
  return PREDEFINED_ROLES.find(r => r.role === roleCode) || PREDEFINED_ROLES.find(r => r.role === 'user');
};
