import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { auth, storage } from '../services/firebase';
import { FirestoreService } from '../services/firestore';
import { STORAGE_KEYS, StorageService } from '../services/storage';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';
import * as Sentry from "@sentry/react";

const AuthContext = createContext(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await currentUser.reload();
        const hydratedUser = auth.currentUser || currentUser;
        const userProfile = await FirestoreService.createUserProfile(hydratedUser.uid, {
          email: hydratedUser.email,
          name: hydratedUser.displayName || hydratedUser.email?.split('@')[0] || 'StudyOS User'
        });
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
        toast.error('We could not load your account. Please try again.');
        setUser(null);
        setProfile(null);
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
      const message = error.code === 'auth/user-not-found' ? 'User not found' :
                     error.code === 'auth/wrong-password' ? 'Incorrect password' :
                     error.message;
      toast.error(message);
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
      toast.success(`Account created! Welcome, ${name}`);
      return result.user;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await result.user.reload();
      const refreshedUser = auth.currentUser || result.user;
      const popupProfilePhoto = resolveAvatarFromAuth(refreshedUser) || resolveGooglePopupPhoto(result);
      if (popupProfilePhoto) {
        await updateProfile(refreshedUser, { photoURL: popupProfilePhoto });
        await FirestoreService.updateOwnProfile(refreshedUser.uid, { avatar: popupProfilePhoto });
      }
      toast.success(`Welcome, ${result.user.displayName}!`);
      return result.user;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
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
      toast.error('Error sending reset email');
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
