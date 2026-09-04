import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc, 
  updateDoc,
  onSnapshot,
  writeBatch,
  limit,
  startAfter,
  orderBy,
  addDoc,
  arrayUnion,
  arrayRemove,
  getCountFromServer,
  getDocFromCache
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from './firebase';
import { computeUsageMetrics } from './usageMetrics';
import { StorageService, STORAGE_KEYS } from './storage';

import { PREDEFINED_ROLES } from '../constants/predefinedRoles';

const userDataCache = new Map();
const userProfileCache = new Map();
const userDataReadPromises = new Map();
const usersByEmailsCache = new Map();
const pendingSaveTimeouts = new Map();
let customRolesCache = null;

const PREFERENCE_KEYS = new Set([
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.PERSONALIZATION,
  STORAGE_KEYS.STUDY_PREFS,
  STORAGE_KEYS.NOTIF_SETTINGS,
  STORAGE_KEYS.PRIVACY,
  STORAGE_KEYS.ACADEMIC_SETTINGS,
  STORAGE_KEYS.REVIEW_PREFS,
  STORAGE_KEYS.GRADE_CENTER
]);

const serializeValue = (value) => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return 'null';
  }
};

const cacheEntry = (map, key, data) => {
  const entry = {
    data,
    serialized: serializeValue(data),
    updatedAt: Date.now()
  };
  map.set(key, entry);
  return entry;
};

const getCachedEntry = (map, key) => map.get(key) || null;

const getCachedCollectionData = (userId, key) => {
  const cacheKey = `${userId}:${key}`;
  const cached = getCachedEntry(userDataCache, cacheKey);
  if (cached) return cached.data;
  const localValue = StorageService.get(key);
  return Array.isArray(localValue) ? localValue : [];
};

/**
 * FirestoreService handles cloud data persistence for StudyOs.
 * All data is scoped under the user's unique ID (uid).
 */
class FirestoreService {
  // --- Platform Settings ---
  
  static async getPlatformSettings() {
    try {
      const docRef = doc(db, 'settings', 'platform');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return { maintenanceMode: false, allowNewSignups: true, globalAnnouncement: '' };
    } catch (error) {
      console.error('[FirestoreService] Error fetching platform settings:', error);
      return { maintenanceMode: false, allowNewSignups: true, globalAnnouncement: '' };
    }
  }



  static async updatePlatformSettings(settings) {
    try {
      const docRef = doc(db, 'settings', 'platform');
      await setDoc(docRef, settings, { merge: true });
      return true;
    } catch (error) {
      console.error('[FirestoreService] Error updating platform settings:', error);
      throw error;
    }
  }

  /**
   * Default user profile shape (Firestore + client fallback when cloud init fails).
   */
  static buildDefaultUserProfile(userId, profileData) {
    const now = new Date().toISOString();
    return {
      uid: userId,
      email: profileData.email,
      name: profileData.name,
      username: profileData.username || null,
      role: 'restricted',
      status: {
        isActive: true,
        isBlocked: false,
        isTrial: true
      },
      limits: {
        storageMB: 5,
        maxFiles: 10,
        maxCourses: 2,
        maxNotes: 20
      },
      usage: {
        storageUsedMB: 0,
        fileCount: 0,
        courseCount: 0,
        noteCount: 0
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
        changePermissions: false
      },
      features: {
        advancedAnalytics: false,
        aiNotes: false,
        exportPDF: false
      },
      createdAt: now,
      lastLogin: now
    };
  }

  /**
   * Resolves an email address from a given username.
   * Returns null if not found.
   */
  static async getUserEmailByUsername(username) {
    if (!username) return null;
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    try {
      const resolver = httpsCallable(functions, 'resolveUsernameToEmail');
      const result = await resolver({ username: cleanUsername });
      const email = result?.data?.email;
      if (email) {
        return email;
      }
      return null;
    } catch (e) {
      console.error('[FirestoreService] getUserEmailByUsername failed:', e);
      return null;
    }
  }

