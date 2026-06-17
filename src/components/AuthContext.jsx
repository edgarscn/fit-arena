import React, { createContext, useContext, useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { syncCloudToLocal } from '../utils/storage';

const AuthContext = createContext({
  user: null,
  loading: true,
  logout: () => Promise.resolve(),
  resendVerification: () => Promise.resolve()
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      const path = window.location.pathname;

      if (currentUser) {
        // Handle migration if needed
        await handleLocalDataMigration(currentUser.uid);
        
        // Sync cloud state to local storage cache
        await syncCloudToLocal(currentUser.uid);

        if (!currentUser.emailVerified) {
          // Redirect to verification page if not verified and not already there
          if (path !== '/verify-email' && path !== '/verify-email/') {
            navigate('/verify-email');
          }
        } else {
          // If verified and trying to access login/verification, go home
          if (path === '/login' || path === '/login/' || path === '/verify-email' || path === '/verify-email/') {
            navigate('/');
          }
        }
      } else {
        // Protected paths
        const protectedPaths = ['/', '/plan', '/plan/', '/workout', '/workout/', '/rewards', '/rewards/', '/history', '/history/'];
        if (protectedPaths.includes(path)) {
          navigate('/login');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Monitor location changes for route protection when user state doesn't change
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;
    
    const path = window.location.pathname;
    if (user) {
      if (!user.emailVerified && path !== '/verify-email' && path !== '/verify-email/') {
        navigate('/verify-email');
      } else if (user.emailVerified && (path === '/login' || path === '/login/' || path === '/verify-email' || path === '/verify-email/')) {
        navigate('/');
      }
    } else {
      const protectedPaths = ['/', '/plan', '/plan/', '/workout', '/workout/', '/rewards', '/rewards/', '/history', '/history/'];
      if (protectedPaths.includes(path)) {
        navigate('/login');
      }
    }
  }, [loading, user]);

  // Migrate localStorage data to Firestore on first signup/login
  const handleLocalDataMigration = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      // If user document already exists in Firestore, data is already migrated or initialized
      if (userSnap.exists()) return;

      // Migrate Weekly Workouts
      const localWorkouts = localStorage.getItem('arena_workouts');
      if (localWorkouts) {
        await setDoc(doc(db, 'users', userId, 'workouts', 'weekly'), JSON.parse(localWorkouts));
      }

      // Migrate Workout Logs
      const localLogs = localStorage.getItem('arena_logs');
      if (localLogs) {
        const parsedLogs = JSON.parse(localLogs);
        // Upload logs to Firestore
        for (const log of parsedLogs) {
          await setDoc(doc(db, 'users', userId, 'logs', log.id), log);
        }
      }

      // Migrate User Stats
      const localStats = localStorage.getItem('arena_stats');
      if (localStats) {
        await setDoc(doc(db, 'users', userId, 'stats', 'progress'), JSON.parse(localStats));
      }

      // Initialize main user profile document
      await setDoc(userRef, {
        migratedAt: new Date().toISOString(),
        email: auth.currentUser?.email
      });

      console.log('Local data migrated to Firestore successfully!');
    } catch (error) {
      console.error('Data migration to Cloud Firestore failed:', error);
    }
  };

  const logout = () => {
    return signOut(auth).then(() => {
      navigate('/login');
    });
  };

  const resendVerification = () => {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    return Promise.reject('No logged in user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, resendVerification }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
