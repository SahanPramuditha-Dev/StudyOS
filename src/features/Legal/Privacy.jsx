import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Database, Globe, Cookie, Bell, Download, Mail, Sparkles } from 'lucide-react';

const Privacy = () => {
  const chips = [
    'Firebase Auth',
    'GitHub integration',
    'Google Calendar',
    'Local storage',
    'GDPR / CCPA aware'
  ];

  const sections = [
    {
      title: 'Information We Collect',
      icon: Database,
      accent: 'blue',
      content: (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Account Information</p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm leading-relaxed">
              <li>Name, email address, and profile photo from Firebase Auth or linked sign-in providers</li>
              <li>Optional profile details you add, such as university, degree, year, phone number, and bio</li>
              <li>Provider metadata such as whether you signed in with Google or GitHub</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Study and Project Data</p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm leading-relaxed">
              <li>Courses, notes, resources, reminders, tasks, projects, submissions, bugs, and snippets</li>
              <li>Progress, streaks, analytics snapshots, and workspace preferences</li>
              <li>Files or metadata you upload into the platform</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Integration Data</p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm leading-relaxed">
              <li>GitHub access token and repository metadata when you connect GitHub</li>
              <li>Google Calendar access token when you connect calendar sync</li>
              <li>Calendar events or tasks you import into StudyOS</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'How We Use It',
      icon: Sparkles,
      accent: 'purple',
      content: (
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 text-sm leading-relaxed">
          <li>To provide core StudyOS features such as projects, reminders, notes, and analytics</li>
          <li>To keep your account and workspace data synced across sessions and devices</li>
          <li>To connect optional integrations like GitHub and Google Calendar</li>
          <li>To personalize your workspace, permissions, and saved preferences</li>
          <li>To monitor app health, investigate bugs, and improve reliability</li>
          <li>To send account-related notifications, invitations, and support messages</li>
        </ul>
      )
    },
    {
      title: 'Sharing and Providers',
      icon: Globe,
      accent: 'emerald',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            We do not sell your personal data. We only share information with service providers that help us operate
            StudyOS or when required by law.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Primary Providers</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm">
                <li>Firebase</li>
                <li>GitHub</li>
                <li>Google APIs</li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Optional Services</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm">
                <li>Analytics</li>
                <li>Error monitoring</li>
                <li>Email delivery</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Storage and Retention',
      icon: Download,
      accent: 'amber',
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Where data is stored</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm">
                <li>Firebase-backed cloud storage</li>
                <li>Browser local storage for preferences and sync state</li>
                <li>Integration tokens used only for the features you enable</li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">How long data is kept</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm">
                <li>We keep your account data while your account remains active</li>
                <li>You can delete or reset most local data from Settings</li>
                <li>Account deletion removes your profile and associated cloud data subject to backups and legal retention requirements</li>
              </ul>
            </div>
          </div>
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
              <strong>Note:</strong> No online service is perfectly secure. Please use strong passwords, review third-party access,
              and disconnect integrations you no longer need.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Cookies and Rights',
      icon: Cookie,
      accent: 'sky',
      content: (
        <div className="space-y-5">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            StudyOS uses cookies and local storage for essential functionality such as authentication, theme settings,
            saved preferences, and sync state. Optional analytics cookies or event collection may be enabled only if
            you consent to those features.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Cookies & storage</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm">
                <li>Essential storage required for the app to function</li>
                <li>Optional analytics and monitoring only if enabled</li>
                <li>You can clear browser storage to remove local preferences</li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Your rights</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-sm">
                <li>Access and export your data from Settings</li>
                <li>Delete your account and associated content</li>
                <li>Disconnect GitHub or Google Calendar at any time</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const accentClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto pb-20 space-y-8"
    >
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-400 blur-3xl" />
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest">
            <Shield size={14} />
            Privacy Policy
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Clear privacy for a modern learning workspace.
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl">
              StudyOS keeps your account, project, and integration data organized with Firebase-backed storage,
              optional GitHub and Google connections, and local preferences you can control.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-slate-100"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-4xl">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Effective Date</p>
              <p className="text-sm font-bold mt-1">April 9, 2026</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Version</p>
              <p className="text-sm font-bold mt-1">3.0</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Coverage</p>
              <p className="text-sm font-bold mt-1">Firebase, GitHub, Google</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { label: 'What we collect', value: 'Account, study, integration, and technical data' },
          { label: 'How we use it', value: 'To power the workspace, sync integrations, and improve reliability' },
          { label: 'How you control it', value: 'Export, delete, disconnect integrations, and manage preferences' },
          { label: 'What we do not do', value: 'Sell personal data or use ad tracking' }
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentClasses[section.accent]}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{section.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    StudyOS-specific details and user controls
                  </p>
                </div>
              </div>
              {section.content}
            </motion.section>
          );
        })}
      </div>

      <section className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 border border-amber-200 dark:border-amber-800 rounded-[2rem] p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Bell size={22} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Need help with privacy?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Email <a href="mailto:sahan.dev.tech@gmail.com" className="font-bold text-primary-600 hover:underline">sahan.dev.tech@gmail.com</a>{' '}
              for privacy or support questions.
              We may update this policy occasionally, and the effective date above will change when we do.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Privacy;