  static RESERVED_USERNAMES = [
    'admin', 'administrator', 'support', 'help', 'system', 'root', 'owner', 'billing', 'api', 'developer'
  ];

  static validateUsernameFormat(username) {
    if (!username) return 'Username is required.';
    if (username.length < 3) return 'Username must be at least 3 characters.';
    if (username.length > 20) return 'Username must be at most 20 characters.';
    if (!/^[a-z0-9_.]+$/.test(username)) return 'Username can only contain letters, numbers, underscores, and periods.';
    if (this.RESERVED_USERNAMES.includes(username)) return 'This username is reserved.';
    return null; // Valid
  }

  static async checkUsernameAvailability(username) {
    if (!username) return false;
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const formatError = this.validateUsernameFormat(cleanUsername);
    if (formatError) return false;

    // Check users collection
    try {
      const qUsers = query(collection(db, 'users'), where('username', '==', cleanUsername), limit(1));
      const snapUsers = await getDocs(qUsers);
      if (!snapUsers.empty) return false; // Username is taken by an active user
    } catch (e) {
      console.error('[FirestoreService] checkUsernameAvailability users check failed:', e);
      throw new Error('users query failed: ' + e.message);
    }

    // Check username_history collection for 90-day holds
    try {
      const now = new Date().getTime();
      const qHistory = query(collection(db, 'username_history'), where('username', '==', cleanUsername), limit(1));
      const snapHistory = await getDocs(qHistory);
      if (!snapHistory.empty) {
        for (const doc of snapHistory.docs) {
          const data = doc.data();
          if (data.reserved_until && new Date(data.reserved_until).getTime() > now) {
            return false;
          }
        }
      }
    } catch (historyErr) {
      console.warn('[FirestoreService] checkUsernameAvailability history check failed (likely permissions):', historyErr);
      // Continue and assume available if the history check is inaccessible to the client
    }

    return true;
  }

  static async suggestUsernames(baseUsername) {
    if (!baseUsername) return [];
    const cleanUsername = baseUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '');
    const suffixes = ['123', '.dev', '_2026', '.tech', 'OS'];
    const suggestions = [];

    for (const suffix of suffixes) {
      if (suggestions.length >= 3) break;
      const candidate = `${cleanUsername}${suffix}`.substring(0, 20);
      const isAvailable = await this.checkUsernameAvailability(candidate);
      if (isAvailable && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    }
    return suggestions;
  }

