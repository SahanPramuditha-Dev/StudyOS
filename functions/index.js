const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { randomUUID } = require("crypto");
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "YOUR_STRIPE_SECRET_KEY");

// Define secrets
const githubClientSecret = defineSecret("GITHUB_CLIENT_SECRET");

admin.initializeApp();

function buildUserProfilePayloadFromAuthRecord(user) {
  const now = new Date().toISOString();
  const email = user.email || "";
  const name =
    user.displayName || (email ? email.split("@")[0] : null) || "StudyOS User";

  return {
    uid: user.uid,
    email: email || null,
    name,
    role: "restricted",
    status: { isActive: true, isBlocked: false, isTrial: true },
    limits: { storageMB: 5, maxFiles: 10, maxCourses: 2, maxNotes: 20 },
    usage: {
      storageUsedMB: 0,
      fileCount: 0,
      courseCount: 0,
      noteCount: 0,
    },
    permissions: {
      courses: false,
      videos: false,
      notes: true,
      resources: true,
      projects: false,
      workspace: false,
      reminders: true,
      analytics: false,
      adminPanel: false,
      manageUsers: false,
      changePermissions: false,
    },
    features: { advancedAnalytics: false, aiNotes: false, exportPDF: false },
    createdAt: now,
    lastLogin: now,
  };
}

/**
 * When a Firebase Auth user is created (Google, email, etc.), create users/{uid} in Firestore
 * using the Admin SDK (ignores security rules). Fixes missing profiles when client writes fail
 * (App Check, network, rule edge cases).
 */
exports.syncAuthUserToFirestore = functionsV1.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  if (!uid) return;
  const db = admin.firestore();
  const ref = db.collection("users").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    return;
  }
  await ref.set(buildUserProfilePayloadFromAuthRecord(user));
});

/**
 * Callable: create users/{uid} if missing (e.g. Auth account existed before syncAuthUserToFirestore
 * was deployed, or client create failed). Caller must be the same uid.
 */
exports.ensureMyUserProfileDoc = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;
  const db = admin.firestore();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    return { created: false };
  }
  let userRecord;
  try {
    userRecord = await admin.auth().getUser(uid);
  } catch (e) {
    console.error("[ensureMyUserProfileDoc] getUser failed:", e);
    throw new HttpsError("internal", "Could not load auth user.");
  }
  await ref.set(buildUserProfilePayloadFromAuthRecord(userRecord));
  return { created: true };
});

const normalizeChatEmail = (email) => String(email || "").trim().toLowerCase();

/**
 * Callable: send a chat message using the Admin SDK.
 * This acts as a safe fallback when Firestore security rules are too strict for a valid member.
 */
