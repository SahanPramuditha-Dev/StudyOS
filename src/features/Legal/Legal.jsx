import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Scale, FileText, Mail, ArrowUpRight, MessageSquare } from 'lucide-react';

const Legal = () => {
  const cards = [
    {
      title: 'Privacy Policy',
      description: 'How StudyOS collects, stores, and protects your data across Firebase, GitHub, and Google integrations.',
      icon: Lock,
      to: '/legal/privacy',
      accent: 'blue'
    },
    {
      title: 'Terms of Service',
      description: 'Rules for using StudyOS, account responsibilities, acceptable use, and service limitations.',
      icon: Scale,
      to: '/legal/terms',
      accent: 'purple'
    },
    {
      title: 'Support',
      description: 'Contact details and help options for account, product, and integration questions.',
      icon: MessageSquare,
      to: '/legal/support',
      accent: 'emerald'
    }
  ];

  const accentClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
          <Shield size={30} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white">Legal & Compliance</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
          Policies and support resources for StudyOS. These pages describe how your account, data, and integrations are handled.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentClasses[card.accent]}`}>
                <Icon size={24} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{card.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{card.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-primary-500 group-hover:text-primary-600">
                <span>Open page</span>
                <ArrowUpRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">At a glance</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Short summary of what these pages cover.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Privacy</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Covers Firebase Auth, GitHub sign-in, Google Calendar, storage, cookies, retention, and user rights.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Terms</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Explains acceptable use, account responsibility, third-party integrations, and service limitations.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Support</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Gives you the support email and help entry points if you need help with StudyOS.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Mail size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Need help?</h2>
            <p className="text-slate-300 text-sm">Use the support page or email us directly.</p>
          </div>
        </div>
        <a
          href="mailto:sahan.dev.tech@gmail.com"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors"
        >
          Email support
          <ArrowUpRight size={16} />
        </a>
      </section>
    </div>
  );
};

export default Legal;
