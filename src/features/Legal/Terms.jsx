import React from 'react';
import { motion } from 'framer-motion';

const Terms = () => {
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
      </div>

      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Terms of Service</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">1. Acceptance of Terms</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          By accessing or using StudyOS, you agree to these Terms of Service and our Privacy Policy. If you do not
          agree, you should not use the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">2. The Service</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          StudyOS provides learning and project management tools, including courses, notes, reminders, projects,
          analytics, optional integrations, and administrative controls for authorized users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">3. Accounts and Access</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          You are responsible for your account activity and for keeping your credentials and connected provider access
          secure. If you sign in with GitHub or connect Google Calendar, you are responsible for those third-party
          permissions as well.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">4. User Content</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          You retain ownership of the content you create or upload to StudyOS. You grant us the limited right to store,
          process, sync, and display that content only as needed to operate the Service and provide the features you use.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">5. Acceptable Use</h2>
        <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Abuse, disrupt, or reverse engineer the Service</li>
            <li>Attempt unauthorized access to user accounts, data, or infrastructure</li>
            <li>Upload harmful, unlawful, or malicious content</li>
            <li>Bypass quotas, rate limits, or security controls</li>
            <li>Use the Service in a way that violates applicable law or the rights of others</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">6. Integrations</h2>
        <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            StudyOS may connect to third-party services such as Firebase, GitHub, Google Calendar, email providers, and
            analytics tools. Those services are governed by their own terms and privacy practices.
          </p>
          <p>
            You can disconnect optional integrations at any time from the app settings.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">7. Availability and Changes</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We may update, add, remove, or suspend features at any time. We may also change these Terms from time to time,
          and the latest version will be posted on this page with an updated effective date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">8. Suspension and Termination</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We may suspend or terminate access to the Service if we believe you have violated these Terms, pose a risk to
          the Service or other users, or misuse the platform in a way that harms StudyOS or its users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">9. Disclaimers</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          The Service is provided on an “as is” and “as available” basis. We do not guarantee uninterrupted service,
          error-free operation, or that all features will be available in every environment.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">10. Limitation of Liability</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          To the maximum extent permitted by law, StudyOS and its operators are not liable for indirect, incidental,
          special, consequential, or punitive damages arising from your use of the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">11. Governing Law</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          These Terms are governed by the laws applicable in your jurisdiction unless a separate written agreement says
          otherwise.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">12. Contact</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Questions about these Terms can be sent to{' '}
          <a href="mailto:support@studyos.com" className="text-primary-600 hover:underline font-semibold">
            support@studyos.com
          </a>
          .
        </p>
      </section>
    </motion.div>
  );
};

export default Terms;
