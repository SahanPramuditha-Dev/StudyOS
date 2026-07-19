import { useState, useEffect, useRef, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const serializeValue = (value) => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return 'null';
  }
};

const hydratedSessionKeys = new Set();

/**
 * useStorage provides cloud-first persistent state synced with Firestore.
 * The hook keeps local persistence immediate, hydrates from Firestore once,
 * and only writes cloud updates after the value has actually changed.
 */
export const useStorage = (key, initialValue) => {
  const { user, profile } = useAuth();
  const isHydratingFromCloud = useRef(false);
  const [storedValue, setStoredValue] = useState(() => {
    const localItem = StorageService.get(key);
    return localItem !== null ? localItem : initialValue;
  });
  
  const storedValueRef = useRef(storedValue);
  const lastCloudValueRef = useRef(serializeValue(StorageService.get(key) !== null ? StorageService.get(key) : null));
  const [isInitialized, setIsInitialized] = useState(() => !user);

  useEffect(() => {
    storedValueRef.current = storedValue;
    StorageService.set(key, storedValue);
  }, [key, storedValue]);

  // Check if user is active and within storage limits
  const isActionAllowed = useCallback(() => {
    if (!profile) return true;
    if (profile.status?.isActive === false || profile.status?.isBlocked === true) {
      toast.error('Account restricted. Action blocked.');
      return false;
    }
    const currentSize = JSON.stringify(storedValueRef.current).length;
    const currentMB = currentSize / (1024 * 1024);
    if (profile.limits?.storageMB && currentMB > profile.limits.storageMB) {
      toast.error(`Storage limit of ${profile.limits.storageMB}MB exceeded.`);
      return false;
    }
    return true;
  }, [profile]);

  // Hydrate from cloud once. This avoids a real-time listener for every storage key.
  useEffect(() => {
    const userId = user?.id || null;
    if (!userId) {
      isHydratingFromCloud.current = false;
      setIsInitialized(true);
      lastCloudValueRef.current = serializeValue(storedValueRef.current);
      return undefined;
    }
    const sessionKey = `${userId}_${key}`;
    if (hydratedSessionKeys.has(sessionKey)) {
      isHydratingFromCloud.current = false;
      setIsInitialized(true);
      lastCloudValueRef.current = serializeValue(storedValueRef.current);
      return undefined;
    }

    let cancelled = false;
    setIsInitialized(false);

    const fetchInitialData = async () => {
      try {
        const cloudData = await FirestoreService.getUserData(userId, key);
        if (cancelled) return;

        hydratedSessionKeys.add(sessionKey);

        if (cloudData !== null) {
          isHydratingFromCloud.current = true;
          const nextSerialized = serializeValue(cloudData);
          if (nextSerialized !== serializeValue(storedValueRef.current)) {
            setStoredValue(cloudData);
          }
          lastCloudValueRef.current = nextSerialized;
        } else {
          // Cloud is empty, so local state becomes the source of truth.
          lastCloudValueRef.current = serializeValue(null);
        }
      } catch (error) {
        console.error(`[useStorage] [Cloud Fetch Error] ${key}:`, error);
      } finally {
        if (!cancelled) {
          isHydratingFromCloud.current = false;
          setIsInitialized(true);
        }
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, key]);

  // Debounced cloud sync. LocalStorage is updated immediately above.
  useEffect(() => {
    const userId = user?.id || null;
    if (!userId || !isInitialized || isHydratingFromCloud.current) return undefined;
    if (!isActionAllowed()) return undefined;

    const serializedCurrent = serializeValue(storedValueRef.current);
    if (serializedCurrent === lastCloudValueRef.current) return undefined;

    const handler = setTimeout(async () => {
      try {
        await FirestoreService.saveUserData(userId, key, storedValueRef.current);
        lastCloudValueRef.current = serializeValue(storedValueRef.current);
      } catch (error) {
        if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
          // Expected for modules the user doesn't have access to
          return;
        }
        console.error(`[useStorage] [Cloud Save Error] ${key}:`, error);
      }
    }, 1800);

    return () => clearTimeout(handler);
  }, [isInitialized, key, user?.id, profile, storedValue, isActionAllowed]);

  return [storedValue, setStoredValue];
};
