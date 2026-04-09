import { useState, useEffect, useRef, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * useStorage provides cloud-first persistent state synced with Firestore.
 * When a user is logged in, Firestore is the source of truth.
 * Local state is used for responsiveness, and changes are pushed to Firestore.
 */
export const useStorage = (key, initialValue) => {
  const { user, profile } = useAuth();
  const isSyncingFromCloud = useRef(false);

  // Initialize with initialValue or local storage (if any)
  const [storedValue, setStoredValue] = useState(() => {
    const localItem = StorageService.get(key);
    return localItem !== null ? localItem : initialValue;
  });
  const [isInitialized, setIsInitialized] = useState(() => !user);
  const storedValueRef = useRef(storedValue);

  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  // Check if user is active and within storage limits
  const isActionAllowed = useCallback(() => {
    if (!profile) return true; // Default if profile hasn't loaded
    if (profile.status?.isActive === false || profile.status?.isBlocked === true) {
      toast.error('Account restricted. Action blocked.');
      return false;
    }
    // Storage limit check (approximate based on JSON size)
    const currentSize = JSON.stringify(storedValue).length;
    const currentMB = currentSize / (1024 * 1024);
    if (profile.limits?.storageMB && currentMB > profile.limits.storageMB) {
      toast.error(`Storage limit of ${profile.limits.storageMB}MB exceeded.`);
      return false;
    }
    return true;
  }, [profile, storedValue]);

  // Sync with Firestore (Push local changes to cloud)
  useEffect(() => {
    const userId = user?.id || null;
    if (userId && isInitialized && !isSyncingFromCloud.current) {
      if (!isActionAllowed()) return;

      const handler = setTimeout(() => {
        FirestoreService.saveUserData(userId, key, storedValueRef.current);
      }, 5000); // 5 second debounce for cloud sync

      StorageService.set(key, storedValueRef.current);
      
      return () => clearTimeout(handler);
    }
  }, [isInitialized, key, user?.id, profile, isActionAllowed]);

  // Effect to handle initial Firestore fetch and real-time subscription
  useEffect(() => {
    const userId = user?.id || null;
    if (!userId) {
      isSyncingFromCloud.current = false;
      setIsInitialized(true);
      return;
    }

    setIsInitialized(false);

    const fetchInitialData = async () => {
      try {
        const cloudData = await FirestoreService.getUserData(userId, key);
        
        if (cloudData !== null) {
          isSyncingFromCloud.current = true;
          setStoredValue(cloudData);
          StorageService.set(key, cloudData);
        } else {
          StorageService.set(key, storedValueRef.current);
        }
      } catch (error) {
        console.error(`[useStorage] [Cloud Fetch Error] ${key}:`, error);
      } finally {
        isSyncingFromCloud.current = false;
        setIsInitialized(true);
      }
    };

    fetchInitialData();

    // Subscribe to real-time changes
    const unsubscribe = FirestoreService.subscribeToData(userId, key, (data) => {
      if (data !== null) {
        const currentLocal = StorageService.get(key);
        if (JSON.stringify(data) !== JSON.stringify(currentLocal)) {
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