exports.sendChatMessageToRoom = onCall(async (request) => {
  const auth = request.auth;
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const {
    roomId,
    text,
    senderUid,
    senderEmail,
    senderName = "",
    senderAvatar = "",
    attachments = [],
    replyToMessageId = "",
    replyToText = "",
    replyToSenderName = "",
    replyToSenderEmail = ""
  } = request.data || {};

  const normalizedEmail = normalizeChatEmail(senderEmail);
  if (!roomId || !senderUid || !normalizedEmail || !String(text || "").trim()) {
    throw new HttpsError("invalid-argument", "Missing message metadata.");
  }

  if (auth.uid !== senderUid) {
    throw new HttpsError("permission-denied", "Sender mismatch.");
  }

  const db = admin.firestore();
  const roomRef = db.collection("chat_rooms").doc(String(roomId));
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) {
    throw new HttpsError("not-found", "Chat room not found.");
  }

  const room = roomSnap.data() || {};
  const normalizedMembers = Array.isArray(room.memberEmails)
    ? room.memberEmails.map(normalizeChatEmail).filter(Boolean)
    : [];
  const roomCreatorEmail = normalizeChatEmail(room.createdByEmail);
  const allowed =
    room.createdByUid === auth.uid ||
    normalizedMembers.includes(normalizedEmail) ||
    roomCreatorEmail === normalizedEmail;

  if (!allowed) {
    throw new HttpsError("permission-denied", "You are not a member of this chat room.");
  }

  const messageData = {
    text: String(text || "").trim(),
    senderUid,
    senderEmail: normalizedEmail,
    senderName: senderName || "StudyOs User",
    senderAvatar: senderAvatar || "",
    attachments,
    replyToMessageId: String(replyToMessageId || ""),
    replyToText: String(replyToText || ""),
    replyToSenderName: String(replyToSenderName || ""),
    replyToSenderEmail: String(replyToSenderEmail || ""),
    reactions: {
      thumbsUp: [],
      heart: [],
      laugh: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const messageRef = await roomRef.collection("messages").add(messageData);
  await roomRef.set(
    {
      lastMessage: String(text || "").trim().slice(0, 240),
      lastMessageAt: new Date().toISOString(),
      lastMessageSenderEmail: normalizedEmail,
      lastMessageSenderUid: senderUid,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { messageId: messageRef.id };
});

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeKey = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const toReminderDateTime = (dateStr, timeStr = "00:00") => {
  if (!dateStr) return null;
  const [year, month, day] = String(dateStr).split("-").map(Number);
  if (!year || !month || !day) return null;
  const [hours, minutes] = String(timeStr || "00:00").split(":").map(Number);
  const date = new Date(year, month - 1, day, Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeNotificationSettings = (settings = {}) => {
  const defaults = {
    enabled: true,
    reminders: true,
    deadlines: true,
    streaks: true,
    method: "browser",
    deliveryMode: "server",
    defaultSnoozeMinutes: 10,
    alarm: {
      enabled: true,
      muted: false,
      volume: 0.8,
      repeatCount: 1,
      soundUrl: "",
      soundPath: "",
      soundName: "",
      soundType: "default"
    },
    channels: {
      reminder: { web: true, email: true },
      deadline: { web: true, email: false },
      streak: { web: true, email: false },
      roleChanges: { web: true, email: true }
    },
    silentHours: { enabled: false, start: "22:00", end: "07:00" },
    emailNotifications: { roleChanges: true, reminders: true }
  };

  const merged = {
    ...defaults,
    ...settings,
    alarm: {
      ...defaults.alarm,
      ...(settings.alarm || {})
    },
    channels: {
      ...defaults.channels,
      ...(settings.channels || {})
    },
    silentHours: {
      ...defaults.silentHours,
      ...(settings.silentHours || {})
    },
    emailNotifications: {
      ...defaults.emailNotifications,
      ...(settings.emailNotifications || {})
    }
  };

  merged.method = ["browser", "email", "both"].includes(merged.method) ? merged.method : defaults.method;
  merged.deliveryMode = ["server", "local"].includes(merged.deliveryMode) ? merged.deliveryMode : defaults.deliveryMode;
  merged.defaultSnoozeMinutes = Math.max(1, Math.min(240, Number(merged.defaultSnoozeMinutes) || defaults.defaultSnoozeMinutes));
  merged.alarm.enabled = Boolean(merged.alarm.enabled);
  merged.alarm.muted = Boolean(merged.alarm.muted);
  merged.alarm.volume = Math.max(0, Math.min(1, Number(merged.alarm.volume) || defaults.alarm.volume));
  merged.alarm.repeatCount = Math.max(1, Math.min(5, Number(merged.alarm.repeatCount) || defaults.alarm.repeatCount));
  merged.alarm.soundType = ["default", "custom"].includes(merged.alarm.soundType) ? merged.alarm.soundType : defaults.alarm.soundType;
  merged.alarm.soundUrl = typeof merged.alarm.soundUrl === "string" ? merged.alarm.soundUrl : "";
  merged.alarm.soundPath = typeof merged.alarm.soundPath === "string" ? merged.alarm.soundPath : "";
  merged.alarm.soundName = typeof merged.alarm.soundName === "string" ? merged.alarm.soundName : "";

  return merged;
};

const normalizeReminder = (reminder = {}) => ({
  ...reminder,
  title: reminder.title || reminder.message || "",
  message: reminder.message || reminder.title || "",
  date: reminder.date || formatDateKey(new Date()),
  time: reminder.time || "09:00",
  allDay: reminder.allDay ?? false,
  durationMinutes: Number(reminder.durationMinutes || 60),
  reminderOffsetMinutes: Number(reminder.reminderOffsetMinutes ?? 15),
  recurring: reminder.recurring || "None",
  recurringIntervalDays: Number(reminder.recurringIntervalDays || 1),
  enabled: reminder.enabled ?? true,
  completed: reminder.completed ?? false,
  snoozeEnabled: reminder.snoozeEnabled ?? true,
  snoozeMinutes: Number(reminder.snoozeMinutes || 10),
  sendEmail: reminder.sendEmail ?? false,
  soundMode: ["inherit", "custom", "mute"].includes(reminder.soundMode) ? reminder.soundMode : "inherit",
  soundUrl: reminder.soundUrl || "",
  soundPath: reminder.soundPath || "",
  soundName: reminder.soundName || "",
  soundVolume: Number(reminder.soundVolume ?? 0.8),
  soundRepeatCount: Number(reminder.soundRepeatCount ?? 1),
  lastTriggered: reminder.lastTriggered || [],
  missed: reminder.missed ?? false,
  missedCount: Number(reminder.missedCount || 0)
});

const getTriggerDateTime = (reminder) => {
  const eventAt = toReminderDateTime(reminder.date, reminder.time);
  if (!eventAt) return null;
  const triggerAt = new Date(eventAt);
  triggerAt.setMinutes(triggerAt.getMinutes() - Number(reminder.reminderOffsetMinutes || 0));
  return triggerAt;
};

const getNextRecurringDate = (date, recurring, customDays = 1) => {
  const next = new Date(date);
  if (recurring === "Daily") next.setDate(next.getDate() + 1);
  if (recurring === "Weekly") next.setDate(next.getDate() + 7);
  if (recurring === "Monthly") next.setMonth(next.getMonth() + 1);
  if (recurring === "Custom") next.setDate(next.getDate() + Number(customDays || 1));
  return next;
};

const prependNotification = (existing = [], notification = [], cap = 100) => {
  const merged = [...notification, ...existing];
  return merged.slice(0, cap);
};

const queueUserNotification = async (db, userId, notification) => {
  const docRef = db.collection("users").doc(userId).collection("data").doc("studyos_notifications");
  const snap = await docRef.get();
  const existing = Array.isArray(snap.data()?.data) ? snap.data().data : [];
  const next = prependNotification(existing, [notification], 100);
  await docRef.set({
    data: next,
    updatedAt: new Date().toISOString()
  });
};

const sendTransactionalEmail = async ({ to, subject, body, category = "General", performedBy = null }) => {
  const db = admin.firestore();
  const transporter = createEmailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!fromAddress) {
    throw new Error("SMTP_FROM / SMTP_USER is not configured.");
  }

  const info = await transporter.sendMail({
    from: `"StudyOs" <${fromAddress}>`,
    to,
    subject,
    text: body,
    html: buildEmailHtml({ subject, body, category })
  });

  await db.collection("audit_logs").add({
    type: "email_sent",
    to,
    subject,
    category: category || "General",
    performedBy,
    performedAt: admin.firestore.FieldValue.serverTimestamp(),
    messageId: info.messageId
  });

  return info;
};

const buildReminderEmailContent = (reminder = {}) => {
  const subject = `Study Alert: ${reminder.category || "Reminder"}`;
  const body = `
      Hello!

      This is a reminder from StudyOs:

      "${reminder.message}"

      Category: ${reminder.category || "General"}
      Priority: ${reminder.priority || "Medium"}
      Time: ${reminder.time}

      Happy studying!
      - The StudyOs Team
    `.trim();

  return { subject, body };
};

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
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.FUNCTIONS_EMULATOR === "true"
  ? "http://localhost:5173"
  : APP_URL);

const buildFrontendUrl = (path = "") => {
  const base = FRONTEND_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

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

  try {
    const info = await sendTransactionalEmail({
      to,
      subject,
      body,
      category: category || "General",
      performedBy: request.auth.uid
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailSender] Failed to send email:", error);
    const message = error?.message || "Failed to send email.";
    throw new HttpsError("internal", message);
  }
});

exports.getEmailDeliveryStatus = onCall({
  secrets: ["SMTP_USER", "SMTP_PASS", "SMTP_FROM"]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  return {
    configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && (process.env.SMTP_FROM || process.env.SMTP_USER)),
    fromConfigured: Boolean(process.env.SMTP_FROM || process.env.SMTP_USER)
  };
});

/**
 * Scheduled reminder dispatcher.
 * Scans server-synced reminder data and queues notifications/emails when due.
 */
exports.dispatchDueReminders = onSchedule("every 1 minutes", async () => {
  const db = admin.firestore();
  const usersSnap = await db.collection("users").get();
  const now = new Date();
  const nowIso = now.toISOString();
  const todayKey = formatDateKey(now);

  for (const userDoc of usersSnap.docs) {
    try {
      const userId = userDoc.id;
      const userDataCol = userDoc.ref.collection("data");
      const [remindersSnap, notifSettingsSnap, notificationsSnap] = await Promise.all([
        userDataCol.doc("studyos_reminders").get(),
        userDataCol.doc("studyos_notif_settings").get(),
        userDataCol.doc("studyos_notifications").get()
      ]);

      const reminders = Array.isArray(remindersSnap.data()?.data) ? remindersSnap.data().data : [];
      const prefs = normalizeNotificationSettings(notifSettingsSnap.data()?.data || {});
      if (prefs.deliveryMode !== "server") {
        continue;
      }

      const existingNotifications = Array.isArray(notificationsSnap.data()?.data) ? notificationsSnap.data().data : [];
      const updatedNotifications = [];
      const updatedReminders = [];
      let remindersChanged = false;
      let notificationsChanged = false;

      for (const rawReminder of reminders) {
        const reminder = normalizeReminder(rawReminder);
        const triggerAt = getTriggerDateTime(reminder);
        let updatedReminder = rawReminder;

        const triggerKey = triggerAt ? `${formatDateKey(triggerAt)} ${formatTimeKey(triggerAt)}` : null;
        const eventAt = toReminderDateTime(reminder.date, reminder.time);
        const hasTriggered = triggerKey ? reminder.lastTriggered?.includes(triggerKey) : true;

        const reminderEligible = reminder.enabled && !reminder.completed && triggerAt && triggerAt <= now && !hasTriggered;
        if (reminderEligible) {
          const lastTriggered = [...(reminder.lastTriggered || []), triggerKey];
          let nextDate = reminder.date;
          let enabled = reminder.enabled;
          let missed = false;
          let missedCount = reminder.missedCount || 0;

          if (["Daily", "Weekly", "Monthly", "Custom"].includes(reminder.recurring)) {
            const nextEventDate = getNextRecurringDate(eventAt || now, reminder.recurring, reminder.recurringIntervalDays);
            nextDate = formatDateKey(nextEventDate);
            enabled = true;
          } else {
            enabled = false;
          }

          if (!reminder.completed && eventAt && eventAt < now && !reminder.missed) {
            missed = true;
            missedCount += 1;
          }

          updatedReminder = {
            ...rawReminder,
            lastTriggered,
            date: nextDate,
            enabled,
            missed,
            missedCount,
            lastReminderAt: nowIso,
            updatedAt: nowIso
          };

          const reminderSoundUrl = reminder.soundMode === "custom" ? reminder.soundUrl : (prefs.alarm?.soundUrl || "");
          const reminderSoundVolume = reminder.soundMode === "custom"
            ? Number(reminder.soundVolume ?? prefs.alarm?.volume ?? 0.8)
            : Number(prefs.alarm?.volume ?? 0.8);
          const reminderSoundRepeatCount = reminder.soundMode === "custom"
            ? Number(reminder.soundRepeatCount ?? prefs.alarm?.repeatCount ?? 1)
            : Number(prefs.alarm?.repeatCount ?? 1);

          updatedNotifications.unshift({
            id: randomUUID(),
            title: `Event Reminder: ${reminder.category || "Reminder"}`,
            message: reminder.message || "Untitled event",
            type: "reminder",
            reminderId: reminder.id,
            route: "/reminders",
            timestamp: nowIso,
            read: false,
            soundMode: reminder.soundMode || "inherit",
            soundUrl: reminderSoundUrl,
            soundVolume: reminderSoundVolume,
            soundRepeatCount: reminderSoundRepeatCount,
            browserDeliveredAt: null
          });

          if (prefs.enabled !== false && prefs.reminders !== false && reminder.sendEmail && userDoc.data()?.email) {
            const allowsEmail = prefs.channels?.reminder?.email !== false && prefs.emailNotifications?.reminders !== false;
            if (allowsEmail) {
              const { subject, body } = buildReminderEmailContent(reminder);
              try {
                await sendTransactionalEmail({
                  to: userDoc.data().email,
                  subject,
                  body,
                  category: "Reminder",
                  performedBy: "scheduled-reminder-dispatch"
                });
              } catch (emailError) {
                console.error(`[ReminderDispatcher] Email failed for ${userId}/${reminder.id}:`, emailError);
              }
            }
          }

          remindersChanged = true;
        }

        const upcomingDeadline = reminder.enabled && !reminder.completed && eventAt
          ? (eventAt.getTime() - now.getTime()) > 0 && (eventAt.getTime() - now.getTime()) <= 24 * 60 * 60 * 1000 && reminder.deadlineNotifiedAt !== todayKey
          : false;

        if (upcomingDeadline) {
          updatedNotifications.unshift({
            id: randomUUID(),
            title: "Upcoming Deadline",
            message: `${reminder.title || reminder.message || "Reminder"} is due within 24h`,
            type: "deadline",
            reminderId: reminder.id,
            route: "/reminders",
            timestamp: nowIso,
            read: false,
            browserDeliveredAt: null
          });
          updatedReminder = {
            ...updatedReminder,
            deadlineNotifiedAt: todayKey,
            updatedAt: nowIso
          };
          remindersChanged = true;
        }

        if (updatedReminder !== rawReminder) {
          updatedReminders.push(updatedReminder);
        } else {
          updatedReminders.push(rawReminder);
        }
      }

      if (updatedNotifications.length > 0) {
        const nextNotifications = prependNotification(existingNotifications, updatedNotifications, 100);
        await userDataCol.doc("studyos_notifications").set({
          data: nextNotifications,
          updatedAt: nowIso
        });
        notificationsChanged = true;
      }

      if (remindersChanged) {
        await userDataCol.doc("studyos_reminders").set({
          data: updatedReminders,
          updatedAt: nowIso
        });
      }

      if (notificationsChanged || remindersChanged) {
        console.log(`[ReminderDispatcher] Processed ${userId}: reminders=${remindersChanged}, notifications=${notificationsChanged}`);
      }
    } catch (error) {
      console.error(`[ReminderDispatcher] Failed for user ${userDoc.id}:`, error);
    }
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

/**
 * GitHub OAuth Callback Handler
 * Exchanges GitHub authorization code for access token
 * Called by GitHub after user approves authorization
 */
exports.githubCallback = onRequest({ secrets: [githubClientSecret] }, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const code = req.query.code;
    const state = req.query.state;
    let returnPath = '/';

    if (!code) {
      console.error('[GitHub] Missing authorization code');
      return res.redirect(buildFrontendUrl(`?github_error=no_code`));
    }

    if (typeof state === 'string') {
      try {
        const parsed = JSON.parse(decodeURIComponent(state));
        if (parsed.returnPath && typeof parsed.returnPath === 'string') {
          returnPath = parsed.returnPath;
        }
      } catch (err) {
        console.warn('[GitHub] Could not parse state:', err.message);
      }
    }

    console.log('[GitHub] Parsed state returnPath:', returnPath);

    // Get GitHub OAuth credentials with fallbacks
    const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liYRLyDZomfqM8DG';
    const clientSecret = githubClientSecret.value() || process.env.GITHUB_CLIENT_SECRET;

    if (!clientSecret) {
      console.error('[GitHub] Missing GitHub Client Secret - secret not available');
      return res.status(500).send('GitHub OAuth Client Secret not configured.');
    }

    console.log('[GitHub] Using Client ID:', clientId);
    console.log('[GitHub] GitHub client secret available:', !!clientSecret);
    console.log('[GitHub] Exchanging code for access token...');

    // Exchange code for access token
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: buildFrontendUrl(`/oauth/github/callback`)
    });

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenBody.toString()
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('[GitHub] Token exchange failed:', tokenData.error_description);
      return res.redirect(buildFrontendUrl(`?github_error=${encodeURIComponent(tokenData.error)}`));
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error('[GitHub] No access token in response');
      return res.redirect(buildFrontendUrl(`?github_error=no_token`));
    }

    console.log('[GitHub] Access token obtained successfully');

    // Verify token by fetching user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const userData = await userResponse.json();
    if (!userData.login) {
      console.error('[GitHub] Failed to verify token');
      return res.redirect(buildFrontendUrl(`?github_error=verification_failed`));
    }

    console.log(`[GitHub] Successfully authenticated user: ${userData.login}`);
    console.log('[GitHub] Redirecting back to app path:', returnPath);

    // Redirect back to frontend callback route with token in query
    // Preserve the original page path from state so the app can return there.
    return res.redirect(buildFrontendUrl(`/oauth/github/callback?github_token=${encodeURIComponent(accessToken)}&github_user=${encodeURIComponent(userData.login)}&returnPath=${encodeURIComponent(returnPath)}`));

  } catch (error) {
    console.error('[GitHub] Callback error:', error);
    return res.redirect(buildFrontendUrl(`?github_error=server_error`));
  }
});
