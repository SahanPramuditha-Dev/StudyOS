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
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Terms of Service</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">1. Acceptance of Terms</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          By accessing and using the StudyOS application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">2. Changes to Terms</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">3. User Accounts</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">4. Content</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">5. Termination</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">6. Governing Law</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">7. Contact Us</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
          Email: <a href="mailto:support@studyos.com" className="text-primary-600 hover:underline">support@studyos.com</a>
        </p>
      </section>
    </motion.div>
  );
};

export default Terms;
