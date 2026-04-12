import { useEffect, useRef } from 'react';
import { onDisconnect, onValue, ref, set } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { FirestoreService } from '../services/firestore';

const RealtimePresence = ({ user, profile }) => {
  const currentEmail = FirestoreService.normalizeChatEmail(user?.email);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !currentEmail) return undefined;

    const statusRef = ref(rtdb, `status/${user.id}`);
    const connectedRef = ref(rtdb, '.info/connected');
    const writeFirestoreHeartbeat = async (state = 'online') => {
      try {
        await FirestoreService.updateOwnProfile(user.id, {
          lastActiveAt: new Date().toISOString(),
          presence: {
            state,
            updatedAt: new Date().toISOString(),
            email: currentEmail
          }
        });
      } catch (error) {
        console.warn('[Presence] Failed to write Firestore heartbeat:', error);
      }
    };

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

      writeFirestoreHeartbeat('online');
    });

    heartbeatRef.current = window.setInterval(() => {
      writeFirestoreHeartbeat('online');
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        writeFirestoreHeartbeat('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      unsubscribe?.();
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      set(statusRef, {
        state: 'offline',
        name: user.name || profile?.name || currentEmail || 'StudyOs User',
        email: currentEmail,
        lastChanged: Date.now()
      }).catch(() => void 0);
      writeFirestoreHeartbeat('offline');
    };
  }, [user?.id, user?.name, profile?.name, currentEmail]);

  return null;
};

export default RealtimePresence;
