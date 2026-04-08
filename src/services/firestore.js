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
  limit,
  startAfter,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { computeUsageMetrics } from './usageMetrics';

/**
 * FirestoreService handles cloud data persistence for StudyOs.
 * All data is scoped under the user's unique ID (uid).
 */
class FirestoreService {
  /**
   * Creates or updates a user profile document
   */
  static async createUserProfile(userId, profileData) {
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const defaultProfile = {
          uid: userId,
          email: profileData.email,
          name: profileData.name,
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
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await setDoc(userRef, defaultProfile);
        return defaultProfile;
      } else {
        const existingData = userSnap.data();
        // Update last login
        await updateDoc(userRef, { lastLogin: new Date().toISOString() });
        
        // Background recalculation to ensure accuracy
        (async () => {
          try {
            const dataCol = collection(db, 'users', userId, 'data');
            const snap = await getDocs(dataCol);
            const collections = {
              studyos_resources: [],
              studyos_notes: [],
              studyos_papers: []
            };
            snap.forEach(d => {
              const v = d.data()?.data;
              if (Object.prototype.hasOwnProperty.call(collections, d.id) && Array.isArray(v)) {
                collections[d.id] = v;
              }
            });
            const usage = computeUsageMetrics({
              resources: collections.studyos_resources,
              notes: collections.studyos_notes,
              papers: collections.studyos_papers,
              cloudUsage: existingData.usage
            });
            if (
              existingData.usage?.fileCount !== usage.displayFileCount ||
              Number(existingData.usage?.storageUsedMB || 0) !== Number(usage.displayStorageUsedMB || 0)
            ) {
              await updateDoc(userRef, {
                'usage.fileCount': usage.displayFileCount,
                'usage.storageUsedMB': Number(usage.displayStorageUsedMB.toFixed(3))
              });
            }
          } catch (e) { console.warn('[Firestore] Background audit failed:', e); }
        })();

        return existingData;
      }
    } catch (error) {
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
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      console.error('[FirestoreService] Error fetching user profile:', error);
      return null;
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

  /**
   * Admin: Updates a user's settings (role, limits, permissions)
   */
  static async updateUserByAdmin(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
      const actor = auth.currentUser ? auth.currentUser.uid : null;
      try {
        await addDoc(collection(db, 'audit_logs'), {
          targetUserId: userId,
          updates,
          performedBy: actor,
          performedAt: new Date().toISOString(),
          type: 'admin_update_user'
        });
      } catch { void 0; }
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
   * Syncs a specific collection for a user
   * @param {string} userId - Current user's UID
   * @param {string} key - Storage key (e.g., 'studyos_courses')
   * @param {any} data - Data to save
   */
  static async saveUserData(userId, key, data) {
    if (!userId) return;
    try {
      const docRef = doc(db, 'users', userId, 'data', key);
      await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
      
      try {
        const dataCol = collection(db, 'users', userId, 'data');
        const snap = await getDocs(dataCol);
        const collections = {
          studyos_resources: [],
          studyos_notes: [],
          studyos_papers: []
        };
        
        snap.forEach(d => {
          const v = d.data()?.data;
          if (Object.prototype.hasOwnProperty.call(collections, d.id) && Array.isArray(v)) {
            collections[d.id] = v;
          }
        });
        const usage = computeUsageMetrics({
          resources: collections.studyos_resources,
          notes: collections.studyos_notes,
          papers: collections.studyos_papers
        });
        const userRef = doc(db, 'users', userId);
        
        // Use dot notation to preserve other usage metrics (courseCount, noteCount, etc)
        await updateDoc(userRef, {
          'usage.storageUsedMB': Number(usage.localStorageUsedMB.toFixed(3)),
          'usage.fileCount': usage.localFileCount,
          "usage.updatedAt": new Date().toISOString()
        });
      } catch { void 0; }
    } catch (error) {
      console.error(`[FirestoreService] Error saving to Firestore [${key}]:`, error);
      throw error;
    }
  }

  /**
   * Fetches user data from Firestore
   * @param {string} userId - Current user's UID
   * @param {string} key - Storage key
   */
  static async getUserData(userId, key) {
    if (!userId) return null;
    try {
      const docRef = doc(db, 'users', userId, 'data', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().data;
      }
      return null;
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
        callback(docSnap.data().data);
      }
    });
  }

  static async updateOwnProfile(userId, updates) {
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
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
        const dataCol = collection(db, 'users', userId, 'data');
        const snap = await getDocs(dataCol);
        uniqueKeys = snap.docs.map(d => d.id);
      }

      await Promise.all(
        uniqueKeys.map(async (key) => {
          await deleteDoc(doc(db, 'users', userId, 'data', key));
        })
      );

      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('[FirestoreService] Error deleting user data:', error);
      throw error;
    }
  }
}

export { FirestoreService };
