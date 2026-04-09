import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Email Service for StudyOs using Firebase Cloud Functions (Secure Server-Side).
 */
class EmailService {
  /**
   * Send an email using a secure Cloud Function
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {string} category - Email category for tracking
   */
  static async sendEmail(to, subject, body, category = 'General') {
    try {
      console.log(`[EmailService] Calling Cloud Function to send email to ${to}...`);

      const sendEmailFn = httpsCallable(functions, 'sendEmail');
      const result = await sendEmailFn({
        to,
        subject,
        body,
        category
      });

      console.log(`[EmailService] Cloud Function response:`, result.data);
      return { success: true, result: result.data };
    } catch (error) {
      console.error(`[EmailService] Cloud Function failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper to send a study reminder email
   */
  static async sendReminderEmail(userEmail, reminder) {
    if (!userEmail) return { success: false, error: 'No email' };

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

    return await this.sendEmail(userEmail, subject, body, 'Reminder');
  }

  /**
   * Send a role/permission change notification
   */
  static async sendRoleChangeNotification(userEmail, userName, newRole, changes) {
    if (!userEmail) return { success: false, error: 'No email' };

    const effectiveDate = new Date().toLocaleString();
    const grantedFeatures = changes.granted?.length > 0 
      ? changes.granted.map(f => `- ${f}`).join('\n') 
      : 'No additional features granted.';
    
    const restrictions = changes.restricted?.length > 0 
      ? changes.restricted.map(r => `- ${r}`).join('\n') 
      : 'No major restrictions apply.';

    const subject = `StudyOs Account Update: New Role Assigned`;
    const body = `
      Hello ${userName},

      Your account role has been updated.

      ---
      (1) Role Change Confirmation
      New Role: ${newRole.toUpperCase()}
      Effective Date: ${effectiveDate}

      (2) Newly Granted Features & Capabilities
      ${grantedFeatures}

      (3) Remaining Limitations & Restrictions
      ${restrictions}

      (4) Security Best Practices Reminder
      - Use a strong, unique password.
      - Never share your account credentials.
      - Regularly review your account activity.
      - Ensure your device is secure.

      (5) Support Information
      If you have any questions regarding this change, please contact us at sahan.dev.tech@gmail.com.
      ---

      Note: This email is sent in accordance with our Privacy Policy. You can manage your notification preferences in the Settings panel.

      Best regards,
      The StudyOs Team
    `.trim();

    return await this.sendEmail(userEmail, subject, body, 'RoleChange');
  }

  /**
   * Legacy support check
   */
  static isConfigured() {
    return true; // Cloud Functions are always available once deployed
  }
}

export { EmailService };
