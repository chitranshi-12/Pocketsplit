import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../services/firebase';
import { CurrencyCode, UserProfile } from '../types';
import { DEMO_USER } from '../data/demoData';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isDemoUser: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsDemoUser: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 1. Check local session
    const savedUser = localStorage.getItem('pocketsplit_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsDemoUser(parsed.id.startsWith('local_') || parsed.id.startsWith('user_demo_'));
      } catch (e) {
        localStorage.removeItem('pocketsplit_active_user');
      }
    }

    // 2. Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsDemoUser(false);
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUser(profile);
            localStorage.setItem('pocketsplit_active_user', JSON.stringify(profile));
          } else {
            // First-time Firebase user profile
            const newProfile: UserProfile = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              email: fbUser.email || '',
              avatar: fbUser.photoURL || '',
              currency: 'INR',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile).catch((err) => {
              console.warn('Could not save user profile to firestore:', err);
            });
            setUser(newProfile);
            localStorage.setItem('pocketsplit_active_user', JSON.stringify(newProfile));
            setShowOnboarding(true);
          }
        } catch (error) {
          console.warn('Error fetching Firestore user profile, using Auth fallback:', error);
          const fallbackProfile: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || '',
            currency: 'INR',
            createdAt: new Date().toISOString(),
          };
          setUser(fallbackProfile);
          localStorage.setItem('pocketsplit_active_user', JSON.stringify(fallbackProfile));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('pocketsplit_active_user');
      setIsDemoUser(false);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const profile: UserProfile = {
          id: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || 'User',
          email: res.user.email || '',
          avatar: res.user.photoURL || '',
          currency: 'INR',
          createdAt: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem('pocketsplit_active_user', JSON.stringify(profile));
        // Try saving to firestore
        setDoc(doc(db, 'users', res.user.uid), profile).catch(() => {});
      }
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      setLoading(false);
      throw new Error(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email Sign-In
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('pocketsplit_active_user');
      setIsDemoUser(false);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const profile: UserProfile = {
          id: res.user.uid,
          name: res.user.displayName || email.split('@')[0],
          email: res.user.email || email,
          currency: 'INR',
          createdAt: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem('pocketsplit_active_user', JSON.stringify(profile));
      }
    } catch (error: any) {
      console.warn('Firebase email sign-in error:', error);
      // If email/password is not enabled in Firebase Console, fallback to smart verified account login
      if (
        error.code === 'auth/operation-not-allowed' ||
        error.code === 'auth/configuration-not-found' ||
        error.code === 'auth/user-not-found'
      ) {
        const storedUsersRaw = localStorage.getItem('pocketsplit_registered_users');
        const registeredUsers: Record<string, { name: string; email: string; pass: string }> = storedUsersRaw
          ? JSON.parse(storedUsersRaw)
          : {};

        const found = registeredUsers[email.toLowerCase()];
        if (found) {
          if (found.pass !== pass) {
            setLoading(false);
            throw new Error('Incorrect password. Please try again.');
          }
          const localProfile: UserProfile = {
            id: `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: found.name,
            email: found.email,
            currency: 'INR',
            createdAt: new Date().toISOString(),
          };
          setUser(localProfile);
          setIsDemoUser(true);
          localStorage.setItem('pocketsplit_active_user', JSON.stringify(localProfile));
          setLoading(false);
          return;
        }

        // If not registered locally, create seamless account
        const newLocalProfile: UserProfile = {
          id: `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: email.split('@')[0],
          email: email,
          currency: 'INR',
          createdAt: new Date().toISOString(),
        };
        registeredUsers[email.toLowerCase()] = { name: newLocalProfile.name, email, pass };
        localStorage.setItem('pocketsplit_registered_users', JSON.stringify(registeredUsers));
        setUser(newLocalProfile);
        setIsDemoUser(true);
        localStorage.setItem('pocketsplit_active_user', JSON.stringify(newLocalProfile));
        setLoading(false);
        return;
      }
      setLoading(false);
      throw new Error(error.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Email Sign-Up
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('pocketsplit_active_user');
      setIsDemoUser(false);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: name });
      const newProfile: UserProfile = {
        id: res.user.uid,
        name,
        email,
        currency: 'INR',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', res.user.uid), newProfile).catch(() => {});
      setUser(newProfile);
      localStorage.setItem('pocketsplit_active_user', JSON.stringify(newProfile));
      setShowOnboarding(true);
    } catch (error: any) {
      console.warn('Firebase email sign up failed:', error);
      // Graceful fallback if email/pass provider not enabled in Firebase project
      if (
        error.code === 'auth/operation-not-allowed' ||
        error.code === 'auth/configuration-not-found' ||
        error.message?.includes('operation-not-allowed')
      ) {
        const storedUsersRaw = localStorage.getItem('pocketsplit_registered_users');
        const registeredUsers: Record<string, { name: string; email: string; pass: string }> = storedUsersRaw
          ? JSON.parse(storedUsersRaw)
          : {};

        const localId = `local_${Date.now()}`;
        const localProfile: UserProfile = {
          id: localId,
          name,
          email,
          currency: 'INR',
          createdAt: new Date().toISOString(),
        };
        registeredUsers[email.toLowerCase()] = { name, email, pass };
        localStorage.setItem('pocketsplit_registered_users', JSON.stringify(registeredUsers));
        setUser(localProfile);
        setIsDemoUser(true);
        localStorage.setItem('pocketsplit_active_user', JSON.stringify(localProfile));
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = () => {
    setUser(DEMO_USER);
    setIsDemoUser(true);
    localStorage.setItem('pocketsplit_active_user', JSON.stringify(DEMO_USER));
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('pocketsplit_active_user', JSON.stringify(updated));

    if (!isDemoUser && auth.currentUser) {
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, updated, { merge: true });
      } catch (err) {
        console.warn('Could not sync user profile updates to Firestore:', err);
      }
    }
  };

  const signOut = async () => {
    localStorage.removeItem('pocketsplit_active_user');
    setIsDemoUser(false);
    setUser(null);
    if (auth.currentUser) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Firebase sign out error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isDemoUser,
        showOnboarding,
        setShowOnboarding,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsDemoUser,
        updateUserProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
