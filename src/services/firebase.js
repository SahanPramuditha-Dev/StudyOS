import { initializeApp } from "firebase/app";
import { getAuth, getRedirectResult, setPersistence, browserSessionPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const firebaseEnvMappings = [
  ["VITE_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["VITE_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
  ["VITE_FIREBASE_MESSAGING_SENDER_ID", firebaseConfig.messagingSenderId],
  ["VITE_FIREBASE_APP_ID", firebaseConfig.appId]
];

const looksLikePlaceholder = (value) => {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.startsWith("your_") ||
    normalized.startsWith("your-") ||
    normalized.includes("yourproject") ||
    normalized.includes("example")
  );
};

const invalidFirebaseEnvVars = firebaseEnvMappings
  .filter(([, value]) => !value || looksLikePlaceholder(value))
  .map(([key]) => key);

if (invalidFirebaseEnvVars.length > 0) {
  console.error(
    [
      "Firebase environment variables are missing or still set to placeholder values.",
      `Invalid variables: ${invalidFirebaseEnvVars.join(", ")}`,
      "Create a .env.local file from .env.example and set real values from Firebase Console > Project settings > Your apps > Web app config.",
      "After updating .env.local, restart the Vite dev server."
    ].join("\n")
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check (Industrial Grade Security)
// Note: Requires VITE_RECAPTCHA_SITE_KEY in .env and configuration in Firebase Console
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
  console.log('[Firebase] App Check initialized');
} else if (import.meta.env.DEV) {
  // Use debug provider in local development if needed
  // self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Initialize Services
export const auth = getAuth(app);

/** Single shared promise so React Strict Mode / remounts do not call getRedirectResult twice. */
let firebaseRedirectResultPromise;
export function consumeFirebaseRedirectResult() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if (!firebaseRedirectResultPromise) {
    firebaseRedirectResultPromise = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      try {
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }
      } catch {
        void 0;
      }
      return getRedirectResult(auth);
    })();
  }
  return firebaseRedirectResultPromise;
}

// Initialize Firestore with persistent cache and experimental long-polling
// This fixes the net::ERR_ABORTED errors by forcing a more stable connection method
// and allowing multiple tabs to share the same persistent cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
});

export const storage = getStorage(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
