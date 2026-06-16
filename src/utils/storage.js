// Local Storage utilities for Arena Fitness Tracker

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

export const getWeeklyWorkouts = () => {
  return getJSON(KEYS.WORKOUTS, DEFAULT_WORKOUTS);
};

export const saveWeeklyWorkouts = (workouts) => {
  setJSON(KEYS.WORKOUTS, workouts);
};

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
  return logs;
};

export const getUserStats = () => {
  return getJSON(KEYS.STATS, DEFAULT_STATS);
};

export const saveUserStats = (stats) => {
  setJSON(KEYS.STATS, stats);
};

// Reset all app data
export const clearAllData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.WORKOUTS);
  localStorage.removeItem(KEYS.LOGS);
  localStorage.removeItem(KEYS.STATS);
};
