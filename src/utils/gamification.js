// Gamification engine for Arena Fitness Tracker

export const XP_PER_LEVEL = 100;

export const BADGES = [
  {
    id: 'first_workout',
    title: 'Primeiro Passo',
    description: 'Registrou o primeiro treino no aplicativo!',
    icon: '🏆',
    color: '#3B82F6', // Blue
  },
  {
    id: 'heavy_lifter',
    title: 'Força Suprema',
    description: 'Registrou uma carga de 80kg ou mais em musculação.',
    icon: '💪',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'run_5k',
    title: 'Papa-Léguas',
    description: 'Correu 5km ou mais em uma única sessão.',
    icon: '⚡',
    color: '#EC4899', // Pink
  },
  {
    id: 'swim_1k',
    title: 'Tritão / Sereia',
    description: 'Nadou 1000m ou mais em uma única sessão.',
    icon: '🔱',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'streak_3',
    title: 'Fogo Inicial',
    description: 'Manteve uma sequência de 3 dias ativos.',
    icon: '🔥',
    color: '#F97316', // Orange
  },
  {
    id: 'streak_7',
    title: 'Constância de Aço',
    description: 'Manteve uma sequência de 7 dias ativos.',
    icon: '🛡️',
    color: '#10B981', // Green
  },
  {
    id: 'volume_king',
    title: 'Rei do Volume',
    description: 'Levantou mais de 5000kg de volume total em um único treino.',
    icon: '👑',
    color: '#EAB308', // Yellow
  }
];

// Calculate how much XP a workout log generates
export const calculateWorkoutXP = (log) => {
  let xp = 0;
  let completedCount = 0;
  let totalCount = log.exercises.length;

  if (totalCount === 0) return 10; // logging an empty workout still gives small XP

  log.exercises.forEach(ex => {
    if (ex.completed) {
      xp += 15; // 15 XP for completed exercise
      completedCount++;
    } else {
      xp += 5;  // 5 XP for skipped exercise (participation score)
    }
  });

  // Finish workout bonus
  xp += 20;

  // Perfect workout bonus (all exercises completed)
  if (completedCount === totalCount && totalCount > 0) {
    xp += 30;
  }

  return xp;
};

// Check if any badges are unlocked with this new log and current logs
export const checkNewBadges = (newLog, allLogs, currentBadges) => {
  const unlocked = [...currentBadges];
  const newUnlocked = [];

  const addBadge = (id) => {
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      newUnlocked.push(id);
    }
  };

  // Badge: First Workout
  if (allLogs.length >= 1) {
    addBadge('first_workout');
  }

  // Check new log metrics for achievements
  newLog.exercises.forEach(ex => {
    if (!ex.completed) return;

    // Badge: Heavy Lifter (musculacao and weight >= 80kg in any set)
    if (ex.type === 'musculacao' && ex.sets) {
      const hasHeavySet = ex.sets.some(set => parseFloat(set.weight) >= 80);
      if (hasHeavySet) {
        addBadge('heavy_lifter');
      }

      // Badge: Volume King
      // Volume = sets * reps * weight
      let exerciseVolume = 0;
      ex.sets.forEach(set => {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        exerciseVolume += w * r;
      });
      if (exerciseVolume >= 5000) {
        addBadge('volume_king');
      }
    }

    // Badge: Run 5km
    if (ex.type === 'corrida' && ex.sets) {
      const hasLongRun = ex.sets.some(set => parseFloat(set.distance) >= 5);
      if (hasLongRun) {
        addBadge('run_5k');
      }
    }

    // Badge: Swim 1000m (1km)
    if (ex.type === 'natacao' && ex.sets) {
      // Distance might be in meters, let's check if distance is >= 1000
      const hasLongSwim = ex.sets.some(set => parseFloat(set.distance) >= 1000);
      if (hasLongSwim) {
        addBadge('swim_1k');
      }
    }
  });

  return {
    updatedBadges: unlocked,
    newlyUnlocked: newUnlocked
  };
};

// Update streak based on last active date and today's date
export const updateStreak = (currentStats) => {
  const stats = { ...currentStats };
  const todayStr = new Date().toLocaleDateString('en-US'); // Format as date only
  
  if (!stats.lastActiveDate) {
    stats.streak = 1;
    stats.lastActiveDate = todayStr;
    return stats;
  }

  const lastActive = new Date(stats.lastActiveDate);
  const today = new Date(todayStr);
  
  // Calculate difference in days
  const diffTime = Math.abs(today - lastActive);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already active today, streak remains same
  } else if (diffDays === 1) {
    // Consecutive day, increment streak
    stats.streak += 1;
    stats.lastActiveDate = todayStr;

    // Check streak badges
    if (stats.streak >= 3 && !stats.badges.includes('streak_3')) {
      stats.badges.push('streak_3');
    }
    if (stats.streak >= 7 && !stats.badges.includes('streak_7')) {
      stats.badges.push('streak_7');
    }
  } else {
    // Streak broken, reset
    stats.streak = 1;
    stats.lastActiveDate = todayStr;
  }

  return stats;
};

// Process XP gains and level ups
export const addXP = (currentStats, xpGained) => {
  const stats = { ...currentStats };
  stats.xp += xpGained;

  let leveledUp = false;
  while (stats.xp >= XP_PER_LEVEL) {
    stats.xp -= XP_PER_LEVEL;
    stats.level += 1;
    leveledUp = true;
  }

  return {
    updatedStats: stats,
    leveledUp
  };
};
