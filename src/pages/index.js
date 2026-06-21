import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getWeeklyWorkouts, getUserStats } from '../utils/storage';
import { BADGES } from '../utils/gamification';
import { Flame, Star, Trophy, ArrowRight, Dumbbell, Zap, Waves, Calendar, Award } from 'lucide-react';
import { Link } from 'gatsby';

const IndexPage = () => {
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0, badges: [] });
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [todayNamePt, setTodayNamePt] = useState('Segunda');

  useEffect(() => {
    // 1. Get stats
    setStats(getUserStats());

    // 2. Get today's day of week
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
    setTodayNamePt(todayPt);

    // 3. Load today's workout
    const workouts = getWeeklyWorkouts();
    setTodayWorkout(workouts[todayPt] || []);
  }, []);

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

  // Find 3 most recent badges unlocked
  const recentBadges = BADGES.filter(b => stats.badges.includes(b.id)).slice(0, 3);

  return (
    <Layout activePage="/">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Daily Workout Showcase */}
        <div className="glass-card glow-musculacao" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(20, 20, 23, 0.7) 100%)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <span style={{
                fontSize: '11px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c084fc',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                Hoje ({todayNamePt})
              </span>
              
              <h2 style={{ fontSize: '24px', marginTop: '10px', fontFamily: 'Outfit', color: '#fff' }}>
                {todayWorkout.length > 0 ? 'Seu Treino está Pronto! 💪' : 'Dia de Descanso Ativo 🧘‍♂️'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                {todayWorkout.length > 0 
                  ? `Você tem ${todayWorkout.length} exercício(s) planejado(s) para hoje.`
                  : 'Aproveite hoje para descansar ou faça uma atividade regenerativa leve!'}
              </p>
            </div>

            {todayWorkout.length > 0 ? (
              <Link to="/workout" className="btn-primary" style={{ padding: '12px 24px' }}>
                Iniciar Treino <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/plan" className="btn-secondary" style={{ padding: '12px 24px' }}>
                Montar Agenda <Calendar size={18} />
              </Link>
            )}
          </div>

          {/* Today's Exercises Preview */}
          {todayWorkout.length > 0 && (
            <div style={{
              marginTop: '25px',
              borderTop: '1px solid var(--card-border)',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Prévia das atividades:
              </span>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {todayWorkout.slice(0, 4).map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{
                      background: getSportBadgeColor(ex.type),
                      padding: '6px',
                      borderRadius: '8px'
                    }}>
                      {getSportIcon(ex.type)}
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{ex.name}</span>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                        {ex.type === 'musculacao' && `${ex.targetSets}s × ${ex.targetReps}r`}
                        {ex.type === 'corrida' && `${ex.targetDistance}km`}
                        {ex.type === 'natacao' && `${ex.targetDistance}m`}
                      </span>
                    </div>
                  </div>
                ))}
                
                {todayWorkout.length > 4 && (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600'
                  }}>
                    +{todayWorkout.length - 4} mais
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Grid - Stats & Gamification */}
        <div className="grid-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          
          {/* Stats Overview */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f97316" fill="#f97316" /> Status da Arena
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nível Atual:</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Nível {stats.level}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>XP para o próx. Nível:</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#a855f7' }}>{100 - stats.xp} XP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Frequência semanal:</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#f97316' }}>{stats.streak} {stats.streak === 1 ? 'dia' : 'dias'} seguidos</span>
              </div>
            </div>

            <Link to="/rewards" style={{
              color: '#c084fc', textDecoration: 'none', fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '5px', marginTop: '20px'
            }}>
              Ver progresso completo <ArrowRight size={14} />
            </Link>
          </div>

          {/* Recent Achievements */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', marginBottom: '15px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="var(--color-gold)" /> Últimos Troféus
            </h3>

            {recentBadges.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 15px',
                border: '1px dashed var(--card-border)',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}>
                <Award size={30} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                Nenhum troféu conquistado ainda.
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                  Complete treinos para liberar conquistas!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentBadges.map(b => (
                  <div
                    key={b.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${b.color}33`,
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{b.icon}</span>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{b.title}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link to="/rewards" style={{
              color: '#c084fc', textDecoration: 'none', fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '5px', marginTop: '20px'
            }}>
              Ver todos os troféus ({stats.badges.length}) <ArrowRight size={14} />
            </Link>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default IndexPage;
