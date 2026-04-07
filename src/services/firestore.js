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
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * FirestoreService handles cloud data persistence for StudyOs.
 * All data is scoped under the user's unique ID (uid).
 */
class FirestoreService {
  /**
   * Syncs a specific collection for a user
   * @param {string} userId - Current user's UID
   * @param {string} key - Storage key (e.g., 'studyos_courses')
   * @param {any} data - Data to save
   */
  static async saveUserData(userId, key, data) {
    if (!userId) return;
    try {
      console.log(`[FirestoreService] Saving ${key} for user ${userId}...`, data);
      const docRef = doc(db, 'users', userId, 'data', key);
      await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
      console.log(`[FirestoreService] Successfully saved ${key}.`);
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
      console.log(`[FirestoreService] Fetching ${key} for user ${userId}...`);
      const docRef = doc(db, 'users', userId, 'data', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log(`[FirestoreService] Data found for ${key}.`);
        return docSnap.data().data;
      }
      console.log(`[FirestoreService] No data found for ${key}.`);
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
}

export { FirestoreService };
