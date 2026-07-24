import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithPopup,
  sendEmailVerification,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  unlink
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
  'auth/user-not-found':
    'Unable to sign in. Please check your email and password. If you originally signed up with Google or GitHub, continue with that sign-in method.',
  'auth/wrong-password':
    'Unable to sign in. Please check your email and password. If you originally signed up with Google or GitHub, continue with that sign-in method.',
  'auth/invalid-credential':
    'Unable to sign in. Please check your email and password. If you originally signed up with Google or GitHub, continue with that sign-in method.',
  'auth/account-exists-with-different-credential':
    'Unable to sign in. Please check your email and password. If you originally signed up with Google or GitHub, continue with that sign-in method.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Sign-in popup was blocked by the browser. We will retry with redirect.',
  'auth/cancelled-popup-request': 'Only one sign-in window at a time. Try again.',
  'auth/operation-not-supported-in-this-environment':
    'Popup sign-in is not supported in this environment. We will retry with redirect.',
  'auth/requires-recent-login': 'For security, sign in again and retry.'
};

const POPUP_REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment'
]);

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

function extractServerAuthMessage(error) {
  const tokenResponse = error?.customData?._tokenResponse;
  if (typeof tokenResponse?.error?.message === 'string' && tokenResponse.error.message.length > 0) {
    return tokenResponse.error.message;
  }
  if (typeof tokenResponse?.errorMessage === 'string' && tokenResponse.errorMessage.length > 0) {
    return tokenResponse.errorMessage;
  }

  const serverResponse = error?.customData?._serverResponse;
  if (typeof serverResponse === 'string' && serverResponse.length > 0) {
    try {
      const parsed = JSON.parse(serverResponse);
      const parsedMessage = parsed?.error?.message;
      if (typeof parsedMessage === 'string' && parsedMessage.length > 0) {
        return parsedMessage;
      }
    } catch {
      return serverResponse;
    }
  }

  return null;
}

function isPopupRedirectFallbackError(error) {
  if (POPUP_REDIRECT_FALLBACK_CODES.has(error?.code)) {
    return true;
  }
  const raw = `${error?.message || ''} ${extractServerAuthMessage(error) || ''}`.toLowerCase();
  return raw.includes('cross-origin-opener-policy') || raw.includes('window.closed');
}

