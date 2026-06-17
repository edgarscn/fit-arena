import React, { useEffect, useState } from 'react';
import { Link } from 'gatsby';
import { Home, Calendar, Dumbbell, Trophy, History, Flame, Star, LogOut } from 'lucide-react';
import { getUserStats } from '../utils/storage';
import { useAuth } from './AuthContext';
import './Theme.css';

const Layout = ({ children, activePage }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0, badges: [] });

  const refreshStats = () => {
    setStats(getUserStats());
  };

  useEffect(() => {
    refreshStats();
    
    // Add event listener to listen for stats updates (custom event)
    if (typeof window !== 'undefined') {
      window.addEventListener('arena_stats_updated', refreshStats);
      return () => {
        window.removeEventListener('arena_stats_updated', refreshStats);
      };
    }
  }, []);

  const xpPercent = Math.min(100, Math.max(0, (stats.xp / 100) * 100));

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Planejar Semana', path: '/plan', icon: Calendar },
    { name: 'Treinar Hoje', path: '/workout', icon: Dumbbell },
    { name: 'Conquistas', path: '/rewards', icon: Trophy },
    { name: 'Histórico & Retrô', path: '/history', icon: History },
  ];

  return (
    <div className="app-container">
      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)',
            padding: '8px',
            borderRadius: '10px',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Dumbbell size={24} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit' }}>
            ARENA <span style={{ color: 'var(--color-gold)' }}>FIT</span>
          </span>
        </div>

        {/* Gamification Indicator in Sidebar */}
        <div className="glass-card" style={{ padding: '15px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Nível {stats.level}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-gold)' }}>
              <Star size={14} fill="var(--color-gold)" />
              <span style={{ fontSize: '12px', fontWeight: '700' }}>{stats.xp} / 100 XP</span>
            </div>
          </div>
          <div className="xp-container" style={{ marginBottom: '12px' }}>
            <div className="xp-bar" style={{ width: `${xpPercent}%` }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316' }}>
            <Flame size={18} fill="#f97316" />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>
              {stats.streak} {stats.streak === 1 ? 'dia ativo' : 'dias ativos'}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        {user && (
          <div style={{
            marginTop: 'auto',
            borderTop: '1px solid var(--card-border)',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Conectado como:</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-danger)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '1px solid var(--card-border)',
          paddingBottom: '15px'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>
              {activePage === '/' && 'Olá, Edgar! 👋'}
              {activePage === '/plan' && 'Planejamento Semanal'}
              {activePage === '/workout' && 'Registrar Treino'}
              {activePage === '/rewards' && 'Suas Conquistas'}
              {activePage === '/history' && 'Histórico & Retrospectivas'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {activePage === '/' && 'Pronto para esmagar as metas de hoje?'}
              {activePage === '/plan' && 'Monte a sua rotina de corrida, musculação e natação.'}
              {activePage === '/workout' && 'Registre suas cargas e atividades em tempo real.'}
              {activePage === '/rewards' && 'Veja seus troféus e evolução física e mental.'}
              {activePage === '/history' && 'Analise seu progresso e confira sua retrospectiva semanal.'}
            </p>
          </div>

          {/* Gamification summary in top bar for desktop (when sidebar is hidden on small screens) */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="glass-card" style={{
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              background: 'rgba(249, 115, 22, 0.05)'
            }}>
              <Flame size={16} fill="#f97316" color="#f97316" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f97316' }}>{stats.streak}d</span>
            </div>
            
            <div className="glass-card" style={{
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(202, 138, 4, 0.2)',
              background: 'rgba(202, 138, 4, 0.05)'
            }}>
              <Star size={16} fill="var(--color-gold)" color="var(--color-gold)" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-gold)' }}>Lvl {stats.level}</span>
            </div>

            {user && (
              <button
                onClick={logout}
                title="Sair da Conta"
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--color-danger)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>


        <div className="animate-slide-up">
          {children}
        </div>
      </main>

      {/* Bottom Nav Bar for Mobile */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
