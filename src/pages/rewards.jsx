import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUserStats, saveUserStats, clearAllData } from '../utils/storage';
import { BADGES } from '../utils/gamification';
import { Trophy, Star, Flame, Award, AlertTriangle, RefreshCw } from 'lucide-react';

const RewardsPage = () => {
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0, badges: [] });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setStats(getUserStats());
  }, []);

  const handleResetData = () => {
    clearAllData();
    setStats({ xp: 0, level: 1, streak: 0, badges: [] });
    setShowResetConfirm(false);
    
    // Dispatch update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arena_stats_updated'));
    }
  };

  const xpPercent = Math.min(100, Math.max(0, (stats.xp / 100) * 100));
  const unlockedCount = stats.badges.length;
  const totalBadges = BADGES.length;

  return (
    <Layout activePage="/rewards">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Level and Stats Showcase Card */}
        <div className="grid-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          
          {/* Level Info */}
          <div className="glass-card glow-gold" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(20, 20, 23, 0.7) 100%)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
            }}>
              <Star size={32} fill="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Seu Nível</span>
              <h2 style={{ fontSize: '32px', fontFamily: 'Outfit', color: '#fff', lineHeight: '1.2' }}>Nível {stats.level}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div className="xp-container" style={{ flex: 1, height: '8px' }}>
                  <div className="xp-bar" style={{ width: `${xpPercent}%` }}></div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>{stats.xp}/100 XP</span>
              </div>
            </div>
          </div>

          {/* Streak Info */}
          <div className="glass-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(20, 20, 23, 0.7) 100%)',
            borderColor: 'rgba(249, 115, 22, 0.2)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)'
            }}>
              <Flame size={32} fill="#fff" />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Sequência Ativa</span>
              <h2 style={{ fontSize: '32px', fontFamily: 'Outfit', color: '#fff', lineHeight: '1.2' }}>
                {stats.streak} {stats.streak === 1 ? 'Dia' : 'Dias'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Treine diariamente para acumular fogo!
              </p>
            </div>
          </div>

        </div>

        {/* Badges Shelf */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Outfit' }}>
                <Trophy size={22} color="var(--color-gold)" /> Armário de Troféus
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Desbloqueie conquistas completando exercícios e superando marcas pessoais.
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)'
            }}>
              Conquistados: <span style={{ color: 'var(--color-gold)' }}>{unlockedCount}</span> / {totalBadges}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid-cols" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {BADGES.map((badge) => {
              const isUnlocked = stats.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '25px 15px',
                    background: isUnlocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.005)',
                    opacity: isUnlocked ? 1 : 0.45,
                    border: isUnlocked ? `1px solid ${badge.color}44` : '1px solid var(--card-border)',
                    boxShadow: isUnlocked ? `0 4px 20px ${badge.color}15` : 'none',
                    position: 'relative'
                  }}
                >
                  {/* Badge Icon */}
                  <div style={{
                    fontSize: '40px',
                    marginBottom: '15px',
                    filter: isUnlocked ? 'none' : 'grayscale(100%)',
                    transform: isUnlocked ? 'scale(1.05)' : 'none',
                    transition: 'var(--transition-smooth)'
                  }}>
                    {badge.icon}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: isUnlocked ? '#fff' : 'var(--text-secondary)' }}>
                    {badge.title}
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    {badge.description}
                  </p>

                  {/* Status Ribbon */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: isUnlocked ? badge.color : 'var(--text-muted)',
                    background: isUnlocked ? `${badge.color}18` : 'rgba(255,255,255,0.03)',
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}>
                    {isUnlocked ? 'Conquistado' : 'Bloqueado'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Panel */}
        <div className="glass-card" style={{
          border: '1px solid rgba(239, 68, 68, 0.2)',
          background: 'rgba(239, 68, 68, 0.02)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--color-danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Perigo: Limpar Dados
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Apaga permanentemente o histórico de treinos, sequências, nível e conquistas salvas neste navegador.
            </p>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: 'var(--color-danger)',
              background: 'transparent'
            }}
          >
            <RefreshCw size={14} /> Redefinir Conta
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 7, 13, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div className="glass-card animate-pop" style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--color-danger)',
              textAlign: 'center',
              padding: '30px'
            }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--color-danger)'
              }}>
                <AlertTriangle size={30} />
              </div>

              <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '10px', fontFamily: 'Outfit' }}>Tem certeza absoluta?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '25px', lineHeight: '1.5' }}>
                Esta ação é irreversível. Todos os seus treinos definidos, histórico de logs, nível ({stats.level}) e troféus serão permanentemente excluídos.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetData}
                  className="btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)' }}
                >
                  Sim, Limpar Tudo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default RewardsPage;
