import React from 'react';
import { motion } from 'framer-motion';

const Privacy = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg shadow-md"
    >
      <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span>Effective Date: April 9, 2026</span>
        <span>Version 3.0</span>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
          Updated for Firebase, GitHub, and Google integrations
        </span>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">1. Overview</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          StudyOS is a learning and project management platform. This Privacy Policy explains how we collect,
          use, store, and protect your information when you use the app, including account sign-in, projects,
          reminders, integrations, and analytics features.
        </p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
          By using StudyOS, you agree to the practices described below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">2. Information We Collect</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <li>Name, email address, and profile photo from Firebase Auth or linked sign-in providers</li>
              <li>Optional profile details you add, such as university, degree, year, phone number, and bio</li>
              <li>Provider metadata such as whether you signed in with Google or GitHub</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Study and Project Data</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <li>Courses, notes, resources, reminders, tasks, projects, submissions, bugs, and snippets</li>
              <li>Progress, streaks, analytics snapshots, and workspace preferences</li>
              <li>Files or metadata you upload into the platform</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Integration Data</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <li>GitHub access token and repository metadata when you connect GitHub</li>
              <li>Google Calendar access token when you connect calendar sync</li>
              <li>Calendar events or tasks you import into StudyOS</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Technical Information</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <li>Browser and device information, IP address, and basic log data</li>
              <li>Cookies, session state, and local browser storage used for preferences and sync state</li>
              <li>Diagnostic data and error reports if monitoring is enabled</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">3. How We Use Information</h2>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
          <li>To provide core StudyOS features such as projects, reminders, notes, and analytics</li>
          <li>To keep your account and workspace data synced across sessions and devices</li>
          <li>To connect optional integrations like GitHub and Google Calendar</li>
          <li>To personalize your workspace, permissions, and saved preferences</li>
          <li>To monitor app health, investigate bugs, and improve reliability</li>
          <li>To send account-related notifications, invitations, and support messages</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">4. Sharing and Service Providers</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          We do not sell your personal data. We only share information with service providers that help us operate
          StudyOS or when required by law.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Primary Providers</h3>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li><strong>Firebase:</strong> authentication, database, and app infrastructure</li>
              <li><strong>GitHub:</strong> optional OAuth sign-in and repository access</li>
              <li><strong>Google APIs:</strong> optional calendar and tasks sync</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Optional Services</h3>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li><strong>Analytics:</strong> if enabled, product analytics may collect usage events</li>
              <li><strong>Error monitoring:</strong> if enabled, crash data may be sent to our monitoring provider</li>
              <li><strong>Email delivery:</strong> account and support messages may be sent through an email service</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">5. Storage and Retention</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Where data is stored</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              <li>StudyOS account and workspace data are stored in Firebase-backed cloud storage</li>
              <li>Some preferences and tokens may also be stored locally in your browser</li>
              <li>GitHub and Google tokens are stored only to support the integrations you choose</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">How long data is kept</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              <li>We keep your account data while your account remains active</li>
              <li>You can delete or reset most local data from Settings</li>
              <li>Account deletion removes your StudyOS profile and associated cloud data, subject to backups and legal retention requirements</li>
            </ul>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <p className="text-slate-800 dark:text-slate-200 text-sm">
            <strong>Note:</strong> No online service is perfectly secure. Please use strong passwords, review third-party access,
            and disconnect integrations you no longer need.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">6. Cookies and Local Storage</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          StudyOS uses cookies and local storage for essential functionality such as authentication, theme settings,
          saved preferences, and sync state. Optional analytics cookies or event collection may be enabled only if
          you consent to those features.
        </p>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
          <li>Essential cookies and local storage are required for the app to function</li>
          <li>Optional analytics and monitoring are only used if enabled in the app configuration</li>
          <li>You can clear browser storage to remove local preferences on that device</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">7. Your Rights and Choices</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
            <li>Access and export your data from Settings</li>
            <li>Update your profile and privacy preferences</li>
            <li>Delete your account and associated content</li>
            <li>Disconnect GitHub or Google Calendar at any time</li>
          </ul>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
            <li>GDPR users may request data portability, correction, and deletion</li>
            <li>CCPA/CPRA users may request access or deletion of personal information</li>
            <li>You can opt out of non-essential analytics where supported</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">8. Children’s Privacy</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          StudyOS is intended for general productivity and learning use. If you are under the age required by your local
          law to consent to online services, please use the app only with appropriate permission from a parent, guardian,
          or school administrator.
        </p>
      </section>

      <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">9. Contact and Updates</h2>
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            Privacy questions: <a href="mailto:privacy@studyos.com" className="text-primary-600 hover:underline font-semibold">privacy@studyos.com</a>
          </p>
          <p>
            Support: <a href="mailto:support@studyos.com" className="text-primary-600 hover:underline font-semibold">support@studyos.com</a>
          </p>
          <p className="text-sm">
            We may update this policy from time to time. When we do, we will update the effective date above.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-800">
            StudyOS is independently developed and hosted with Firebase-backed infrastructure.
          </p>
        </div>
      </section>
    </motion.div>
  );
};

export default Privacy;
