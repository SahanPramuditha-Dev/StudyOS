import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare } from 'lucide-react';

const Support = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg shadow-md text-center"
    >
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Support Center</h1>
      
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
        We're here to help! If you have any questions, encounter issues, or need assistance with StudyOS, please reach out to us through one of the following methods.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm">
          <Mail size={48} className="text-primary-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Support</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            For general inquiries, technical support, or feedback.
          </p>
          <a href="mailto:support@studyos.com" className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">
            Email Us
          </a>
        </div>

        <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm">
          <MessageSquare size={48} className="text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Live Chat</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Get instant help from our support team during business hours.
          </p>
          <button className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
            Start Chat
          </button>
        </div>

        <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm">
          <Phone size={48} className="text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone Support</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Speak directly with a support agent for urgent matters.
          </p>
          <a href="tel:+1234567890" className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors">
            Call Us
          </a>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Frequently Asked Questions</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Before contacting support, please check our comprehensive FAQ section. You might find the answer to your question there!
        </p>
        <button className="mt-4 px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          Visit FAQ
        </button>
      </section>
    </motion.div>
  );
};

export default Support;
