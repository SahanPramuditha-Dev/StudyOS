import { useState, useEffect, useCallback, useRef } from 'react';
import { FirestoreService } from '../services/firestore';
import { auth } from '../services/firebase';

const LOCAL_STORAGE_KEY = 'studyos_local_gamification';
const SYNC_XP_THRESHOLD = 150; // Sync when 150 XP is pending (reduces Firestore writes)
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // Auto-sync every 30 minutes

export function useLocalGamification() {
  const [pendingXP, setPendingXP] = useState(0);
  const [pendingStudyTime, setPendingStudyTime] = useState(0);
  const syncTimeoutRef = useRef(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const { xp = 0, studyTime = 0 } = JSON.parse(saved);
        setPendingXP(xp);
        setPendingStudyTime(studyTime);
      } catch (e) {
        console.error('Error parsing local gamification state', e);
      }
    }
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      xp: pendingXP,
      studyTime: pendingStudyTime
    }));
  }, [pendingXP, pendingStudyTime]);

  const syncToFirestore = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId || (pendingXP === 0 && pendingStudyTime === 0)) return;

    // Capture current pending amounts to sync
    const xpToSync = pendingXP;
    const timeToSync = pendingStudyTime;

    // Reset local state immediately to avoid double counting during async
    setPendingXP(prev => Math.max(0, prev - xpToSync));
    setPendingStudyTime(prev => Math.max(0, prev - timeToSync));

    try {
      await FirestoreService.syncLocalGamificationState(userId, xpToSync, timeToSync);
    } catch (error) {
      console.error('Failed to sync gamification state to Firestore:', error);
      // Revert if sync fails
      setPendingXP(prev => prev + xpToSync);
      setPendingStudyTime(prev => prev + timeToSync);
    }
  }, [pendingXP, pendingStudyTime]);

  // Sync on threshold
  useEffect(() => {
    if (pendingXP >= SYNC_XP_THRESHOLD) {
      syncToFirestore();
    }
  }, [pendingXP, syncToFirestore]);

  // Sync on interval
  useEffect(() => {
    syncTimeoutRef.current = setInterval(() => {
      syncToFirestore();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(syncTimeoutRef.current);
  }, [syncToFirestore]);

  // Sync on page unload
  useEffect(() => {
    const handleUnload = () => {
      // Note: syncToFirestore is async, so we use sendBeacon or a synchronous approach in a real prod env if critical.
      // For now, since local storage persists, if this fails, the next session will sync it.
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const addXP = useCallback((amount) => {
    setPendingXP(prev => prev + amount);
  }, []);

  const addStudyTime = useCallback((minutes) => {
    setPendingStudyTime(prev => prev + minutes);
  }, []);

  return {
    pendingXP,
    pendingStudyTime,
    addXP,
    addStudyTime,
    forceSync: syncToFirestore
  };
}