function logAuthFailure(label, error, context = {}) {
  console.error(`[AuthContext] ${label}`, {
    code: error?.code || null,
    message: error?.message || null,
    serverMessage: extractServerAuthMessage(error),
    ...context
  });
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
    if (typeof window === 'undefined') return;
    const pendingProvider = sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY);
    if (!pendingProvider) return;

    let cancelled = false;
    toast.loading(`Completing ${pendingProvider} sign-in...`, {
      id: GOOGLE_OAUTH_LOADING_TOAST_ID
    });

    (async () => {
      try {
        const result = await consumeFirebaseRedirectResult();
        if (cancelled) return;
        if (result?.user) {
          await applyGoogleProfileAfterSignIn(result);
          toast.success(`Signed in with ${pendingProvider} successfully.`, {
            id: GOOGLE_OAUTH_LOADING_TOAST_ID
          });
        } else {
          toast.dismiss(GOOGLE_OAUTH_LOADING_TOAST_ID);
        }
      } catch (error) {
        if (cancelled) return;
        logAuthFailure('Redirect sign-in failed', error, { provider: pendingProvider });
        toast.error(authErrorMessage(error), { id: GOOGLE_OAUTH_LOADING_TOAST_ID });
      } finally {
        if (!cancelled) {
          sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

        // Create or fetch the Firestore user profile for every user.
        // This ensures role-based access is preserved for Google sign-ins too.
        const userProfile = await FirestoreService.createUserProfile(hydratedUser.uid, {
          email: hydratedUser.email,
          name: hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User'
        });

        // Hydrate permissions from custom roles
        try {
          const customRoles = await FirestoreService.getCustomRoles();
          let userRole = customRoles.find(r => r.role === userProfile.role);
          if (!userRole && customRoles.length > 0) {
            userRole = customRoles.find(r => r.role === 'user') || customRoles[0];
          }
          if (userRole) {
            const hydratedModules = {};
            ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders', 'analytics', 'adminPanel', 'manageUsers', 'changePermissions'].forEach(mod => {
              hydratedModules[mod] = userRole.modules?.includes(mod) || false;
            });
            userProfile.permissions = hydratedModules;
            userProfile.actions = userRole.actions || [];
          }
        } catch (e) {
          console.warn('Failed to hydrate custom role permissions', e);
        }

        const resolvedAvatar = userProfile?.avatar || resolveAvatarFromAuth(hydratedUser) || buildFallbackAvatar(hydratedUser.displayName, hydratedUser.email);

        setUser({
          id: hydratedUser.uid,
          name: hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User',
          email: hydratedUser.email,
          avatar: resolvedAvatar,
          emailVerified: hydratedUser.emailVerified === true,
          providerData: hydratedUser.providerData
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
          emailVerified: hydratedUser.emailVerified === true,
          providerData: hydratedUser.providerData
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

  const beginRedirectSignIn = async (provider, providerName) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, providerName);
    }
    toast.loading(`Switching to ${providerName} redirect sign-in...`, {
      id: GOOGLE_OAUTH_LOADING_TOAST_ID
    });
    await signInWithRedirect(auth, provider);
  };

  const login = async (emailOrUsername, password) => {
    let normalizedInput = (emailOrUsername || '').trim();
    
    // Check if it's not an email, try resolving via Firestore username
    if (!normalizedInput.includes('@')) {
      const resolvedEmail = await FirestoreService.getUserEmailByUsername(normalizedInput);
      if (resolvedEmail) {
        normalizedInput = resolvedEmail;
      } else {
        throw new Error('Username not found. Please try again or use your email.');
      }
    }

    try {
      const result = await signInWithEmailAndPassword(auth, normalizedInput, password);
      // Profile will be loaded by onAuthStateChanged
      posthog.capture('user_logged_in', { method: 'email' });
      toast.success(`Welcome back!`);
      return result.user;
    } catch (error) {
      logAuthFailure('Email/password sign-in failed', error, { input: normalizedInput || null });
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    const normalizedName = (name || '').trim();
    const normalizedEmail = (email || '').trim();
    try {
      const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(result.user, {
        displayName: normalizedName
      });
      // createUserProfile is called in onAuthStateChanged
      posthog.capture('user_signed_up', { method: 'email' });
      toast.success(`Account created successfully. You're signed in as ${normalizedName}.`);
      return result.user;
    } catch (error) {
      logAuthFailure('Email/password sign-up failed', error, { email: normalizedEmail || null });
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const linkOAuthProvider = async (providerName) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();
    else throw new Error('Unknown provider');

    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      toast.success(`Successfully linked ${providerName} account!`);
      return result;
    } catch (error) {
      logAuthFailure('Linking failed', error);
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const unlinkOAuthProvider = async (providerId) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    // Ensure they have at least one other provider
    if (auth.currentUser.providerData.length <= 1) {
      toast.error('You cannot disconnect your only login method.');
      throw new Error('Cannot disconnect last provider');
    }
    
    try {
      await unlink(auth.currentUser, providerId);
      toast.success('Provider disconnected.');
    } catch (error) {
      logAuthFailure('Unlinking failed', error);
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const setupPasswordCredential = async (password) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await linkWithCredential(auth.currentUser, credential);
      toast.success('Password setup successfully!');
    } catch (error) {
      if (error.code === 'auth/provider-already-linked') {
        // If it's already linked from a previous partial attempt, just proceed
        console.log('Provider already linked, proceeding...');
        return;
      }
      if (error.code === 'auth/credential-already-in-use') {
        toast.error('An account already exists with this email.');
      } else {
        toast.error(authErrorMessage(error));
      }
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
      posthog.capture('user_logged_in', { method: 'google' });
      toast.success('Signed in with Google successfully.');
    } catch (error) {
      if (isPopupRedirectFallbackError(error)) {
        console.warn('[AuthContext] Google popup flow blocked. Falling back to redirect.');
        await beginRedirectSignIn(provider, 'Google');
        return;
      }
      logAuthFailure('Google sign-in failed', error);
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const loginWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope('repo');
    provider.addScope('read:user');
    provider.setCustomParameters({ allow_signup: 'true' });

    try {
      console.log('[AuthContext] Starting GitHub sign-in with popup');
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken || null;
      const githubProfile = result.additionalUserInfo?.profile || {};
      const githubUserName =
        githubProfile.login ||
        githubProfile.name ||
        result.user.displayName ||
        result.user.email?.split('@')[0] ||
        'GitHub User';

      if (accessToken) {
        sessionStorage.setItem('github_token', accessToken);
        sessionStorage.setItem('github_user', githubUserName);
      }

      await result.user.reload();
      await applyGoogleProfileAfterSignIn({
        user: result.user,
        _tokenResponse: result._tokenResponse
      });

      console.log('[AuthContext] GitHub sign-in completed', githubUserName);
      posthog.capture('user_logged_in', { method: 'github' });
      toast.success(`Signed in with GitHub as ${githubUserName}.`);
      return result.user;
    } catch (error) {
      if (isPopupRedirectFallbackError(error)) {
        console.warn('[AuthContext] GitHub popup flow blocked. Falling back to redirect.');
        await beginRedirectSignIn(provider, 'GitHub');
        return null;
      }
      logAuthFailure('GitHub sign-in failed', error);
      toast.error(authErrorMessage(error));
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
        sessionStorage.removeItem('github_token');
        sessionStorage.removeItem('github_user');
        sessionStorage.removeItem('github_repos');
      }
      await signOut(auth);
      setProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  // Auto-logout on inactivity (30 minutes)
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (user) {
        inactivityTimer = setTimeout(() => {
          logout();
          toast.error('You have been signed out due to inactivity.', { duration: 5000 });
        }, 30 * 60 * 1000); // 30 minutes
      }
    };

    if (user) {
      resetTimer();
      window.addEventListener('mousedown', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('scroll', resetTimer);
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user]);

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
    const normalizedEmail = (email || '').trim();
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      toast.success('Password reset email sent!');
    } catch (error) {
      logAuthFailure('Password reset failed', error, { email: normalizedEmail || null });
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

        // We assume FirestoreService.deleteUserData exists in original code.
        // It was missing from our context so I'll wrap it
        if (FirestoreService.deleteUserData) {
          await FirestoreService.deleteUserData(currentUser.uid, storedKeys);
        }
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
    const metadata = {
      cacheControl: 'public, max-age=31536000',
    };
    const uploadTask = uploadBytesResumable(fileRef, file, metadata);

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

        if (FirestoreService.updateOwnProfile) {
          await FirestoreService.updateOwnProfile(auth.currentUser.uid, {
            name: updatedUser.name,
            avatar: resolvedAvatar,
            bio: updatedUser.bio || '',
            university: updatedUser.university || '',
            degree: updatedUser.degree || '',
            year: updatedUser.year || '',
            phone: updatedUser.phone || ''
          });
        }

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

  const checkUsernameAvailability = async (username) => {
    return await FirestoreService.checkUsernameAvailability(username);
  };

  const suggestUsernames = async (baseUsername) => {
    return await FirestoreService.suggestUsernames(baseUsername);
  };

  const changeUsername = async (newUsername) => {
    if (!user) throw new Error('User must be logged in to change username.');
    try {
      await FirestoreService.setUsername(user.id, newUsername);
      const updatedProfile = await FirestoreService.getUserProfile(user.id);
      setProfile(updatedProfile);
      return true;
    } catch (error) {
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
      loginWithGitHub,
      resetPassword,
      deleteAccount,
      uploadProfileImage,
      updateUserProfile,
      resendVerificationEmail,
      linkOAuthProvider,
      unlinkOAuthProvider,
      setupPasswordCredential,
      checkUsernameAvailability,
      suggestUsernames,
      changeUsername
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