  /**
   * Set a unique username for a user, enforcing 30-day limits and maintaining history.
   */
  static async setUsername(userId, username) {
    if (!userId || !username) return false;
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    
    const formatError = this.validateUsernameFormat(cleanUsername);
    if (formatError) throw new Error(formatError);

    try {
      const isAvailable = await this.checkUsernameAvailability(cleanUsername);
      if (!isAvailable) {
        throw new Error('Username is already taken or unavailable.');
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      // 30 day limit check
      if (userData?.username_changed_at) {
        const lastChange = new Date(userData.username_changed_at).getTime();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (new Date().getTime() - lastChange < thirtyDaysMs) {
          const nextAvailable = new Date(lastChange + thirtyDaysMs).toLocaleDateString();
          throw new Error(`Username can only be changed once every 30 days. Next change available on ${nextAvailable}.`);
        }
      }

      // Store history if there's a previous username
      if (userData?.username) {
        const historyRef = collection(db, 'username_history');
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        await addDoc(historyRef, {
          user_id: userId,
          username: userData.username,
          changed_at: new Date().toISOString(),
          reserved_until: new Date(new Date().getTime() + ninetyDaysMs).toISOString()
        });
      }

      const nowStr = new Date().toISOString();
      await updateDoc(userRef, { 
        username: cleanUsername,
        username_changed_at: nowStr
      });

      const cached = getCachedEntry(userProfileCache, userId);
      if (cached) {
        cacheEntry(userProfileCache, userId, { 
          ...cached.data, 
          username: cleanUsername,
          username_changed_at: nowStr
        });
      }
      return true;
    } catch (e) {
      console.error('[FirestoreService] setUsername failed:', e);
      throw e;
    }
  }

  /**
   * Creates or updates a user profile document
   */
  static async createUserProfile(userId, profileData, attempt = 0) {
    if (!userId) return;
    try {
      if (auth.currentUser?.uid === userId) {
        await auth.currentUser.getIdToken(true);
      }
      const userRef = doc(db, 'users', userId);
      let userSnap;
      try {
        userSnap = await getDocFromCache(userRef);
        if (!userSnap.exists()) {
          userSnap = await getDoc(userRef);
        }
      } catch {
        userSnap = await getDoc(userRef);
      }

      if (!userSnap.exists()) {
        const defaultProfile = FirestoreService.buildDefaultUserProfile(userId, profileData);
        await setDoc(userRef, defaultProfile);
        cacheEntry(userProfileCache, userId, defaultProfile);
        return defaultProfile;
      } else {
        const existingData = userSnap.data();
        cacheEntry(userProfileCache, userId, existingData);

        // Only update when the value actually changed to avoid repetitive writes.
        const todayKey = new Date().toISOString().slice(0, 10);
        const lastLoginKey = String(existingData?.lastLogin || '').slice(0, 10);
        if (lastLoginKey !== todayKey) {
          const now = new Date().toISOString();
          await updateDoc(userRef, { lastLogin: now });
          cacheEntry(userProfileCache, userId, { ...existingData, lastLogin: now });
        }

        return existingData;
      }
    } catch (error) {
      const permissionDenied = error?.code === 'permission-denied';
      if (
        permissionDenied &&
        attempt === 0 &&
        auth.currentUser?.uid === userId
      ) {
        try {
          const ensure = httpsCallable(functions, 'ensureMyUserProfileDoc');
          await ensure({});
          return FirestoreService.createUserProfile(userId, profileData, 1);
        } catch (ensureErr) {
          console.warn('[FirestoreService] ensureMyUserProfileDoc failed:', ensureErr);
        }
      }
      console.error('[FirestoreService] Error creating/fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific user's profile
   */
  static async getUserProfile(userId) {
    if (!userId) return null;
    try {
      const cached = getCachedEntry(userProfileCache, userId);
      if (cached) return cached.data;

      const userRef = doc(db, 'users', userId);
      try {
        const cacheSnap = await getDocFromCache(userRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data();
          cacheEntry(userProfileCache, userId, data);
          return data;
        }
      } catch {
        // Fall through to server fetch on cache miss
      }

      const userSnap = await getDoc(userRef);
      const data = userSnap.exists() ? userSnap.data() : null;
      if (data) cacheEntry(userProfileCache, userId, data);
      return data;
    } catch (error) {
      console.error('[FirestoreService] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Admin: Fast aggregate query to count users without reading documents.
   */
  static async getAdminDashboardStats() {
    try {
      const usersRef = collection(db, 'users');
      
      // Get total users
      const totalSnap = await getCountFromServer(usersRef);
      const totalUsers = totalSnap.data().count;

      // Get active users (status.isActive == true)
      const activeQuery = query(usersRef, where('status.isActive', '==', true));
      const activeSnap = await getCountFromServer(activeQuery);
      const activeUsers = activeSnap.data().count;

      // Get blocked users
      const blockedQuery = query(usersRef, where('status.isBlocked', '==', true));
      const blockedSnap = await getCountFromServer(blockedQuery);
      const blockedUsers = blockedSnap.data().count;

      return { totalUsers, activeUsers, blockedUsers };
    } catch (error) {
      console.error('[FirestoreService] Error getting dashboard stats:', error);
      return { totalUsers: 0, activeUsers: 0, blockedUsers: 0 };
    }
  }

  /**
   * Admin: Fetches user profiles with pagination
   * @param {number} pageSize 
   * @param {any} lastDoc - The last document snapshot from previous fetch
   */
  static async getAllUsers(pageSize = 15, lastDoc = null) {
    try {
      const usersRef = collection(db, 'users');
      let q;
      
      if (lastDoc) {
        q = query(usersRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(usersRef, orderBy('createdAt', 'desc'), limit(pageSize));
      }

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { users, lastVisible, hasMore: querySnapshot.docs.length === pageSize };
    } catch (error) {
      console.error('[FirestoreService] Error fetching users:', error);
      throw error;
    }
  }

  static async getUsersByEmails(emails = []) {
    const normalizedEmails = [...new Set(
      (emails || []).map(FirestoreService.normalizeChatEmail).filter(Boolean)
    )];

    if (normalizedEmails.length === 0) return [];

    const cacheKey = normalizedEmails.slice().sort().join('|');
    const cached = usersByEmailsCache.get(cacheKey);
    if (cached && Date.now() - cached.updatedAt < 5 * 60 * 1000) {
      return cached.data;
    }

    try {
      const results = [];
      for (let index = 0; index < normalizedEmails.length; index += 10) {
        const chunk = normalizedEmails.slice(index, index + 10);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', 'in', chunk));
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() });
        });
      }
      usersByEmailsCache.set(cacheKey, { data: results, updatedAt: Date.now() });
      return results;
    } catch (error) {
      console.error('[FirestoreService] Error fetching users by emails:', error);
      return [];
    }
  }

  /**
   * Admin: Updates a user's settings (role, limits, permissions)
   */
  static async updateUserByAdmin(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      const targetSnap = await getDoc(userRef);
      const targetData = targetSnap.exists() ? targetSnap.data() : {};
      const currentPayload = { ...(targetData || {}) };
      const nextPayload = { ...currentPayload, ...updates };
      if (serializeValue(currentPayload) === serializeValue(nextPayload)) {
        return;
      }

      const batch = writeBatch(db);
      batch.set(userRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      const actor = auth.currentUser ? auth.currentUser.uid : null;
      try {
        const auditRef = doc(collection(db, 'audit_logs'));
        batch.set(auditRef, {
          targetUserId: userId,
          targetUserName: targetData?.name || '',
          targetUserEmail: targetData?.email || '',
          updates,
          performedBy: actor,
          performedByName: auth.currentUser?.displayName || '',
          performedByEmail: auth.currentUser?.email || '',
          performedAt: new Date().toISOString(),
          type: 'admin_update_user'
        });
      } catch { void 0; }
      await batch.commit();
      cacheEntry(userProfileCache, userId, nextPayload);
    } catch (error) {
      console.error('[FirestoreService] Error updating user by admin:', error);
      throw error;
    }
  }

  /**
   * Admin: Fetch recent audit log entries for a user
   */
  static async getAuditLogsForUser(userId, pageSize = 10) {
    try {
      const logsRef = collection(db, 'audit_logs');
      const q = query(
        logsRef,
        where('targetUserId', '==', userId),
        orderBy('performedAt', 'desc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      if (error?.code !== 'permission-denied') {
        console.error('[FirestoreService] Error fetching audit logs:', error);
      }
      return [];
    }
  }

  /**
   * Admin: Fetch recent global audit logs
   */
  static async getRecentAuditLogs(pageSize = 50) {
    try {
      const logsRef = collection(db, 'audit_logs');
      const q = query(logsRef, orderBy('performedAt', 'desc'), limit(pageSize));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      if (error?.code !== 'permission-denied') {
        console.error('[FirestoreService] Error fetching recent audit logs:', error);
      }
      return [];
    }
  }

  /**
   * Syncs a specific collection for a user with debouncing (default 2.5s)
   * @param {string} userId - Current user's UID
   * @param {string} key - Storage key (e.g., 'studyos_courses')
   * @param {any} data - Data to save
   * @param {object} [options] - Options e.g. { immediate: false }
   */
  static async saveUserData(userId, key, data, options = {}) {
    if (!userId) return;
    
    const cacheKey = `${userId}:${key}`;
    const nextSerialized = serializeValue(data);
    const existingEntry = getCachedEntry(userDataCache, cacheKey);

    if (existingEntry?.serialized === nextSerialized) {
      return;
    }

    // Always update local memory cache immediately so reads are instant
    cacheEntry(userDataCache, cacheKey, data);

    const performWrite = async () => {
      try {
        const isPrefKey = PREFERENCE_KEYS.has(key);
        const targetDocName = isPrefKey ? 'preferences' : key;
        const docRef = doc(db, 'users', userId, 'data', targetDocName);
        const now = new Date().toISOString();
        const batch = writeBatch(db);
        
        if (isPrefKey) {
          batch.set(docRef, { [key]: data, updatedAt: now }, { merge: true });
        } else {
          batch.set(docRef, { data, updatedAt: now }, { merge: true });
        }
        
        let usageUpdate = null;
        let nextProfileCache = null;
        try {
          const assetKeys = new Set([STORAGE_KEYS.RESOURCES, STORAGE_KEYS.NOTES, STORAGE_KEYS.PAPERS]);
          if (assetKeys.has(key)) {
            const userRef = doc(db, 'users', userId);
            const profileEntry = getCachedEntry(userProfileCache, userId);
            const cloudUsage = profileEntry?.data?.usage || {};
            const usage = computeUsageMetrics({
              resources: key === STORAGE_KEYS.RESOURCES ? data : getCachedCollectionData(userId, STORAGE_KEYS.RESOURCES),
              notes: key === STORAGE_KEYS.NOTES ? data : getCachedCollectionData(userId, STORAGE_KEYS.NOTES),
              papers: key === STORAGE_KEYS.PAPERS ? data : getCachedCollectionData(userId, STORAGE_KEYS.PAPERS),
              cloudUsage
            });
            const nextUsage = {
              totalBytes: usage.totalBytes,
              assetCount: usage.displayFileCount,
              storageUsedMB: Number(usage.displayStorageUsedMB.toFixed(3)),
              fileCount: usage.displayFileCount,
              updatedAt: now
            };
            const currentUsage = {
              totalBytes: Number(profileEntry?.data?.usage?.totalBytes || 0),
              storageUsedMB: Number(profileEntry?.data?.usage?.storageUsedMB || 0),
              fileCount: Number(profileEntry?.data?.usage?.fileCount || 0)
            };

            if (
              currentUsage.totalBytes !== nextUsage.totalBytes ||
              currentUsage.fileCount !== nextUsage.fileCount
            ) {
              usageUpdate = { userRef, nextUsage };
              nextProfileCache = {
                ...(profileEntry?.data || {}),
                usage: nextUsage
              };
            }
          }
        } catch (usageError) {
          console.warn(`[FirestoreService] Usage recalculation skipped for [${key}]:`, usageError);
        }

        if (usageUpdate) {
          batch.set(usageUpdate.userRef, { usage: usageUpdate.nextUsage }, { merge: true });
        }

        await batch.commit();
        if (nextProfileCache) {
          cacheEntry(userProfileCache, userId, nextProfileCache);
        }
      } catch (error) {
        if (error?.code !== 'permission-denied' && !error?.message?.includes('Missing or insufficient permissions')) {
          console.error(`[FirestoreService] Error saving to Firestore [${key}]:`, error);
        }
        throw error;
      }
    };

    if (options.immediate) {
      if (pendingSaveTimeouts.has(cacheKey)) {
        clearTimeout(pendingSaveTimeouts.get(cacheKey));
        pendingSaveTimeouts.delete(cacheKey);
      }
      return performWrite();
    }

    if (pendingSaveTimeouts.has(cacheKey)) {
      clearTimeout(pendingSaveTimeouts.get(cacheKey));
    }

    const timeoutId = setTimeout(() => {
      pendingSaveTimeouts.delete(cacheKey);
      performWrite().catch((err) => {
        console.warn(`[FirestoreService] Debounced write failed for ${cacheKey}:`, err);
      });
    }, 2500);

    pendingSaveTimeouts.set(cacheKey, timeoutId);
  }

  /**
   * Fetches user data from Firestore (tries cache first, checking preferences doc for settings keys)
   * @param {string} userId - Current user's UID
   * @param {string} key - Storage key
   */
  static async getUserData(userId, key) {
    if (!userId) return null;
    try {
      const cacheKey = `${userId}:${key}`;
      const cached = getCachedEntry(userDataCache, cacheKey);
      if (cached) return cached.data;

      const pendingRead = userDataReadPromises.get(cacheKey);
      if (pendingRead) return pendingRead;

      const isPrefKey = PREFERENCE_KEYS.has(key);
      const readPromise = (async () => {
        if (isPrefKey) {
          // Check preferences consolidated doc first
          const prefDocRef = doc(db, 'users', userId, 'data', 'preferences');
          try {
            let prefSnap;
            try {
              prefSnap = await getDocFromCache(prefDocRef);
            } catch {
              prefSnap = await getDoc(prefDocRef);
            }
            if (prefSnap.exists()) {
              const prefData = prefSnap.data();
              if (prefData && prefData[key] !== undefined) {
                cacheEntry(userDataCache, cacheKey, prefData[key]);
                return prefData[key];
              }
            }
          } catch (e) {
            // Ignore and try fallback
          }
        }

        // Standard or legacy fallback lookup
        const docRef = doc(db, 'users', userId, 'data', key);
        try {
          const cacheSnap = await getDocFromCache(docRef);
          if (cacheSnap.exists()) {
            const data = cacheSnap.data().data;
            cacheEntry(userDataCache, cacheKey, data);
            return data;
          }
        } catch {
          // Cache miss, proceed to network fetch
        }

        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data().data : null;
        cacheEntry(userDataCache, cacheKey, data);
        return data;
      })().finally(() => {
        userDataReadPromises.delete(cacheKey);
      });

      userDataReadPromises.set(cacheKey, readPromise);
      return readPromise;
    } catch (error) {
      console.error(`[FirestoreService] Error fetching from Firestore [${key}]:`, error);
      return null;
    }
  }

  /**
   * Sets up a real-time listener for user data
   * @param {string} userId 
   * @param {string} key 
   * @param {function} callback 
   */
  static subscribeToData(userId, key, callback) {
    if (!userId) return () => {};
    const docRef = doc(db, 'users', userId, 'data', key);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().data;
        cacheEntry(userDataCache, `${userId}:${key}`, data);
        callback(data);
      }
    });
  }

  static async updateOwnProfile(userId, updates) {
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      const current = (await getDoc(userRef)).data() || {};
      const next = { ...current, ...updates };
      if (serializeValue(current) === serializeValue(next)) return;
      await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
      cacheEntry(userProfileCache, userId, next);
    } catch (error) {
      console.error('[FirestoreService] Error updating own profile:', error);
      throw error;
    }
  }

  static async deleteUserData(userId, keys = []) {
    if (!userId) return;

    let uniqueKeys = [...new Set(keys.filter(Boolean))];

    try {
      if (uniqueKeys.length === 0) {
        try {
          const dataCol = collection(db, 'users', userId, 'data');
          const snap = await getDocs(dataCol);
          uniqueKeys = snap.docs.map(d => d.id);
        } catch (e) {
          console.warn('[FirestoreService] Subcollection list failed during deleteUserData:', e);
        }
      }

      if (uniqueKeys.length > 0) {
        await Promise.allSettled(
          uniqueKeys.map(async (key) => {
            try {
              await deleteDoc(doc(db, 'users', userId, 'data', key));
            } catch (e) {
              console.warn(`[FirestoreService] Could not delete subcollection doc ${key}:`, e);
            }
          })
        );
      }

      await deleteDoc(doc(db, 'users', userId));
      userProfileCache.delete(userId);
      [...userDataCache.keys()].forEach((cacheKey) => {
        if (cacheKey.startsWith(`${userId}:`)) {
          userDataCache.delete(cacheKey);
        }
      });
    } catch (error) {
      console.error('[FirestoreService] Error deleting user data:', error);
      throw error;
    }
  }

  // End of core data methods

  static async syncLocalGamificationState(userId, pendingXP, pendingStudyTime) {
    if (!userId) return;
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const currentData = docSnap.data();
      const newXP = (currentData.orionXP || 0) + pendingXP;
      const newTime = (currentData.studyTimeMinutes || 0) + pendingStudyTime;

      await updateDoc(docRef, {
        orionXP: newXP,
        studyTimeMinutes: newTime,
        lastActive: new Date().toISOString()
      });
      console.log('[FirestoreService] Successfully synced local gamification state to Firestore.');
    } catch (error) {
      console.error('[FirestoreService] Error syncing gamification state:', error);
    }
  }
  static async logUserSession(userId, deviceInfo = {}) {
    if (!userId) return null;
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return null;
    }
    try {
      let sessionId = sessionStorage.getItem('studyos_session_id');
      const lastLoggedAt = Number(sessionStorage.getItem('studyos_session_logged_at') || 0);

      // If already logged in this tab session within the last 30 minutes, skip writing to Firestore
      if (sessionId && Date.now() - lastLoggedAt < 30 * 60 * 1000) {
        return sessionId;
      }

      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        sessionStorage.setItem('studyos_session_id', sessionId);
      }
      
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      const now = new Date().toISOString();
      const deviceName = deviceInfo.device || (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser');
      
      await setDoc(sessionRef, {
        id: sessionId,
        device: deviceName,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ip: deviceInfo.ip || 'Active Client',
        createdAt: now,
        lastActive: now,
        isActive: true
      }, { merge: true });
      
      sessionStorage.setItem('studyos_session_logged_at', Date.now().toString());

      return sessionId;
    } catch (e) {
      if (e?.code !== 'permission-denied') {
        console.warn('Failed to log user session:', e);
      }
      return null;
    }
  }

  static async getActiveSessions(userId) {
    if (!userId || !auth.currentUser) return [];
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const q = query(sessionsRef, where('isActive', '==', true));
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => new Date(b.lastActive || b.createdAt || 0) - new Date(a.lastActive || a.createdAt || 0));
      return docs;
    } catch (e) {
      if (e?.code !== 'permission-denied') {
        console.warn('Failed to get active sessions:', e);
      }
      return [];
    }
  }

  static async revokeSession(userId, sessionId) {
    if (!userId || !sessionId) return;
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(sessionRef, { isActive: false, revokedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Failed to revoke session:', e);
      throw e;
    }
  }

  static async inviteToWorkspace(workspaceId, email, role) {
    if (!workspaceId || !email) throw new Error('Workspace ID and email are required');
    try {
      const docRef = collection(db, 'workspaces', workspaceId, 'invites');
      const now = new Date().toISOString();
      await addDoc(docRef, {
        email: email.trim().toLowerCase(),
        role: role || 'member',
        status: 'pending',
        createdAt: now,
        invitedBy: auth.currentUser?.uid
      });
      return true;
    } catch (e) {
      console.warn('Failed to invite to workspace:', e);
      throw e;
    }
  }

  // --- PHASE 2: ADVANCED ADMINISTRATION ---

  static async getCustomRoles() {
    try {
      if (customRolesCache && (Date.now() - customRolesCache.updatedAt < 60 * 60 * 1000)) {
        return customRolesCache.data;
      }
      const q = query(collection(db, 'roles'));
      const snap = await getDocs(q);
      const roles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      customRolesCache = { data: roles, updatedAt: Date.now() };
      return roles;
    } catch (e) {
      console.warn('Failed to get custom roles:', e);
      return [];
    }
  }

  static async createCustomRole(roleData) {
    try {
      const docRef = await addDoc(collection(db, 'roles'), {
        ...roleData,
        createdAt: new Date().toISOString()
      });
      customRolesCache = null;
      return docRef.id;
    } catch (e) {
      console.warn('Failed to create custom role:', e);
      throw e;
    }
  }

  static async updateCustomRole(roleId, updates) {
    if (!roleId) return;
    try {
      await updateDoc(doc(db, 'roles', roleId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      customRolesCache = null;
    } catch (e) {
      console.warn('Failed to update custom role:', e);
      throw e;
    }
  }

  static async deleteCustomRole(roleId) {
    if (!roleId) return;
    try {
      await deleteDoc(doc(db, 'roles', roleId));
      customRolesCache = null;
    } catch (e) {
      console.warn('Failed to delete custom role:', e);
      throw e;
    }
  }

  static async seedDefaultRoles() {
    try {
      const batch = writeBatch(db);
      for (const tpl of PREDEFINED_ROLES) {
        const roleRef = doc(collection(db, 'roles'));
        batch.set(roleRef, {
          name: tpl.name,
          role: tpl.role,
          description: tpl.description,
          isSystem: true,
          badgeColor: tpl.badgeColor,
          modules: tpl.modules,
          actions: tpl.actions,
          createdAt: new Date().toISOString()
        });
      }
      await batch.commit();
      customRolesCache = null;
      return true;
    } catch (e) {
      console.warn('Failed to seed default roles:', e);
      throw e;
    }
  }

  static async logAdminAction(actionType, actorId, details) {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        type: actionType,
        actorId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to log admin action:', e);
    }
  }

  static async getAuditLogs(limitCount = 50) {
    try {
      const logsRef = collection(db, 'audit_logs');
      try {
        const q = query(logsRef, orderBy('performedAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (_) {
        // Fallback if index on performedAt is pending or field missing
      }
      const fallbackQuery = query(logsRef, limit(limitCount));
      const snap = await getDocs(fallbackQuery);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return docs.sort((a, b) => {
        const tA = new Date(a.performedAt || a.timestamp || a.createdAt || 0).getTime();
        const tB = new Date(b.performedAt || b.timestamp || b.createdAt || 0).getTime();
        return tB - tA;
      });
    } catch (e) {
      console.warn('Failed to get audit logs:', e);
      return [];
    }
  }

  static async submitPermissionRequest(userId, requestedResource, reason) {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'permission_requests'), {
        userId,
        requestedResource,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to submit permission request:', e);
      throw e;
    }
  }

  static async getPermissionRequests() {
    try {
      const q = query(collection(db, 'permission_requests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Failed to get permission requests:', e);
      return [];
    }
  }

  static async requestRoleUpgrade({ userId, userEmail, userName, currentRole, targetRole, reason }) {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'permission_requests'), {
        userId,
        userEmail: userEmail || '',
        userName: userName || '',
        currentRole: currentRole || 'user',
        targetRole,
        requestedResource: `Role: ${targetRole}`,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await this.logAdminAction('ROLE_REQUESTED', userId, {
        userEmail,
        currentRole,
        targetRole,
        reason
      });
      return true;
    } catch (e) {
      console.warn('Failed to request role upgrade:', e);
      throw e;
    }
  }

  static async updatePermissionRequest(requestId, status, reviewerId, requestData = null) {
    if (!requestId) return;
    try {
      await updateDoc(doc(db, 'permission_requests', requestId), {
        status,
        reviewedBy: reviewerId || auth.currentUser?.uid || 'admin',
        reviewedAt: new Date().toISOString()
      });

      // If approved and contains targetRole and userId, update user profile automatically!
      if (status === 'approved' && requestData?.userId && requestData?.targetRole) {
        const userRef = doc(db, 'users', requestData.userId);
        await updateDoc(userRef, {
          role: requestData.targetRole,
          updatedAt: new Date().toISOString()
        });
      }

      await this.logAdminAction(
        status === 'approved' ? 'ROLE_REQUEST_APPROVED' : 'ROLE_REQUEST_REJECTED',
        reviewerId || auth.currentUser?.uid || 'admin',
        {
          requestId,
          status,
          targetUserId: requestData?.userId,
          targetRole: requestData?.targetRole
        }
      );
    } catch (e) {
      console.warn('Failed to update permission request:', e);
      throw e;
    }
  }
}

export { FirestoreService };
