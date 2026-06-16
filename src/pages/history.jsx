import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getWorkoutLogs } from '../utils/storage';
import { Calendar, Clock, Dumbbell, Zap, Waves, Award, BarChart2, Star } from 'lucide-react';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [currentWeekStats, setCurrentWeekStats] = useState(null);
  const [isSundayMode, setIsSundayMode] = useState(false); // Can be forced with a toggle for demo

  useEffect(() => {
    const allLogs = getWorkoutLogs();
    setLogs(allLogs.reverse()); // Show newest first
    calculateWeekStats(allLogs);

    // Check if today is Sunday
    const today = new Date();
    if (today.getDay() === 0) { // 0 = Sunday
      setIsSundayMode(true);
    }
  }, []);

  const calculateWeekStats = (allLogs) => {
    if (allLogs.length === 0) {
      setCurrentWeekStats(null);
      return;
    }

    const today = new Date();
    // Find previous Monday
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday...
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diffToMonday));
    startOfWeek.setHours(0, 0, 0, 0);

    // Filter logs for this week (from Monday 00:00 to now)
    const thisWeekLogs = allLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek;
    });

    if (thisWeekLogs.length === 0) {
      setCurrentWeekStats({
        sessions: 0,
        time: 0,
        volume: 0,
        runDist: 0,
        swimDist: 0,
        compliance: 0,
        quote: 'Nenhum treino registrado esta semana. Vamos começar?'
      });
      return;
    }

    let totalSessions = thisWeekLogs.length;
    let totalTime = 0;
    let totalVolume = 0;
    let totalRunDist = 0;
    let totalSwimDist = 0;
    
    let totalExercises = 0;
    let completedExercises = 0;

    thisWeekLogs.forEach(log => {
      totalTime += log.duration || 0;
      
      log.exercises.forEach(ex => {
        totalExercises += 1;
        if (ex.completed) {
          completedExercises += 1;

          if (ex.type === 'musculacao' && ex.sets) {
            ex.sets.forEach(set => {
              const w = parseFloat(set.weight) || 0;
              const r = parseInt(set.reps) || 0;
              totalVolume += w * r;
            });
          } else if (ex.type === 'corrida' && ex.sets) {
            ex.sets.forEach(set => {
              totalRunDist += parseFloat(set.distance) || 0;
            });
          } else if (ex.type === 'natacao' && ex.sets) {
            ex.sets.forEach(set => {
              totalSwimDist += parseFloat(set.distance) || 0;
            });
          }
        }
      });
    });

    const complianceRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    // Generate feedback message based on compliance
    let feedback = '';
    if (complianceRate >= 90) {
      feedback = 'Semana Lendária! 🔥 Você seguiu o plano com extrema precisão e dedicação. Seu corpo e mente estão evoluindo no nível máximo. Continue assim!';
    } else if (complianceRate >= 70) {
      feedback = 'Excelente Trabalho! 💪 Grande consistência esta semana. Você cumpriu a grande maioria dos treinos e manteve o ritmo forte.';
    } else if (complianceRate >= 45) {
      feedback = 'Bom Ritmo! 🏃‍♂️ Você se manteve em movimento e registrou atividades importantes, mas há espaço para aumentar o foco na próxima semana.';
    } else {
      feedback = 'Semana de Recomeço. 🛡️ O importante é não parar totalmente. Tente reajustar seu planejamento semanal para metas mais realistas e volte com tudo!';
    }

    setCurrentWeekStats({
      sessions: totalSessions,
      time: totalTime,
      volume: totalVolume,
      runDist: totalRunDist,
      swimDist: totalSwimDist,
      compliance: complianceRate,
      quote: feedback
    });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout activePage="/history">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Weekly Retrospective Section */}
        {currentWeekStats && (
          <div className="glass-card glow-gold" style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(18, 26, 47, 0.75) 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top decorative banner */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--color-musculacao) 0%, var(--color-corrida) 50%, var(--color-natacao) 100%)'
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontFamily: 'Outfit', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={24} color="#f59e0b" /> 
                  {isSundayMode ? 'Retrospectiva de Domingo 🎉' : 'Resumo da Semana Atual'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {isSundayMode 
                    ? 'Seu fechamento semanal de resultados oficiais está pronto.' 
                    : 'Acompanhe o progresso acumulado da sua semana (Segunda a Domingo).'}
                </p>
              </div>

              {/* Debug toggle */}
              <button
                onClick={() => setIsSundayMode(!isSundayMode)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '700'
                }}
              >
                {isSundayMode ? 'Ver como dia normal' : 'Simular Fechamento de Domingo'}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: '25px', gap: '15px' }}>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Treinos</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff', display: 'block', marginTop: '5px' }}>
                  {currentWeekStats.sessions}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>sessões registradas</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Tempo Ativo</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#06b6d4', display: 'block', marginTop: '5px' }}>
                  {currentWeekStats.time} <span style={{ fontSize: '14px' }}>min</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>tempo total de treino</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Carga Total</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#a855f7', display: 'block', marginTop: '5px' }}>
                  {currentWeekStats.volume.toLocaleString('pt-BR')} <span style={{ fontSize: '14px' }}>kg</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>volume de musculação</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Cardio</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '5px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#ec4899' }}>
                    🏃‍♂️ {currentWeekStats.runDist.toFixed(1)} km
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#06b6d4' }}>
                    🏊‍♂️ {currentWeekStats.swimDist} m
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Aproveitamento</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', display: 'block', marginTop: '5px' }}>
                  {currentWeekStats.compliance}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>exercícios concluídos</span>
              </div>

            </div>

            {/* Feedback Message */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '16px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <Award size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Avaliação da Semana:</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                  "{currentWeekStats.quote}"
                </p>
              </div>
            </div>

          </div>
        )}

        {/* History of Logs */}
        <div className="glass-card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} /> Histórico de Sessões
          </h2>

          {logs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              border: '1px dashed var(--card-border)',
              borderRadius: '12px',
              color: 'var(--text-secondary)'
            }}>
              <Clock size={40} color="var(--text-muted)" style={{ marginBottom: '15px' }} />
              <p style={{ fontWeight: '500' }}>Nenhum treino registrado no histórico ainda.</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px' }}>
                Complete treinos na aba "Treinar Hoje" para alimentar seu histórico.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {logs.map((log) => (
                <div key={log.id} className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                  
                  {/* Header of card */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--card-border)',
                    paddingBottom: '12px',
                    marginBottom: '15px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '11px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c084fc',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        marginRight: '8px'
                      }}>
                        Treino de {log.dayOfWeek}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(log.date)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>
                      <Clock size={14} /> {log.duration} min
                    </div>
                  </div>

                  {/* Exercises Details in Log */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {log.exercises.map((ex, idx) => {
                      // Calculate individual exercise status summary
                      let summaryText = '';
                      if (ex.completed) {
                        if (ex.type === 'musculacao') {
                          summaryText = `${ex.sets.length} séries logged`;
                        } else if (ex.type === 'corrida') {
                          summaryText = `${ex.sets[0].distance} km em ${ex.sets[0].duration} min`;
                        } else if (ex.type === 'natacao') {
                          summaryText = `${ex.sets[0].distance} m em ${ex.sets[0].duration} min`;
                        }
                      } else {
                        summaryText = 'Pulado';
                      }

                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                          padding: '4px 0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              background: ex.completed ? 'var(--color-success)' : 'var(--color-danger)'
                            }}></span>
                            <span style={{
                              fontWeight: '600',
                              textDecoration: ex.completed ? 'none' : 'line-through',
                              color: ex.completed ? 'var(--text-primary)' : 'var(--text-muted)'
                            }}>
                              {ex.name}
                            </span>
                          </div>

                          <span style={{
                            fontSize: '12px',
                            color: ex.completed ? 'var(--text-secondary)' : 'var(--color-danger)',
                            fontWeight: ex.completed ? '500' : '700'
                          }}>
                            {summaryText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default HistoryPage;
