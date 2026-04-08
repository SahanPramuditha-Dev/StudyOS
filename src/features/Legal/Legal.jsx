import React from 'react';
import { Shield, Lock, Scale, FileText } from 'lucide-react';

const Legal = () => {
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white">Legal & Compliance</h1>
        <p className="text-slate-500 font-medium">Standard industrial product boilerplate for StudyOs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Privacy Policy */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Privacy Policy</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            <p>Your privacy is paramount. StudyOs uses industry-standard encryption to protect your data.</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Data is stored securely on Google Cloud (Firebase).</li>
              <li>We do not sell your personal information.</li>
              <li>You have the right to delete your account and all associated data at any time via Settings.</li>
            </ul>
          </div>
        </section>

        {/* Terms of Service */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
            <Scale size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Terms of Service</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            <p>By using StudyOs, you agree to our usage guidelines.</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Users must not abuse the system's resources or bypass storage limits.</li>
              <li>StudyOs is provided "as is" without warranties of any kind.</li>
              <li>We reserve the right to restrict access to users who violate these terms.</li>
            </ul>
          </div>
        </section>
      </div>

      {/* GDPR/Cookie Notice */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold">GDPR & Cookie Compliance</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          StudyOs uses essential cookies only for authentication and session management. We do not use tracking cookies for advertising. For EU residents, we comply with GDPR regulations regarding data portability and the right to be forgotten.
        </p>
      </section>

      <div className="text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default Legal;
