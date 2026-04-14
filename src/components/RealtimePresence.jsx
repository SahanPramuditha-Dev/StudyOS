import { useEffect } from 'react';
import { onDisconnect, onValue, ref, set } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { FirestoreService } from '../services/firestore';

const RealtimePresence = ({ user, profile }) => {
  const currentEmail = FirestoreService.normalizeChatEmail(user?.email);

  useEffect(() => {
    if (!user?.id || !currentEmail) return undefined;

    const statusRef = ref(rtdb, `status/${user.id}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() !== true) return;

      onDisconnect(statusRef).set({
        state: 'offline',
        name: user.name || profile?.name || currentEmail || 'StudyOs User',
        email: currentEmail,
        lastChanged: Date.now()
      });

      set(statusRef, {
        state: 'online',
        name: user.name || profile?.name || currentEmail || 'StudyOs User',
        email: currentEmail,
        lastChanged: Date.now()
      }).catch((error) => {
        console.warn('[Presence] Failed to set current user presence:', error);
      });
    });

    return () => {
      unsubscribe?.();
      set(statusRef, {
        state: 'offline',
        name: user.name || profile?.name || currentEmail || 'StudyOs User',
        email: currentEmail,
        lastChanged: Date.now()
      }).catch(() => void 0);
    };
  }, [user?.id, user?.name, profile?.name, currentEmail]);

  return null;
};

export default RealtimePresence;
