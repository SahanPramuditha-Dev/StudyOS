import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, Users, PlugZap, Ban, FileWarning, Clock3, Mail } from 'lucide-react';

const Terms = () => {
  const chips = ['Account responsibility', 'Acceptable use', 'Integrations', 'Service changes', 'Liability'];

  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: ShieldCheck,
      accent: 'slate',
      content: (
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          By accessing or using StudyOS, you agree to these Terms of Service and our Privacy Policy. If you do not
          agree, you should not use the Service.
        </p>
      )
    },
    {
      title: 'The Service',
      icon: Users,
      accent: 'blue',
      content: (
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          StudyOS provides learning and project management tools, including courses, notes, reminders, projects,
          analytics, optional integrations, and administrative controls for authorized users.
        </p>
      )
    },
    {
      title: 'Accounts and Access',
      icon: LockIcon,
      accent: 'purple',
      content: (
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          You are responsible for your account activity and for keeping your credentials and connected provider access
          secure. If you sign in with GitHub or connect Google Calendar, you are responsible for those third-party
          permissions as well.
        </p>
      )
    },
    {
      title: 'User Content',
      icon: FileWarning,
      accent: 'emerald',
      content: (
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          You retain ownership of the content you create or upload to StudyOS. You grant us the limited right to store,
          process, sync, and display that content only as needed to operate the Service and provide the features you use.
        </p>
      )
    },
    {
      title: 'Acceptable Use',
      icon: Ban,
      accent: 'rose',
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            <li>Abuse, disrupt, or reverse engineer the Service</li>
            <li>Attempt unauthorized access to user accounts, data, or infrastructure</li>
            <li>Upload harmful, unlawful, or malicious content</li>
            <li>Bypass quotas, rate limits, or security controls</li>
            <li>Use the Service in a way that violates applicable law or the rights of others</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Integrations',
      icon: PlugZap,
      accent: 'amber',
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            StudyOS may connect to third-party services such as Firebase, GitHub, Google Calendar, email providers, and
            analytics tools. Those services are governed by their own terms and privacy practices.
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            You can disconnect optional integrations at any time from the app settings.
          </p>
        </div>
      )
    }
  ];

  const accentClasses = {
    slate: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
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
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-500 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500 blur-3xl" />
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest">
            <Scale size={14} />
            Terms of Service
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Clear rules for a powerful learning workspace.
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl">
              StudyOS is built for students and developers alike. These terms explain account responsibilities,
              acceptable use, integrations, and how the service may evolve over time.
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
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Audience</p>
              <p className="text-sm font-bold mt-1">Students and developers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'What this covers', value: 'Accounts, content, integrations, and acceptable use' },
          { label: 'What you control', value: 'Your content, your account settings, and optional integrations' },
          { label: 'What we can change', value: 'Features, limits, availability, and terms when needed' },
          { label: 'What we expect', value: 'Respect for the service, data, and other users' }
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
                    StudyOS-specific terms and usage expectations
                  </p>
                </div>
              </div>
              {section.content}
            </motion.section>
          );
        })}
      </div>

      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white p-6 md:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Clock3 size={22} className="text-cyan-300" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">Service updates and termination</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              We may update, suspend, or end features when needed. We may also suspend access if a user violates these
              terms or creates risk for StudyOS or other users.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Mail size={22} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Questions about these Terms?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Email <a href="mailto:sahan.dev.tech@gmail.com" className="font-bold text-primary-600 hover:underline">sahan.dev.tech@gmail.com</a>{' '}
              and we’ll help you out.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

function LockIcon(props) {
  return <ShieldCheck {...props} />;
}

export default Terms;
