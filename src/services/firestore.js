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
  addDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from './firebase';
import { computeUsageMetrics } from './usageMetrics';

/**
 * FirestoreService handles cloud data persistence for StudyOs.
 * All data is scoped under the user's unique ID (uid).
 */
class FirestoreService {
  /**
   * Default user profile shape (Firestore + client fallback when cloud init fails).
   */
  static buildDefaultUserProfile(userId, profileData) {
    const now = new Date().toISOString();
    return {
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
      createdAt: now,
      lastLogin: now
    };
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
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const defaultProfile = FirestoreService.buildDefaultUserProfile(userId, profileData);
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

  static async getUsersByEmails(emails = []) {
    const normalizedEmails = [...new Set(
      (emails || []).map(FirestoreService.normalizeChatEmail).filter(Boolean)
    )];

    if (normalizedEmails.length === 0) return [];

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
      await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
      const actor = auth.currentUser ? auth.currentUser.uid : null;
      try {
        await addDoc(collection(db, 'audit_logs'), {
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

  static normalizeChatEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  static chatEmailKey(email) {
    return FirestoreService.normalizeChatEmail(email).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  static chatReactionKey(reaction = 'thumbsUp') {
    return String(reaction || 'thumbsUp').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || 'thumbsUp';
  }

  static extractChatMentions(text = '', memberEmails = [], senderEmail = '') {
    const normalizedText = String(text || '').toLowerCase();
    const normalizedSender = FirestoreService.normalizeChatEmail(senderEmail);
    const normalizedMembers = [...new Set((memberEmails || [])
      .map(FirestoreService.normalizeChatEmail)
      .filter(Boolean))];

    if (!normalizedText || normalizedMembers.length === 0) {
      return [];
    }

    if (normalizedText.includes('@all') || normalizedText.includes('@everyone')) {
      return normalizedMembers.filter((email) => email !== normalizedSender);
    }

    const matched = new Set();
    normalizedMembers.forEach((email) => {
      const localPart = email.split('@')[0] || '';
      const alias = localPart.replace(/[^a-z0-9]+/g, '');
      const tokens = [
        `@${email}`,
        `@${localPart}`,
        `@${alias}`
      ].filter((token) => token !== '@');

      if (tokens.some((token) => token && normalizedText.includes(token))) {
        matched.add(email);
      }
    });

    return [...matched].filter((email) => email !== normalizedSender);
  }

  static chatRoomCollection() {
    return collection(db, 'chat_rooms');
  }

  static chatMessagesCollection(roomId) {
    return collection(db, 'chat_rooms', roomId, 'messages');
  }

  static async createChatRoom({
    title,
    memberEmails = [],
    createdByUid,
    createdByEmail,
    roomType = 'group',
    contextType = 'general',
    contextId = '',
    contextLabel = ''
  }) {
    const normalizedCreatorEmail = FirestoreService.normalizeChatEmail(createdByEmail);
    const normalizedMembers = [...new Set(
      [...memberEmails, normalizedCreatorEmail]
        .map(FirestoreService.normalizeChatEmail)
        .filter(Boolean)
    )];

    if (!createdByUid || !normalizedCreatorEmail) {
      throw new Error('Missing creator identity for chat room');
    }

    if (String(roomType) === 'direct' && normalizedMembers.length === 2) {
      const q = query(
        FirestoreService.chatRoomCollection(),
        where('roomType', '==', 'direct'),
        where('memberEmails', 'array-contains', normalizedCreatorEmail)
      );

      const snapshot = await getDocs(q);
      const existingRoom = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((room) => {
          const existingMembers = [...new Set(
            (room.memberEmails || []).map(FirestoreService.normalizeChatEmail).filter(Boolean)
          )].sort();
          const nextMembers = [...normalizedMembers].sort();
          return existingMembers.length === nextMembers.length &&
            existingMembers.every((email, index) => email === nextMembers[index]);
        });

      if (existingRoom) {
        return { ...existingRoom, existed: true };
      }
    }

    const payload = {
      title: String(
        title ||
        (String(roomType) === 'direct'
          ? `Direct message with ${normalizedMembers.find((email) => email !== normalizedCreatorEmail) || 'member'}`
          : 'Study Group')
      ).trim().slice(0, 80) || 'Study Group',
      roomType: ['group', 'direct'].includes(String(roomType)) ? String(roomType) : 'group',
      createdByUid,
      createdByEmail: normalizedCreatorEmail,
      memberEmails: normalizedMembers,
      roomAdminEmails: [normalizedCreatorEmail],
      inviteCode: roomType === 'group' ? FirestoreService.generateChatInviteCode() : '',
      contextType: String(contextType || 'general'),
      contextId: String(contextId || ''),
      contextLabel: String(contextLabel || ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: '',
      lastMessageAt: null,
      lastMessageSenderEmail: normalizedCreatorEmail,
      lastMessageSenderUid: createdByUid,
      lastMessageHasAttachments: false,
      lastMessageAttachmentCount: 0,
      lastMessageMentionEmails: [],
      archivedByEmails: [],
      lastReadAtByEmail: {
        [FirestoreService.chatEmailKey(normalizedCreatorEmail)]: new Date().toISOString()
      }
    };

    const docRef = await addDoc(FirestoreService.chatRoomCollection(), payload);
    return { id: docRef.id, ...payload };
  }

  static generateChatInviteCode(length = 12) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint32Array(length);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < length; index += 1) {
        bytes[index] = Math.floor(Math.random() * alphabet.length);
      }
    }
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  }

  static buildChatInviteLink(roomId, inviteCode) {
    if (!roomId || !inviteCode) return '';
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin);
    url.pathname = window.location.pathname;
    url.searchParams.set('join', `${roomId}:${inviteCode}`);
    return url.toString();
  }

  static async ensureChatRoomInviteCode(roomId) {
    if (!roomId) return '';
    const roomRef = doc(db, 'chat_rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('Chat room not found');
    }

    const currentCode = String(roomSnap.data()?.inviteCode || '').trim();
    const inviteCode = currentCode || FirestoreService.generateChatInviteCode();
    if (!currentCode) {
      await updateDoc(roomRef, {
        inviteCode,
        updatedAt: new Date().toISOString()
      });
    }

    return inviteCode;
  }

  static async addChatRoomMembers(roomId, memberEmails = []) {
    const normalizedMembers = [...new Set(
      (memberEmails || [])
        .map(FirestoreService.normalizeChatEmail)
        .filter(Boolean)
    )];

    if (!roomId || normalizedMembers.length === 0) {
      return;
    }

    const roomRef = doc(db, 'chat_rooms', roomId);
    await updateDoc(roomRef, {
      memberEmails: arrayUnion(...normalizedMembers),
      updatedAt: new Date().toISOString()
    });
  }

  static async promoteChatRoomMember(roomId, memberEmail = '') {
    const normalizedEmail = FirestoreService.normalizeChatEmail(memberEmail);
    if (!roomId || !normalizedEmail) return;

    const roomRef = doc(db, 'chat_rooms', roomId);
    await updateDoc(roomRef, {
      roomAdminEmails: arrayUnion(normalizedEmail),
      updatedAt: new Date().toISOString()
    });
  }

  static async removeChatRoomMember(roomId, memberEmail = '') {
    const normalizedEmail = FirestoreService.normalizeChatEmail(memberEmail);
    if (!roomId || !normalizedEmail) return;

    const roomRef = doc(db, 'chat_rooms', roomId);
    await updateDoc(roomRef, {
      memberEmails: arrayRemove(normalizedEmail),
      roomAdminEmails: arrayRemove(normalizedEmail),
      updatedAt: new Date().toISOString()
    });
  }

  static async joinChatRoomByInviteCode(roomId, inviteCode, memberEmail = '') {
    const normalizedEmail = FirestoreService.normalizeChatEmail(memberEmail);
    if (!roomId || !inviteCode || !normalizedEmail) {
      throw new Error('Missing invite details');
    }

    const roomRef = doc(db, 'chat_rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('Chat room not found');
    }

    const room = roomSnap.data();
    if (room?.roomType !== 'group') {
      throw new Error('Invite links are only available for group rooms');
    }

    const currentCode = String(room?.inviteCode || '').trim();
    if (!currentCode || currentCode !== String(inviteCode).trim()) {
      throw new Error('This invite link is no longer valid');
    }

    const alreadyJoined = (room?.memberEmails || [])
      .map(FirestoreService.normalizeChatEmail)
      .includes(normalizedEmail);
    if (alreadyJoined) {
      return room;
    }

    await updateDoc(roomRef, {
      memberEmails: arrayUnion(normalizedEmail),
      [`lastReadAtByEmail.${FirestoreService.chatEmailKey(normalizedEmail)}`]: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static subscribeToMyChatRooms(userEmail, callback) {
    const normalizedEmail = FirestoreService.normalizeChatEmail(userEmail);
    if (!normalizedEmail) return () => {};

    const q = query(
      FirestoreService.chatRoomCollection(),
      where('memberEmails', 'array-contains', normalizedEmail)
    );

    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      callback(rooms);
    });
  }

  static subscribeToChatMessages(roomId, callback) {
    if (!roomId) return () => {};

    const q = query(
      FirestoreService.chatMessagesCollection(roomId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }

  static async sendChatMessage(roomId, {
    text,
    senderUid,
    senderEmail,
    senderName = '',
    senderAvatar = '',
    attachments = [],
    replyToMessageId = '',
    replyToText = '',
    replyToSenderName = '',
    replyToSenderEmail = ''
  }) {
    const normalizedEmail = FirestoreService.normalizeChatEmail(senderEmail);
    if (!roomId || !senderUid || !normalizedEmail) {
      throw new Error('Missing message metadata');
    }

    const payload = {
      text: String(text || '').trim(),
      senderUid,
      senderEmail: normalizedEmail,
      senderName: senderName || 'StudyOs User',
      senderAvatar: senderAvatar || '',
      attachments,
      replyToMessageId: String(replyToMessageId || ''),
      replyToText: String(replyToText || ''),
      replyToSenderName: String(replyToSenderName || ''),
      replyToSenderEmail: String(replyToSenderEmail || ''),
      reactions: {
        thumbsUp: [],
        heart: [],
        laugh: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let messageRef = null;
    try {
      const roomRef = doc(db, 'chat_rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      const room = roomSnap.exists() ? roomSnap.data() : null;
      const mentionEmails = FirestoreService.extractChatMentions(text, room?.memberEmails || [], normalizedEmail);
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      const trimmedText = String(text || '').trim();
      const roomPreviewText = trimmedText
        ? trimmedText.slice(0, 240)
        : (hasAttachments ? `Shared ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}` : '');
      messageRef = await addDoc(FirestoreService.chatMessagesCollection(roomId), payload);
      try {
        await updateDoc(roomRef, {
          lastMessage: roomPreviewText,
          lastMessageAt: new Date().toISOString(),
          lastMessageSenderEmail: normalizedEmail,
          lastMessageSenderUid: senderUid,
          lastMessageHasAttachments: hasAttachments,
          lastMessageAttachmentCount: hasAttachments ? attachments.length : 0,
          lastMessageMentionEmails: mentionEmails,
          updatedAt: new Date().toISOString(),
          [`lastReadAtByEmail.${FirestoreService.chatEmailKey(normalizedEmail)}`]: new Date().toISOString()
        });
      } catch (error) {
        if (error?.code !== 'permission-denied') {
          throw error;
        }
        console.warn('[FirestoreService] Failed to update chat room metadata after sending message:', error);
      }
      return messageRef;
    } catch (error) {
      if (error?.code === 'permission-denied') {
        throw new Error('Chat access is not enabled for this account yet or you are not a member of this room. Please ask an admin to deploy the latest chat rules.');
      }
      throw error;
    }
  }

  static async toggleChatReaction(roomId, messageId, reaction, userEmail) {
    const normalizedEmail = FirestoreService.normalizeChatEmail(userEmail);
    const reactionKey = FirestoreService.chatReactionKey(reaction);
    if (!roomId || !messageId || !normalizedEmail || !reactionKey) return;

    const messageRef = doc(db, 'chat_rooms', roomId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) {
      throw new Error('Message not found');
    }

    const current = messageSnap.data()?.reactions?.[reactionKey] || [];
    const hasReacted = Array.isArray(current) && current.includes(normalizedEmail);

    await updateDoc(messageRef, {
      [`reactions.${reactionKey}`]: hasReacted ? arrayRemove(normalizedEmail) : arrayUnion(normalizedEmail),
      updatedAt: new Date().toISOString()
    });
  }

  static async markChatRoomRead(roomId, userEmail) {
    const normalizedEmail = FirestoreService.normalizeChatEmail(userEmail);
    if (!roomId || !normalizedEmail) return;

    await updateDoc(doc(db, 'chat_rooms', roomId), {
      [`lastReadAtByEmail.${FirestoreService.chatEmailKey(normalizedEmail)}`]: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

export { FirestoreService };
