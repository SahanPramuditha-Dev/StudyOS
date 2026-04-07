import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCobeHAOZbK0J3-JJoCVBY4BUfpHJshU7o",
  authDomain: "studyos-24a46.firebaseapp.com",
  projectId: "studyos-24a46",
  storageBucket: "studyos-24a46.firebasestorage.app",
  messagingSenderId: "405497439354",
  appId: "1:405497439354:web:070cb26264aead845c07c3",
  measurementId: "G-N3GGJQMCPE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);

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
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
