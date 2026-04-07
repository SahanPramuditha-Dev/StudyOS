import { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestore';
import { useAuth } from '../context/AuthContext';

/**
 * useStorage provides cloud-first persistent state synced with Firestore.
 * When a user is logged in, Firestore is the source of truth.
 * Local state is used for responsiveness, and changes are pushed to Firestore.
 */
export const useStorage = (key, initialValue) => {
  const { user } = useAuth();
  const isSyncingFromCloud = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with initialValue or local storage (if any)
  const [storedValue, setStoredValue] = useState(() => {
    const localItem = StorageService.get(key);
    return localItem !== null ? localItem : initialValue;
  });

  // Sync with Firestore (Push local changes to cloud)
  useEffect(() => {
    // ONLY push if:
    // 1. User is logged in
    // 2. We have finished the initial cloud fetch (isInitialized)
    // 3. We are not currently receiving an update FROM the cloud
    if (user && isInitialized && !isSyncingFromCloud.current) {
      console.log(`[useStorage] [Cloud Push] Updating ${key}...`);
      FirestoreService.saveUserData(user.id, key, storedValue);
      StorageService.set(key, storedValue);
    }
  }, [user, key, storedValue, isInitialized]);

  // Effect to handle initial Firestore fetch and real-time subscription
  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        console.log(`[useStorage] [Cloud Fetch] ${key}...`);
        const cloudData = await FirestoreService.getUserData(user.id, key);
        
        if (cloudData !== null) {
          isSyncingFromCloud.current = true;
          setStoredValue(cloudData);
          StorageService.set(key, cloudData);
          // Set initialized true AFTER state update
          setTimeout(() => { 
            isSyncingFromCloud.current = false;
            setIsInitialized(true);
          }, 300);
        } else {
          // Cloud empty, local data is now "authoritative"
          setIsInitialized(true);
        }
      } catch (error) {
        console.error(`[useStorage] [Cloud Fetch Error] ${key}:`, error);
        setIsInitialized(true); 
      }
    };

    fetchInitialData();

    // Subscribe to real-time changes
    const unsubscribe = FirestoreService.subscribeToData(user.id, key, (data) => {
      if (data !== null) {
        const currentLocal = StorageService.get(key);
        if (JSON.stringify(data) !== JSON.stringify(currentLocal)) {
          console.log(`[useStorage] [Cloud Sync] ${key}`);
          isSyncingFromCloud.current = true;
          setStoredValue(data);
          StorageService.set(key, data);
          setTimeout(() => { isSyncingFromCloud.current = false; }, 300);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id, key]);

  return [storedValue, setStoredValue];
};
