import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { auth, storage, consumeFirebaseRedirectResult } from '../services/firebase';
import { FirestoreService } from '../services/firestore';
import { STORAGE_KEYS, StorageService } from '../services/storage';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';
import * as Sentry from "@sentry/react";

const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account already exists with this email. Try signing in instead.',
  'auth/invalid-email': 'That email address does not look valid.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/operation-not-allowed': 'Email/password sign-up is not enabled. Contact support.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Only one sign-in window at a time. Try again.',
  'auth/requires-recent-login': 'For security, sign in again and retry.'
};

export function authErrorMessage(error) {
  const code = error?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  const raw = error?.message;
  if (typeof raw === 'string' && raw.length > 0 && !/^Firebase:\s*Error/i.test(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    const m = raw.match(/\((auth\/[^)]+)\)/);
    if (m && AUTH_ERROR_MESSAGES[m[1]]) {
      return AUTH_ERROR_MESSAGES[m[1]];
    }
  }
  return 'Something went wrong. Please try again.';
}

function sessionInitErrorMessage(error) {
  const code = error?.code;
  if (code === 'permission-denied') {
    return 'We could not set up your profile (access denied). If this continues, contact support.';
  }
  if (code === 'unavailable') {
    return 'Cloud service is temporarily unavailable. Try again in a moment.';
  }
  const msg = error?.message;
  if (typeof msg === 'string' && msg.length > 0) {
    return msg;
  }
  return 'We could not load your account. Please try again.';
}

export const GOOGLE_REDIRECT_PENDING_KEY = 'studyos_google_redirect_pending';
const GOOGLE_OAUTH_LOADING_TOAST_ID = 'studyos-google-oauth';

const AuthContext = createContext(null);

const buildFallbackAvatar = (displayName, email) => {
  const label = displayName || email?.split('@')[0] || 'StudyOS User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=0f172a&color=ffffff`;
};

const getGoogleProviderPhoto = (firebaseUser) => {
  const googleProvider = firebaseUser?.providerData?.find((provider) => provider?.providerId === 'google.com');
  return googleProvider?.photoURL || null;
};

const resolveAvatarFromAuth = (firebaseUser) => {
  const googlePhoto = getGoogleProviderPhoto(firebaseUser);
  if (googlePhoto) return googlePhoto;
  if (firebaseUser?.photoURL) return firebaseUser.photoURL;
  if (firebaseUser?.reloadUserInfo?.photoUrl) return firebaseUser.reloadUserInfo.photoUrl;
  return null;
};

const resolveGooglePopupPhoto = (result) => {
  const rawUserInfo = result?._tokenResponse?.rawUserInfo;
  if (!rawUserInfo) return null;
  try {
    const parsed = JSON.parse(rawUserInfo);
    return parsed?.picture || null;
  } catch {
    return null;
  }
};

