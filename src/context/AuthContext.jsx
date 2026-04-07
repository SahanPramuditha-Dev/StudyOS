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
  deleteUser
} from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../services/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || currentUser.email.split('@')[0]}&background=random`
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
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
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
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
        await deleteUser(auth.currentUser);
        toast.success('Account deleted successfully');
      }
    } catch (error) {
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
        // Update Firebase Auth profile (Name and Avatar only)
        await updateProfile(auth.currentUser, {
          displayName: data.name,
          photoURL: data.avatar
        });

        // Update local user state with all fields
        const updatedUser = {
          ...user,
          ...data,
          id: auth.currentUser.uid,
          email: auth.currentUser.email
        };
        
        setUser(updatedUser);
        
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
      login, 
      signup, 
      logout, 
      loginWithGoogle, 
      updateUserProfile, 
      uploadProfileImage,
      resetPassword,
      deleteAccount,
      loading 
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
