import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getWeeklyWorkouts, saveWeeklyWorkouts } from '../utils/storage';
import { Plus, Trash2, Copy, Dumbbell, Zap, Waves } from 'lucide-react';

const PlanPage = () => {
  const [workouts, setWorkouts] = useState({
    'Segunda': [], 'Terça': [], 'Quarta': [], 'Quinta': [], 'Sexta': [], 'Sábado': [], 'Domingo': []
  });
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [exerciseType, setExerciseType] = useState('musculacao');
  const [exerciseName, setExerciseName] = useState('');
  const [targetSets, setTargetSets] = useState('4');
  const [targetReps, setTargetReps] = useState('10');
  const [targetWeight, setTargetWeight] = useState('20');
  const [targetDistance, setTargetDistance] = useState('5');
  const [targetDuration, setTargetDuration] = useState('30');

  // Copy Day State
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetDay, setCopyTargetDay] = useState('Segunda');

  useEffect(() => {
    setWorkouts(getWeeklyWorkouts());
  }, []);

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const newExercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: exerciseName,
      type: exerciseType,
      ...(exerciseType === 'musculacao' ? {
        targetSets: parseInt(targetSets) || 0,
        targetReps: parseInt(targetReps) || 0,
        targetWeight: parseFloat(targetWeight) || 0,
      } : {
        targetDistance: parseFloat(targetDistance) || 0,
        targetDuration: parseInt(targetDuration) || 0,
      })
    };

    const updatedWorkouts = {
      ...workouts,
      [selectedDay]: [...workouts[selectedDay], newExercise]
    };

    setWorkouts(updatedWorkouts);
    saveWeeklyWorkouts(updatedWorkouts);

    // Reset Form
    setExerciseName('');
    setShowAddForm(false);
  };

  const handleDeleteExercise = (id) => {
    const updatedDayWorkouts = workouts[selectedDay].filter(ex => ex.id !== id);
    const updatedWorkouts = {
      ...workouts,
      [selectedDay]: updatedDayWorkouts
    };
    setWorkouts(updatedWorkouts);
    saveWeeklyWorkouts(updatedWorkouts);
  };

  const handleCopyDay = () => {
    if (selectedDay === copyTargetDay) return;
    
    // Deep clone exercises
    const clonedExercises = workouts[selectedDay].map(ex => ({
      ...ex,
      id: Math.random().toString(36).substr(2, 9)
    }));

    const updatedWorkouts = {
      ...workouts,
      [copyTargetDay]: [...workouts[copyTargetDay], ...clonedExercises]
    };

    setWorkouts(updatedWorkouts);
    saveWeeklyWorkouts(updatedWorkouts);
    setShowCopyModal(false);
  };

  const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const getSportIcon = (type) => {
    switch(type) {
      case 'musculacao': return <Dumbbell size={16} color="var(--color-musculacao)" />;
      case 'corrida': return <Zap size={16} color="var(--color-corrida)" />;
      case 'natacao': return <Waves size={16} color="var(--color-natacao)" />;
      default: return null;
    }
  };

  const getSportBadgeColor = (type) => {
    switch(type) {
      case 'musculacao': return 'rgba(168, 85, 247, 0.1)';
      case 'corrida': return 'rgba(236, 72, 153, 0.1)';
      case 'natacao': return 'rgba(6, 182, 212, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <Layout activePage="/plan">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Weekday Selector */}
        <div className="glass-card" style={{ padding: '15px' }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '10px',
            paddingBottom: '5px',
            scrollbarWidth: 'none'
          }}>
            {weekdays.map((day) => {
              const count = workouts[day]?.length || 0;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    flex: '1',
                    minWidth: '100px',
                    padding: '12px 10px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isSelected ? '#8b5cf6' : 'var(--card-border)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)' : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? '#c084fc' : 'var(--text-secondary)',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{day}</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: isSelected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#fff' : 'var(--text-muted)'
                  }}>
                    {count} {count === 1 ? 'exer.' : 'exer.'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises List and Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Treino de <span style={{ color: '#c084fc' }}>{selectedDay}</span>
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {workouts[selectedDay].length > 0 && (
                  <button 
                    onClick={() => setShowCopyModal(true)} 
                    className="btn-secondary" 
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                  >
                    <Copy size={16} /> Copiar Treino
                  </button>
                )}
                <button 
                  onClick={() => setShowAddForm(true)} 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Add Exercício
                </button>
              </div>
            </div>

            {/* Exercises Grid */}
            {workouts[selectedDay].length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--card-border)',
                borderRadius: '12px'
              }}>
                <Dumbbell size={40} color="var(--text-muted)" style={{ marginBottom: '15px' }} />
                <p style={{ fontWeight: '500' }}>Nenhum exercício planejado para este dia.</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px' }}>
                  Clique em "Add Exercício" para começar a montar seu treino de musculação, corrida ou natação.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {workouts[selectedDay].map((ex) => (
                  <div 
                    key={ex.id} 
                    className={`glass-card glow-${ex.type}`} 
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        background: getSportBadgeColor(ex.type),
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getSportIcon(ex.type)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{ex.name}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                          {ex.type === 'musculacao' && `${ex.targetSets} séries × ${ex.targetReps} reps • Carga sugerida: ${ex.targetWeight}kg`}
                          {ex.type === 'corrida' && `Alvo: ${ex.targetDistance} km em ${ex.targetDuration} min`}
                          {ex.type === 'natacao' && `Alvo: ${ex.targetDistance} m em ${ex.targetDuration} min`}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteExercise(ex.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition-smooth)'
                      }}
                      className="delete-btn"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Exercise Modal Form */}
        {showAddForm && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 7, 13, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            <div className="glass-card animate-pop" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '20px', fontFamily: 'Outfit' }}>Adicionar Exercício para {selectedDay}</h3>
              
              <form onSubmit={handleAddExercise}>
                {/* Sport Type */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Tipo de Treino</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setExerciseType('musculacao')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                        borderColor: exerciseType === 'musculacao' ? 'var(--color-musculacao)' : 'var(--card-border)',
                        background: exerciseType === 'musculacao' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                        color: exerciseType === 'musculacao' ? '#d8b4fe' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      Musculação
                    </button>
                    <button
                      type="button"
                      onClick={() => setExerciseType('corrida')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                        borderColor: exerciseType === 'corrida' ? 'var(--color-corrida)' : 'var(--card-border)',
                        background: exerciseType === 'corrida' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                        color: exerciseType === 'corrida' ? '#fbcfe8' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      Corrida
                    </button>
                    <button
                      type="button"
                      onClick={() => setExerciseType('natacao')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                        borderColor: exerciseType === 'natacao' ? 'var(--color-natacao)' : 'var(--card-border)',
                        background: exerciseType === 'natacao' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: exerciseType === 'natacao' ? '#99f6e4' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      Natação
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Nome do Exercício / Atividade</label>
                  <input
                    type="text"
                    required
                    placeholder={exerciseType === 'musculacao' ? 'Ex: Supino Reto, Agachamento' : exerciseType === 'corrida' ? 'Ex: Corrida na Esteira, Corrida de Rua' : 'Ex: Nado Crawl, Nado Peito'}
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                    }}
                  />
                </div>

                {/* Musculacao fields */}
                {exerciseType === 'musculacao' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Séries</label>
                      <input
                        type="number"
                        min="1"
                        value={targetSets}
                        onChange={(e) => setTargetSets(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                          border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Reps</label>
                      <input
                        type="number"
                        min="1"
                        value={targetReps}
                        onChange={(e) => setTargetReps(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                          border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Carga (kg)</label>
                      <input
                        type="number"
                        min="0"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                          border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Corrida / Natacao fields */}
                {exerciseType !== 'musculacao' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {exerciseType === 'corrida' ? 'Distância (km)' : 'Distância (metros)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={targetDistance}
                        onChange={(e) => setTargetDistance(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                          border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tempo Alvo (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={targetDuration}
                        onChange={(e) => setTargetDuration(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                          border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Copy Workout Modal */}
        {showCopyModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 7, 13, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            <div className="glass-card animate-pop" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '20px', fontFamily: 'Outfit' }}>Copiar treino de {selectedDay}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Copiar todos os exercícios do treino de {selectedDay} para outro dia da semana.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Copiar para:</label>
                <select
                  value={copyTargetDay}
                  onChange={(e) => setCopyTargetDay(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-primary)',
                    border: '1px solid var(--card-border)', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                >
                  {weekdays.filter(d => d !== selectedDay).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCopyDay}
                  className="btn-primary"
                >
                  Confirmar Cópia
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PlanPage;
