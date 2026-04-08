const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "YOUR_STRIPE_SECRET_KEY");

admin.initializeApp();

const createEmailTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP_USER / SMTP_PASS are not configured.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

const APP_URL = "https://studyos.sahanpramuditha.me/";
const LOGO_URL = `${APP_URL}logo.svg`;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const categoryConfig = {
  reminder: {
    badge: "Study Reminder",
    accent: "#2563eb",
    ctaLabel: "Open Reminders"
  },
  rolechange: {
    badge: "Account Update",
    accent: "#7c3aed",
    ctaLabel: "Open Settings"
  },
  invitation: {
    badge: "Invitation",
    accent: "#059669",
    ctaLabel: "Join StudyOs"
  },
  general: {
    badge: "StudyOs Notification",
    accent: "#0f172a",
    ctaLabel: "Open StudyOs"
  }
};

const buildEmailHtml = ({ subject = "", body = "", category = "General" }) => {
  const normalizedCategory = String(category || "General").trim().toLowerCase();
  const config = categoryConfig[normalizedCategory] || categoryConfig.general;
  const safeSubject = escapeHtml(subject);
  const bodyLines = String(body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bodyHtml = bodyLines
    .map((line) => `<p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.65;">${escapeHtml(line)}</p>`)
    .join("");

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg, ${config.accent}, #0ea5e9);padding:22px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="display:flex;align-items:center;gap:12px;">
                        <img
                          src="${LOGO_URL}"
                          width="40"
                          height="40"
                          alt="StudyOs"
                          style="display:block;border-radius:10px;background:rgba(255,255,255,.12);padding:6px;"
                        />
                        <div>
                          <div style="font-size:11px;letter-spacing:.08em;font-weight:800;color:rgba(255,255,255,.88);text-transform:uppercase;">${config.badge}</div>
                          <div style="margin-top:4px;font-weight:900;color:#fff;font-size:14px;letter-spacing:.02em;">StudyOs</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:8px 0 0;color:#fff;font-size:22px;line-height:1.3;">${safeSubject}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${bodyHtml || '<p style="margin:0;color:#334155;font-size:14px;line-height:1.65;">You have a new update from StudyOs.</p>'}
                <div style="margin-top:24px;">
                  <a href="${APP_URL}" style="display:inline-block;background:${config.accent};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 16px;border-radius:10px;">
                    ${config.ctaLabel}
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <div style="border-top:1px solid #e2e8f0;padding-top:14px;color:#64748b;font-size:12px;line-height:1.6;">
                  Sent by StudyOs • <a href="${APP_URL}" style="color:#2563eb;text-decoration:none;">studyos.sahanpramuditha.me</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
};

/**
 * Stripe: Create a checkout session for plan upgrades
 */
exports.createCheckoutSession = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");
  
  const { priceId, origin } = request.data || {};
  const userId = request.auth.uid;
  const safeOrigin = typeof origin === "string" && origin.startsWith("http")
    ? origin
    : "http://localhost:5173";

  if (!priceId) {
    throw new HttpsError("invalid-argument", "Missing Stripe priceId.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${safeOrigin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/settings?checkout=cancelled`,
      client_reference_id: userId,
      metadata: { userId }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("[Stripe] Failed to create session:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Stripe: Webhook handler for subscription lifecycle events
 */
exports.stripeWebhook = onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Note: Webhook secret must be configured in Firebase/GCP secrets or environment
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || "YOUR_WEBHOOK_SECRET");
  } catch (err) {
    console.error(`[Stripe Webhook] Verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = admin.firestore();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.userId;
    
    if (userId) {
      console.log(`[Stripe] Upgrading user ${userId} to Pro plan.`);
      // Upgrade user to Pro Plan with increased limits
      await db.collection("users").doc(userId).update({
        role: 'pro',
        plan: 'Pro',
        stripeCustomerId: session.customer || null,
        limits: {
          storageMB: 500,
          maxFiles: 1000,
          maxCourses: 20,
          maxNotes: 500
        },
        "status.isTrial": false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const status = subscription.status;
    const shouldDowngrade = ['canceled', 'incomplete_expired', 'unpaid', 'past_due'].includes(status);
    const customerId = subscription.customer;

    if (shouldDowngrade && customerId) {
      const matchSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
      if (!matchSnap.empty) {
        const userDoc = matchSnap.docs[0];
        await userDoc.ref.update({
          role: 'student',
          plan: 'Free',
          limits: {
            storageMB: 10,
            maxFiles: 50,
            maxCourses: 5,
            maxNotes: 100
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  }

  res.json({ received: true });
});

/**
 * Send transactional emails using Gmail SMTP (App Password).
 * This is a secure server-side implementation to prevent credential exposure.
 */
exports.sendEmail = onCall({
  secrets: ["SMTP_USER", "SMTP_PASS", "SMTP_FROM"]
}, async (request) => {
  // 1. Authenticate the caller
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in to send emails.");
  }

  const { to, subject, body, templateId, category } = request.data;
  const db = admin.firestore();

  try {
    // 2. Gmail SMTP transporter (requires App Password)
    const transporter = createEmailTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!fromAddress) {
      throw new Error("SMTP_FROM / SMTP_USER is not configured.");
    }

    const mailOptions = {
      from: `"StudyOs" <${fromAddress}>`,
      to,
      subject,
      text: body,
      html: buildEmailHtml({ subject, body, category })
    };

    // 3. Send the email
    const info = await transporter.sendMail(mailOptions);

    // 4. Audit Log
    await db.collection("audit_logs").add({
      type: "email_sent",
      to,
      subject,
      category: category || "General",
      performedBy: request.auth.uid,
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailSender] Failed to send email:", error);
    const message = error?.message || "Failed to send email.";
    throw new HttpsError("internal", message);
  }
});

/**
 * Export a user-owned data package for privacy and backup workflows.
 */
exports.exportUserDataPackage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in to export data.");
  }

  const userId = request.auth.uid;
  const db = admin.firestore();

  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const dataSnap = await userRef.collection("data").get();

    const modules = {};
    dataSnap.forEach((doc) => {
      const payload = doc.data()?.data ?? null;
      modules[doc.id] = payload;
    });

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      userId,
      profile: userSnap.exists ? userSnap.data() : {},
      modules
    };
  } catch (error) {
    console.error("[DataExport] Failed to export user package:", error);
    throw new HttpsError("internal", "Failed to export user data package.");
  }
});

/**
 * Triggers whenever a user's module data is updated to recalculate aggregate usage.
 * This prevents client-side tampering and ensures race-condition safety.
 */
exports.aggregateUserUsage = onDocumentWritten("users/{userId}/data/{moduleName}", async (event) => {
  const { userId } = event.params;
  const db = admin.firestore();
  
  // 1. Fetch all documents in the user's data collection
  const dataSnap = await db.collection("users").doc(userId).collection("data").get();
  
  let totalSize = 0;
  let totalFiles = 0;
  let courseCount = 0;
  let noteCount = 0;
  let videoCount = 0;

  dataSnap.forEach(doc => {
    const data = doc.data().data || [];
    const module = doc.id;
    
    // Count items based on module type
    if (module === 'studyos_courses') courseCount = data.length;
    if (module === 'studyos_notes') noteCount = data.length;
    if (module === 'studyos_videos') videoCount = data.length;
    
    // Estimate size based on JSON stringification
    const moduleSize = JSON.stringify(data).length;
    totalSize += moduleSize;
    totalFiles += data.length;
  });

  const totalSizeMB = parseFloat((totalSize / (1024 * 1024)).toFixed(3));

  // 2. Update user profile with exact totals
  await db.collection("users").doc(userId).update({
    "usage.storageUsedMB": totalSizeMB,
    "usage.fileCount": totalFiles,
    "usage.courseCount": courseCount,
    "usage.noteCount": noteCount,
    "usage.videoCount": videoCount,
    "usage.updatedAt": admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`[UsageAggregator] Recalculated usage for ${userId}: ${totalSizeMB}MB across ${totalFiles} items.`);
});

/**
 * Weekly deep-recalculation to ensure consistency
 */
exports.scheduledUsageAudit = onSchedule("every monday 03:00", async (event) => {
  const db = admin.firestore();
  const usersSnap = await db.collection("users").get();
  
  const auditTasks = usersSnap.docs.map(async (userDoc) => {
    const userId = userDoc.id;
    const dataSnap = await db.collection("users").doc(userId).collection("data").get();
    
    let totalSize = 0;
    let totalFiles = 0;
    
    dataSnap.forEach(doc => {
      const data = doc.data().data || [];
      totalSize += JSON.stringify(data).length;
      totalFiles += data.length;
    });

    return db.collection("users").doc(userId).update({
      "usage.storageUsedMB": parseFloat((totalSize / (1024 * 1024)).toFixed(3)),
      "usage.fileCount": totalFiles,
      "usage.auditAt": admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await Promise.all(auditTasks);
  console.log(`[UsageAudit] Audited ${auditTasks.length} users.`);
});
