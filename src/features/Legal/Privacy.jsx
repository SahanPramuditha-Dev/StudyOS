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
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Privacy Policy</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">1. Introduction</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Welcome to StudyOS. We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">2. Information We Collect</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
          We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application, or otherwise when you contact us.
        </p>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed">
          <li><strong>Personal Data:</strong> Email address, name, user ID, and any other information you choose to provide in your profile.</li>
          <li><strong>Usage Data:</strong> Information about how you use the application, such as features accessed, time spent, and interactions.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, operating system, and device information.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">3. How We Use Your Information</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We use the information we collect for various purposes, including:
        </p>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed">
          <li>To provide and maintain our application.</li>
          <li>To manage your account and provide customer support.</li>
          <li>To personalize your experience and deliver relevant content.</li>
          <li>To monitor the usage of our application and improve its functionality.</li>
          <li>To detect, prevent, and address technical issues.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">4. Disclosure of Your Information</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </p>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed">
          <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
          <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">5. Security of Your Information</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">6. Your Privacy Rights</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          You have certain rights regarding your personal information, including:
        </p>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed">
          <li>The right to access, update, or delete the information we have on you.</li>
          <li>The right to object to our processing of your personal information.</li>
          <li>The right to request that we restrict the processing of your personal information.</li>
          <li>The right to data portability.</li>
          <li>The right to withdraw consent at any time where StudyOS relied on your consent to process your personal information.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">7. Contact Us</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          If you have questions or comments about this Privacy Policy, please contact us at:
        </p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
          Email: <a href="mailto:support@studyos.com" className="text-primary-600 hover:underline">support@studyos.com</a>
        </p>
      </section>
    </motion.div>
  );
};

export default Privacy;
