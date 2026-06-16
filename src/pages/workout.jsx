import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { getWeeklyWorkouts, addWorkoutLog, getUserStats, saveUserStats, getWorkoutLogs } from '../utils/storage';
import { calculateWorkoutXP, checkNewBadges, addXP, updateStreak } from '../utils/gamification';
import { Play, Pause, RotateCcw, Check, Sparkles, Dumbbell, Zap, Waves, Plus, Minus, Trophy } from 'lucide-react';
import { Link } from 'gatsby';

const WorkoutPage = () => {
  const [weeklyWorkouts, setWeeklyWorkouts] = useState({});
  const [selectedDay, setSelectedDay] = useState('');
  const [activeExercises, setActiveExercises] = useState([]);
  
  // Timer State
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef(null);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [didLevelUp, setDidLevelUp] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  // Check if today has a workout
  useEffect(() => {
    const workouts = getWeeklyWorkouts();
    setWeeklyWorkouts(workouts);

    // Get current day of week in Portuguese
    const daysEnToPt = {
      'Sunday': 'Domingo',
      'Monday': 'Segunda',
      'Tuesday': 'Terça',
      'Wednesday': 'Quarta',
      'Thursday': 'Quinta',
      'Friday': 'Sexta',
      'Saturday': 'Sábado'
    };
    const todayEn = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayPt = daysEnToPt[todayEn] || 'Segunda';
    
    setSelectedDay(todayPt);
    loadDayExercises(todayPt, workouts);

    // Start Timer
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const loadDayExercises = (day, workoutsSource) => {
    const source = workoutsSource || weeklyWorkouts;
    const exercises = source[day] || [];
    
    // Map exercises to active logging state
    const loggedExercises = exercises.map(ex => {
      if (ex.type === 'musculacao') {
        // Create sets array populated with targets
        const sets = [];
        for (let i = 0; i < (ex.targetSets || 4); i++) {
          sets.push({
            weight: ex.targetWeight || '',
            reps: ex.targetReps || ''
          });
        }
        return { ...ex, completed: true, sets };
      } else {
        // Corrida / Natacao
        return {
          ...ex,
          completed: true,
          sets: [{
            distance: ex.targetDistance || '',
            duration: ex.targetDuration || ''
          }]
        };
      }
    });
    
    setActiveExercises(loggedExercises);
  };

  const handleDayChange = (e) => {
    const day = e.target.value;
    setSelectedDay(day);
    loadDayExercises(day);
  };

  // Timer controls
  const toggleTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setTime(0);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Exercise completeness toggle
  const toggleExerciseCompleted = (index) => {
    const updated = [...activeExercises];
    updated[index].completed = !updated[index].completed;
    setActiveExercises(updated);
  };

  // Musculacao: Add set
  const addSet = (exIndex) => {
    const updated = [...activeExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1] || { weight: '', reps: '' };
    updated[exIndex].sets.push({ ...lastSet });
    setActiveExercises(updated);
  };

  // Musculacao: Remove set
  const removeSet = (exIndex, setIndex) => {
    const updated = [...activeExercises];
    if (updated[exIndex].sets.length > 1) {
      updated[exIndex].sets.splice(setIndex, 1);
      setActiveExercises(updated);
    }
  };

  // Update specific set values
  const handleSetChange = (exIndex, setIndex, field, value) => {
    const updated = [...activeExercises];
    updated[exIndex].sets[setIndex][field] = value;
    setActiveExercises(updated);
  };

  // Complete and Log Workout
  const handleCompleteWorkout = () => {
    // 1. Calculate stats and log
    const durationMinutes = Math.max(1, Math.round(time / 60));
    
    const workoutLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      dayOfWeek: selectedDay,
      duration: durationMinutes,
      exercises: activeExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        type: ex.type,
        completed: ex.completed,
        sets: ex.sets.map(s => ({
          ...s,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          distance: parseFloat(s.distance) || 0,
          duration: parseInt(s.duration) || 0
        }))
      }))
    };

    // Save log
    const updatedLogs = addWorkoutLog(workoutLog);

    // 2. XP & Leveling logic
    const xpGained = calculateWorkoutXP(workoutLog);
    setEarnedXP(xpGained);

    const currentStats = getUserStats();
    
    // Check achievements/badges
    const { updatedBadges, newlyUnlocked } = checkNewBadges(workoutLog, updatedLogs, currentStats.badges);
    setNewBadges(newlyUnlocked);

    let statsWithBadges = {
      ...currentStats,
      badges: updatedBadges
    };

    // Update streak
    let statsWithStreak = updateStreak(statsWithBadges);

    // Add XP & Level Up
    const { updatedStats, leveledUp } = addXP(statsWithStreak, xpGained);
    setDidLevelUp(leveledUp);

    // Save all updated stats
    saveUserStats(updatedStats);

    // Trigger update event to refresh layout instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arena_stats_updated'));
    }

    // Stop timer
    clearInterval(timerRef.current);
    setIsTimerRunning(false);

    // Open success modal
    setShowSuccessModal(true);
  };

  const getSportIcon = (type) => {
    switch(type) {
      case 'musculacao': return <Dumbbell size={16} color="var(--color-musculacao)" />;
      case 'corrida': return <Zap size={16} color="var(--color-corrida)" />;
      case 'natacao': return <Waves size={16} color="var(--color-natacao)" />;
      default: return null;
    }
  };

  return (
    <Layout activePage="/workout">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Workout Control Panel (Day Selector + Timer) */}
        <div className="grid-cols" style={{ gridTemplateColumns: '1fr' }}>
          <div className="glass-card" style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Day selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>Carregar Treino:</span>
              <select
                value={selectedDay}
                onChange={handleDayChange}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <option value="Segunda">Segunda-feira</option>
                <option value="Terça">Terça-feira</option>
                <option value="Quarta">Quarta-feira</option>
                <option value="Quinta">Quinta-feira</option>
                <option value="Sexta">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>

            {/* Timer component */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '24px',
                fontWeight: '700',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                letterSpacing: '1px',
                color: '#c084fc'
              }}>
                {formatTime(time)}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={toggleTimer}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={resetTimer}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises Logging List */}
        <div className="glass-card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
            Exercícios Previstos
          </h2>

          {activeExercises.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              border: '1px dashed var(--card-border)',
              borderRadius: '12px'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Nenhum exercício planejado para {selectedDay}.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px', marginBottom: '20px' }}>
                Você precisa definir os treinos deste dia antes de registrá-los.
              </p>
              <Link to="/plan" className="btn-primary">
                Definir Treinos
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeExercises.map((ex, exIndex) => (
                <div
                  key={ex.id}
                  className={`glass-card glow-${ex.type}`}
                  style={{
                    padding: '20px',
                    background: ex.completed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255,255,255,0.01)',
                    opacity: ex.completed ? 1 : 0.6,
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {/* Title & Checkbox */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '8px',
                        borderRadius: '8px'
                      }}>
                        {getSportIcon(ex.type)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', textDecoration: ex.completed ? 'none' : 'line-through', color: ex.completed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {ex.name}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Meta: {ex.type === 'musculacao' && `${ex.targetSets}s × ${ex.targetReps}r (${ex.targetWeight}kg)`}
                          {ex.type === 'corrida' && `${ex.targetDistance}km / ${ex.targetDuration}min`}
                          {ex.type === 'natacao' && `${ex.targetDistance}m / ${ex.targetDuration}min`}
                        </p>
                      </div>
                    </div>

                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={ex.completed}
                        onChange={() => toggleExerciseCompleted(exIndex)}
                      />
                      <span className="checkbox-checkmark" style={{
                        borderColor: ex.completed ? 'var(--color-success)' : 'var(--text-muted)',
                        background: ex.completed ? 'var(--color-success)' : 'transparent'
                      }}>
                        <Check size={14} color="#fff" />
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: ex.completed ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                        {ex.completed ? 'Feito' : 'Pular'}
                      </span>
                    </label>
                  </div>

                  {/* Input sets/metrics (only visible if exercise is checked) */}
                  {ex.completed && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.15)',
                      padding: '15px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      {ex.type === 'musculacao' ? (
                        <div>
                          {ex.sets.map((set, setIndex) => (
                            <div
                              key={setIndex}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                marginBottom: setIndex === ex.sets.length - 1 ? '0' : '10px'
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: '700', width: '60px', color: 'var(--text-muted)' }}>
                                SÉRIE {setIndex + 1}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <input
                                  type="number"
                                  placeholder="Carga"
                                  value={set.weight}
                                  onChange={(e) => handleSetChange(exIndex, setIndex, 'weight', e.target.value)}
                                  style={{
                                    width: '100%', padding: '8px', borderRadius: '6px',
                                    background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                                    color: '#fff', fontSize: '13px', outline: 'none'
                                  }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kg</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <input
                                  type="number"
                                  placeholder="Reps"
                                  value={set.reps}
                                  onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)}
                                  style={{
                                    width: '100%', padding: '8px', borderRadius: '6px',
                                    background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                                    color: '#fff', fontSize: '13px', outline: 'none'
                                  }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>reps</span>
                              </div>

                              <button
                                onClick={() => removeSet(exIndex, setIndex)}
                                disabled={ex.sets.length <= 1}
                                style={{
                                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                  cursor: ex.sets.length <= 1 ? 'not-allowed' : 'pointer', padding: '6px'
                                }}
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                          ))}

                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
                            <button
                              onClick={() => addSet(exIndex)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)',
                                padding: '6px 12px', borderRadius: '6px', color: 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} /> Adicionar Série
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Corrida / Natação inputs */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                              {ex.type === 'corrida' ? 'Distância Real (km)' : 'Distância Real (metros)'}
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={ex.sets[0].distance}
                              onChange={(e) => handleSetChange(exIndex, 0, 'distance', e.target.value)}
                              style={{
                                width: '100%', padding: '8px', borderRadius: '6px',
                                background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                                color: '#fff', fontSize: '13px', outline: 'none'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                              Duração Real (minutos)
                            </label>
                            <input
                              type="number"
                              value={ex.sets[0].duration}
                              onChange={(e) => handleSetChange(exIndex, 0, 'duration', e.target.value)}
                              style={{
                                width: '100%', padding: '8px', borderRadius: '6px',
                                background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                                color: '#fff', fontSize: '13px', outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Log Action Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <button
                  onClick={handleCompleteWorkout}
                  className="btn-primary"
                  style={{
                    padding: '16px 40px',
                    fontSize: '16px',
                    gap: '10px',
                    boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <Check size={20} /> Concluir Treino
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal Celebration */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 7, 13, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card glow-gold animate-pop" style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-secondary)',
            textAlign: 'center',
            padding: '40px 30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
              color: '#fff'
            }}>
              <Trophy size={40} />
            </div>

            <h2 style={{ fontSize: '28px', fontFamily: 'Outfit', color: '#fff', marginBottom: '8px' }}>
              Treino Concluído! ⚡
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '25px' }}>
              Parabéns! Você registrou o treino de {selectedDay} com sucesso.
            </p>

            {/* XP Gained display */}
            <div className="glass-card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '25px',
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>XP Ganho</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#a855f7' }}>+{earnedXP} XP</span>
              </div>
              <div style={{ borderLeft: '1px solid var(--card-border)', height: '40px' }}></div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tempo</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#06b6d4' }}>
                  {Math.max(1, Math.round(time / 60))} min
                </span>
              </div>
            </div>

            {/* Level Up alert */}
            {didLevelUp && (
              <div className="animate-slide-up" style={{
                background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                border: '1px solid var(--color-musculacao)',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <Sparkles color="var(--color-gold)" size={20} fill="var(--color-gold)" />
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>
                  NOVO NÍVEL ALCANCADO! 🚀
                </span>
              </div>
            )}

            {/* Badges unlocked */}
            {newBadges.length > 0 && (
              <div className="animate-slide-up" style={{ marginBottom: '25px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '700' }}>
                  Novos Troféus Conquistados ({newBadges.length})
                </span>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {newBadges.map(bId => {
                    const bMeta = {
                      first_workout: { icon: '🏆', title: 'Primeiro Passo', col: '#3b82f6' },
                      heavy_lifter: { icon: '💪', title: 'Força Suprema', col: '#8b5cf6' },
                      run_5k: { icon: '⚡', title: 'Papa-Léguas', col: '#ec4899' },
                      swim_1k: { icon: '🔱', title: 'Tritão / Sereia', col: '#06b6d4' },
                      streak_3: { icon: '🔥', title: 'Fogo Inicial', col: '#f97316' },
                      streak_7: { icon: '🛡️', title: 'Constância de Aço', col: '#10b981' },
                      volume_king: { icon: '👑', title: 'Rei do Volume', col: '#eab308' }
                    }[bId] || { icon: '🏅', title: 'Conquista', col: '#fff' };

                    return (
                      <div
                        key={bId}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${bMeta.col}`,
                          borderRadius: '10px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{bMeta.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{bMeta.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Dashboard
              </Link>
              <Link to="/history" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Ver Histórico
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WorkoutPage;
