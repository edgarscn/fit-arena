// Local Storage & Cloud Firestore utilities for Arena Fitness Tracker
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const KEYS = {
  WORKOUTS: 'arena_workouts',
  LOGS: 'arena_logs',
  STATS: 'arena_stats',
};

const DEFAULT_WORKOUTS = {
  'Segunda': [],
  'Terça': [],
  'Quarta': [],
  'Quinta': [],
  'Sexta': [],
  'Sábado': [],
  'Domingo': []
};

const DEFAULT_STATS = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  badges: []
};

// Safe JSON parser/serializer for localStorage
const getJSON = (key, defaultValue) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading key ${key} from localStorage`, e);
    return defaultValue;
  }
};

const setJSON = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key} to localStorage`, e);
  }
};

// Asynchronously sync local write to Firestore cloud if user is logged in
const syncWriteToCloud = async (path, key, data) => {
  if (typeof window === 'undefined' || !auth || !db) return;
  try {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid !== 'demo_user') {
      const userDocRef = doc(db, 'users', currentUser.uid, ...path);
      await setDoc(userDocRef, data);
    }
  } catch (error) {
    console.error(`Failed to sync write to cloud for ${key}:`, error);
  }
};

// Weekly Workouts
export const getWeeklyWorkouts = () => {
  return getJSON(KEYS.WORKOUTS, DEFAULT_WORKOUTS);
};

export const saveWeeklyWorkouts = (workouts) => {
  setJSON(KEYS.WORKOUTS, workouts);
  syncWriteToCloud(['workouts', 'weekly'], KEYS.WORKOUTS, workouts);
};

// Workout Logs
export const getWorkoutLogs = () => {
  return getJSON(KEYS.LOGS, []);
};

export const saveWorkoutLogs = (logs) => {
  setJSON(KEYS.LOGS, logs);
};

export const addWorkoutLog = (log) => {
  const logs = getWorkoutLogs();
  logs.push(log);
  saveWorkoutLogs(logs);
  
  // Sync new individual log to its own Firestore document
  syncWriteToCloud(['logs', log.id], `log_${log.id}`, log);
  
  return logs;
};

// User Stats
export const getUserStats = () => {
  return getJSON(KEYS.STATS, DEFAULT_STATS);
};

export const saveUserStats = (stats) => {
  setJSON(KEYS.STATS, stats);
  syncWriteToCloud(['stats', 'progress'], KEYS.STATS, stats);
};

// Sync Cloud Database data down to local storage (called on login/auth change)
export const syncCloudToLocal = async (userId) => {
  if (typeof window === 'undefined' || !db || userId === 'demo_user') return;
  try {
    // 1. Sync Weekly Workouts
    const workoutsSnap = await getDoc(doc(db, 'users', userId, 'workouts', 'weekly'));
    if (workoutsSnap.exists()) {
      setJSON(KEYS.WORKOUTS, workoutsSnap.data());
    }

    // 2. Sync User Stats
    const statsSnap = await getDoc(doc(db, 'users', userId, 'stats', 'progress'));
    if (statsSnap.exists()) {
      setJSON(KEYS.STATS, statsSnap.data());
    }

    // 3. Sync Logs
    const logsColRef = collection(db, 'users', userId, 'logs');
    const logsSnap = await getDocs(logsColRef);
    if (!logsSnap.empty) {
      const cloudLogs = [];
      logsSnap.forEach(docSnap => {
        cloudLogs.push(docSnap.data());
      });
      // Sort logs by date (newest last for localStorage array structure)
      cloudLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
      setJSON(KEYS.LOGS, cloudLogs);
    }

    // Dispatch update event so headers and screens reload immediately
    window.dispatchEvent(new Event('arena_stats_updated'));
    console.log('Synced cloud data down to local cache successfully!');
  } catch (error) {
    console.error('Failed to sync cloud data to local cache:', error);
  }
};

// Reset all app data
export const clearAllData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.WORKOUTS);
  localStorage.removeItem(KEYS.LOGS);
  localStorage.removeItem(KEYS.STATS);
};