async function applyGoogleProfileAfterSignIn(result) {
  if (!result?.user) return;
  await result.user.reload();
  const refreshedUser = auth.currentUser || result.user;
  const profilePhoto = resolveAvatarFromAuth(refreshedUser) || resolveGooglePopupPhoto(result);
  if (profilePhoto) {
    await updateProfile(refreshedUser, { photoURL: profilePhoto });
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user context to Sentry and PostHog
  useEffect(() => {
    if (user) {
      // 1. PostHog Identify
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: profile?.role
      });
      
      // 2. Sentry Set User
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name
      });
    } else {
      posthog.reset();
      Sentry.setUser(null);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      let hydratedUser = currentUser;
      try {
        await currentUser.reload();
        hydratedUser = auth.currentUser || currentUser;

        // Check if user is signing in with Google
        const isGoogleUser = hydratedUser.providerData?.some(
          (provider) => provider.providerId === 'google.com'
        );

        let userProfile;
        if (isGoogleUser) {
          // For Google users, create a minimal profile without Firestore call
          userProfile = FirestoreService.buildDefaultUserProfile(hydratedUser.uid, {
            email: hydratedUser.email,
            name: hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User'
          });
          console.log('[AuthContext] Using minimal profile for Google user');
        } else {
          // For email/password users, require Firestore profile
          userProfile = await FirestoreService.createUserProfile(hydratedUser.uid, {
            email: hydratedUser.email,
            name: hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User'
          });
        }

        const resolvedAvatar = userProfile?.avatar || resolveAvatarFromAuth(hydratedUser) || buildFallbackAvatar(hydratedUser.displayName, hydratedUser.email);

        setUser({
          id: hydratedUser.uid,
          name: hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User',
          email: hydratedUser.email,
          avatar: resolvedAvatar,
          emailVerified: hydratedUser.emailVerified === true
        });
        setProfile(userProfile);
      } catch (error) {
        console.error('[AuthContext] Failed to initialize session:', error);
        toast.dismiss(GOOGLE_OAUTH_LOADING_TOAST_ID);
        const displayName =
          hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User';
        const fallbackProfile = FirestoreService.buildDefaultUserProfile(hydratedUser.uid, {
          email: hydratedUser.email,
          name: displayName
        });
        setUser({
          id: hydratedUser.uid,
          name: displayName,
          email: hydratedUser.email,
          avatar: resolveAvatarFromAuth(hydratedUser) || buildFallbackAvatar(displayName, hydratedUser.email),
          emailVerified: hydratedUser.emailVerified === true
        });
        setProfile(fallbackProfile);
        toast.error(
          `${sessionInitErrorMessage(error)} You stay signed in; try refreshing in a moment or contact support if cloud sync keeps failing.`,
          { duration: 8000 }
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  const hasPermission = (module) => {
    if (isSuperAdmin) return true;
    if (!profile?.permissions) return true;
    if (profile.permissions?.modules) {
      return profile.permissions.modules[module] === true;
    }
    return profile.permissions[module] === true;
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Profile will be loaded by onAuthStateChanged
      toast.success(`Welcome back!`);
      return result.user;
    } catch (error) {
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, {
        displayName: name
      });
      // createUserProfile is called in onAuthStateChanged
      toast.success(`Account created successfully. You're signed in as ${name}.`);
      return result.user;
    } catch (error) {
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('[AuthContext] Starting Google sign-in with popup');
      const result = await signInWithPopup(auth, provider);
      console.log('[AuthContext] SUCCESS: Google sign-in completed', result.user.email);
      await applyGoogleProfileAfterSignIn(result);
      console.log('[AuthContext] Google profile applied successfully');
      toast.success('Signed in with Google successfully.');
    } catch (error) {
      console.error('[AuthContext] ERROR:', error.code, error.message);
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
      }
      await signOut(auth);
      setProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Verification email sent');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (auth.currentUser) {
        const currentUser = auth.currentUser;
        const storageRootRef = ref(storage, `users/${currentUser.uid}`);
        const storedKeys = Object.values(STORAGE_KEYS);

        try {
          const storageItems = await listAll(storageRootRef);
          await Promise.all(storageItems.items.map((itemRef) => deleteObject(itemRef)));
        } catch (storageError) {
          console.warn('[AuthContext] Unable to fully clear storage during account deletion:', storageError);
        }

        await FirestoreService.deleteUserData(currentUser.uid, storedKeys);
        await deleteUser(auth.currentUser);
        StorageService.clear();
        setUser(null);
        setProfile(null);
        toast.success('Account deleted successfully');
      }
    } catch (error) {
      if (error.code === 'auth/requires-recent-login' && auth.currentUser) {
        try {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(auth.currentUser, provider);
          return deleteAccount();
        } catch (reauthError) {
          console.error('[AuthContext] Re-authentication failed:', reauthError);
        }
      }

      toast.error('Please re-authenticate to delete your account');
      throw error;
    }
  };

  const uploadProfileImage = async (file) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    const fileRef = ref(storage, `users/${auth.currentUser.uid}/profile_${Date.now()}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        null, 
        (error) => {
          toast.error('Upload failed');
          reject(error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const updateUserProfile = async (data) => {
    try {
      if (auth.currentUser) {
        const resolvedAvatar = data.avatar || resolveAvatarFromAuth(auth.currentUser) || buildFallbackAvatar(auth.currentUser.displayName, auth.currentUser.email);

        // Update Firebase Auth profile (Name and Avatar only)
        await updateProfile(auth.currentUser, {
          displayName: data.name,
          photoURL: resolvedAvatar
        });

        // Update local user state with all fields
        const updatedUser = {
          ...user,
          ...data,
          avatar: resolvedAvatar,
          id: auth.currentUser.uid,
          email: auth.currentUser.email
        };

        await FirestoreService.updateOwnProfile(auth.currentUser.uid, {
          name: updatedUser.name,
          avatar: resolvedAvatar,
          bio: updatedUser.bio || '',
          university: updatedUser.university || '',
          degree: updatedUser.degree || '',
          year: updatedUser.year || '',
          phone: updatedUser.phone || ''
        });

        setUser(updatedUser);
        setProfile((prev) => ({
          ...prev,
          ...data,
          name: updatedUser.name,
          email: auth.currentUser.email
        }));

        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Error updating profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAdmin, 
      isSuperAdmin,
      hasPermission,
      loading, 
      login, 
      signup, 
      logout, 
      loginWithGoogle,
      resetPassword,
      deleteAccount,
      uploadProfileImage,
      updateUserProfile,
      resendVerificationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
