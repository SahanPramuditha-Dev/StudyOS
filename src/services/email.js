import emailjs from '@emailjs/browser';

/**
 * Email Service for StudyOs using EmailJS.
 * Configuration loaded from environment variables.
 */
class EmailService {
  // EmailJS Configuration from environment variables
  static SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  static TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  static PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  /**
   * Initialize EmailJS with public key
   */
  static init() {
    if (this.PUBLIC_KEY) {
      emailjs.init(this.PUBLIC_KEY);
      console.log('[EmailService] Initialized with EmailJS');
    } else {
      console.warn('[EmailService] EmailJS public key not found in environment variables');
    }
  }

  /**
   * Send an email using EmailJS
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   */
  static async sendEmail(to, subject, body) {
    // Check if EmailJS is configured
    if (!this.SERVICE_ID || !this.TEMPLATE_ID || !this.PUBLIC_KEY) {
      console.warn('[EmailService] EmailJS not configured. Missing environment variables.');
      console.log(`[EmailService] Would send email to ${to} with subject: ${subject}`);
      return { success: false, error: 'EmailJS not configured - missing environment variables' };
    }

    try {
      console.log(`[EmailService] Sending email to ${to}... Params:`, {
        email: to,
        subject: subject,
        message: body.substring(0, 50) + '...'
      });

      const templateParams = {
        email: to,
        to_email: to, // Provide both just in case
        subject: subject,
        message: body,
        category: 'General',
        priority: 'Medium',
        time: new Date().toLocaleTimeString()
      };

      const result = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams
      );

      console.log(`[EmailService] Email sent successfully to ${to}.`);
      return { success: true, result };
    } catch (error) {
      console.error(`[EmailService] Email failed to send:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper to send a study reminder email
   */
  static async sendReminderEmail(userEmail, reminder) {
    if (!userEmail) {
      console.warn('[EmailService] No user email provided for reminder.');
      return { success: false, error: 'No email' };
    }

    const subject = `Study Alert: ${reminder.category || 'Reminder'}`;
    const body = `
      Hello!

      This is a reminder from StudyOs:

      "${reminder.message}"

      Category: ${reminder.category || 'General'}
      Priority: ${reminder.priority || 'Medium'}
      Time: ${reminder.time}

      Happy studying!
      - The StudyOs Team
    `.trim();

    return await this.sendEmail(userEmail, subject, body);
  }

  /**
   * Check if EmailJS is properly configured
   */
  static isConfigured() {
    return !!(this.SERVICE_ID && this.TEMPLATE_ID && this.PUBLIC_KEY);
  }
}

// Initialize EmailJS if configured
EmailService.init();

export { EmailService };
