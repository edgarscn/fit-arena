import React, { useState, useEffect } from 'react';
import { navigate } from 'gatsby';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebasePending } from '../utils/firebase';
import { useAuth } from '../components/AuthContext';
import { getWorkoutLogs, getUserStats, clearAllData } from '../utils/storage';
import Layout from '../components/Layout';
import {
  User, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, HelpCircle,
  Trophy, BarChart2, Star, Flame, Clock, Dumbbell, Zap, Waves, Settings, LogOut,
  ChevronDown, ChevronUp, MapPin, Award
} from 'lucide-react';
import '../components/Theme.css';

const ProfilePage = () => {
  const { user, logout, enterDemoMode } = useAuth();
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0, badges: [] });
  const [logs, setLogs] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'feed' | 'settings'
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Auth Forms State
  const [activeAuthTab, setActiveAuthTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Reset Data Confirm state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    // Only load stats and logs if user is authenticated (or in local mode)
    if (user || isFirebasePending) {
      setStats(getUserStats());
      const allLogs = getWorkoutLogs();
      setLogs([...allLogs].reverse()); // Newest logs first
    }
  }, [user]);

  // Auth logic
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (activeAuthTab === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem!');
      setLoading(false);
      return;
    }

    try {
      if (activeAuthTab === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userObj = userCredential.user;

        if (!userObj.emailVerified) {
          setError('Por favor, verifique seu e-mail antes de acessar.');
          await sendEmailVerification(userObj);
          navigate('/verify-email');
        } else {
          // Success
          navigate('/profile');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setSuccess('Cadastro realizado! Um e-mail de verificação foi enviado.');
        setActiveAuthTab('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      const errMap = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/user-disabled': 'Este usuário foi desativado.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'Este e-mail já está em uso.',
        'auth/weak-password': 'A senha deve conter pelo menos 6 caracteres.',
        'auth/invalid-credential': 'Credenciais incorretas ou inválidas.'
      };
      setError(errMap[err.code] || 'Ocorreu um erro no processo. Tente novamente.');
    } finally {
      setLoading(true); // Keep loading true while AuthContext processes redirect
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setError('');
    setRecoverySuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, recoveryEmail);
      setRecoverySuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setRecoveryEmail('');
    } catch (err) {
      console.error(err);
      setError('Não foi possível enviar o e-mail. Verifique o endereço.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    clearAllData();
    setStats({ xp: 0, level: 1, streak: 0, badges: [] });
    setLogs([]);
    setShowResetConfirm(false);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arena_stats_updated'));
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Math Calculations for Strava Totals
  const calculateSportTotals = () => {
    let totals = {
      musculacao: { sessions: 0, sets: 0, volume: 0 },
      corrida: { sessions: 0, distance: 0, duration: 0 },
      natacao: { sessions: 0, distance: 0, duration: 0 }
    };

    logs.forEach(log => {
      let hasMusculacao = false;
      let hasCorrida = false;
      let hasNatacao = false;

      log.exercises?.forEach(ex => {
        if (!ex.completed) return;

        if (ex.type === 'musculacao') {
          hasMusculacao = true;
          if (ex.sets) {
            totals.musculacao.sets += ex.sets.length;
            ex.sets.forEach(s => {
              totals.musculacao.volume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
            });
          }
        } else if (ex.type === 'corrida') {
          hasCorrida = true;
          if (ex.sets && ex.sets[0]) {
            totals.corrida.distance += parseFloat(ex.sets[0].distance) || 0;
            totals.corrida.duration += parseInt(ex.sets[0].duration) || 0;
          }
        } else if (ex.type === 'natacao') {
          hasNatacao = true;
          if (ex.sets && ex.sets[0]) {
            totals.natacao.distance += parseFloat(ex.sets[0].distance) || 0;
            totals.natacao.duration += parseInt(ex.sets[0].duration) || 0;
          }
        }
      });

      if (hasMusculacao) totals.musculacao.sessions += 1;
      if (hasCorrida) totals.corrida.sessions += 1;
      if (hasNatacao) totals.natacao.sessions += 1;
    });

    return totals;
  };

  const totals = calculateSportTotals();
  const userName = user?.email ? user.email.split('@')[0] : 'Edgar';
  const displayUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const xpPercent = Math.min(100, Math.max(0, (stats.xp / 100) * 100));

  // Render Login Card if not logged in (only when Firebase is active)
  if (!user && !isFirebasePending) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Glowing gradients */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', filter: 'blur(80px)', zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'rgba(153, 27, 27, 0.06)', filter: 'blur(80px)', zIndex: 0
        }}></div>

        <div className="glass-card animate-pop" style={{
          width: '100%', maxWidth: '440px', background: 'var(--bg-secondary)',
          border: '1px solid var(--card-border)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
          padding: '40px 30px', zIndex: 1
        }}>
          {/* Header logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
              padding: '12px', borderRadius: '16px', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '12px', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)'
            }}>
              <Dumbbell size={28} />
            </div>
            <h2 style={{ fontSize: '24px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
              ARENA <span style={{ color: 'var(--color-gold)' }}>FITNESS</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Faça login para salvar seus dados na nuvem
            </p>
          </div>

          {!showRecovery ? (
            <>
              {/* Tabs */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                padding: '4px', marginBottom: '25px', border: '1px solid var(--card-border)'
              }}>
                <button
                  type="button"
                  onClick={() => { setActiveAuthTab('login'); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                    background: activeAuthTab === 'login' ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: activeAuthTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeAuthTab === 'login' ? '700' : '500',
                    cursor: 'pointer', fontSize: '14px', transition: 'var(--transition-smooth)'
                  }}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveAuthTab('signup'); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                    background: activeAuthTab === 'signup' ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: activeAuthTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeAuthTab === 'signup' ? '700' : '500',
                    cursor: 'pointer', fontSize: '14px', transition: 'var(--transition-smooth)'
                  }}
                >
                  Cadastrar
                </button>
              </div>

              {/* Notifications */}
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--color-danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <ShieldCheck size={16} />
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      placeholder="voce@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)',
                        color: '#fff', fontSize: '14px', outline: 'none'
                      }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 42px 12px 42px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)',
                        color: '#fff', fontSize: '14px', outline: 'none'
                      }}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '14px', top: '15px', background: 'transparent',
                        border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {activeAuthTab === 'signup' && (
                  <div className="animate-slide-up">
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Confirmar Senha</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                          background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)',
                          color: '#fff', fontSize: '14px', outline: 'none'
                        }}
                      />
                      <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                )}

                {activeAuthTab === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => { setShowRecovery(true); setError(''); }}
                      style={{
                        background: 'transparent', border: 'none', color: 'var(--color-gold)',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '14px', display: 'flex', justifyContent: 'center',
                    fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1, marginTop: '10px'
                  }}
                >
                  {loading ? 'Carregando...' : activeAuthTab === 'login' ? 'Entrar' : 'Criar Conta'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Demo Mode Fallback Button */}
              <div style={{ borderTop: '1px solid var(--card-border)', marginTop: '20px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Não quer salvar dados na nuvem?</span>
                <button
                  onClick={enterDemoMode}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
                >
                  Continuar no Modo Local (Offline)
                </button>
              </div>
            </>
          ) : (
            /* Recovery Card */
            <div className="animate-slide-up">
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="var(--color-gold)" /> Recuperar Senha
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Digite seu e-mail cadastrado e enviaremos um link de redefinição.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--color-danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              {recoverySuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  {recoverySuccess}
                </div>
              )}

              <form onSubmit={handlePasswordRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>E-mail cadastrado</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      placeholder="voce@exemplo.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)',
                        color: '#fff', fontSize: '14px', outline: 'none'
                      }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowRecovery(false); setRecoverySuccess(''); setError(''); }}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Full Strava Profile Dashboard
  return (
    <Layout activePage="/profile">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

        {/* Strava Profile Header Card */}
        <div className="glass-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(20, 20, 23, 0.8) 0%, rgba(3, 3, 3, 0.95) 100%)',
          border: '1px solid var(--card-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar container */}
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              color: '#ffffff',
              fontSize: '36px',
              fontWeight: '800',
              fontFamily: 'Outfit'
            }}>
              {displayUserName.charAt(0)}
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '26px', fontFamily: 'Outfit', color: '#fff' }}>{displayUserName}</h2>
                <span style={{
                  fontSize: '11px',
                  background: isFirebasePending ? 'rgba(113, 113, 122, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isFirebasePending ? '#a1a1aa' : 'var(--color-gold)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isFirebasePending ? 'Atleta Local (Offline)' : 'Atleta Sincronizado'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                <MapPin size={14} /> <span>Brasil</span>
                <span style={{ margin: '0 5px', color: 'var(--text-muted)' }}>•</span>
                <span>Membro desde Junho de 2026</span>
              </div>

              {/* Levels / XP progress inside header */}
              <div style={{ maxWidth: '300px', marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Nível {stats.level}</span>
                  <span style={{ color: 'var(--color-gold)' }}>{stats.xp}/100 XP</span>
                </div>
                <div className="xp-container" style={{ height: '8px' }}>
                  <div className="xp-bar" style={{ width: `${xpPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Stat Counters Summary */}
            <div style={{
              display: 'flex',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '16px 24px',
              borderRadius: '16px',
              alignSelf: 'stretch',
              alignItems: 'center',
              justifyContent: 'space-around',
              minWidth: '260px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Atividades</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff', display: 'block', marginTop: '4px' }}>{logs.length}</span>
              </div>
              <div style={{ borderLeft: '1px solid var(--card-border)', height: '30px' }}></div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Nível</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444', display: 'block', marginTop: '4px' }}>{stats.level}</span>
              </div>
              <div style={{ borderLeft: '1px solid var(--card-border)', height: '30px' }}></div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Streak</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#f97316', display: 'block', marginTop: '4px' }}>{stats.streak}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls (Strava Feed / Sport Summary Switcher) */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--card-border)',
          gap: '20px'
        }}>
          <button
            onClick={() => setActiveSubTab('summary')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'summary' ? '3px solid var(--color-gold)' : '3px solid transparent',
              color: activeSubTab === 'summary' ? '#fff' : 'var(--text-secondary)',
              padding: '12px 10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            Estatísticas Semanais
          </button>
          <button
            onClick={() => setActiveSubTab('feed')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'feed' ? '3px solid var(--color-gold)' : '3px solid transparent',
              color: activeSubTab === 'feed' ? '#fff' : 'var(--text-secondary)',
              padding: '12px 10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            Feed de Atividades ({logs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'settings' ? '3px solid var(--color-gold)' : '3px solid transparent',
              color: activeSubTab === 'settings' ? '#fff' : 'var(--text-secondary)',
              padding: '12px 10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            Configurações
          </button>
        </div>

        {/* Tab Contents: 1. Sport Summary (Strava totals style) */}
        {activeSubTab === 'summary' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'Outfit', color: '#fff' }}>Totais de Atividade Acumulados</h3>
            
            <div className="grid-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Weightlifting Summary Card */}
              <div className="glass-card glow-musculacao" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--color-musculacao)' }}>
                    <Dumbbell size={20} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Musculação</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Treinos</span>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                      {totals.musculacao.sessions}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Séries Totais</span>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                      {totals.musculacao.sets}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', marginTop: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Volume Total de Carga</span>
                  <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: 'var(--color-musculacao)', marginTop: '4px' }}>
                    {totals.musculacao.volume.toLocaleString('pt-BR')} kg
                  </span>
                </div>
              </div>

              {/* Running Summary Card */}
              <div className="glass-card glow-corrida" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(244, 63, 94, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--color-corrida)' }}>
                    <Zap size={20} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Corrida</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Sessões</span>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                      {totals.corrida.sessions}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Tempo Ativo</span>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                      {totals.corrida.duration} min
                    </span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', marginTop: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Distância Total Percorrida</span>
                  <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: 'var(--color-corrida)', marginTop: '4px' }}>
                    {totals.corrida.distance.toFixed(2)} km
                  </span>
                </div>
              </div>

              {/* Swimming Summary Card */}
              <div className="glass-card glow-natacao" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(34, 211, 238, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--color-natacao)' }}>
                    <Waves size={20} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Natação</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Treinos</span>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                      {totals.natacao.sessions}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Tempo Ativo</span>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                      {totals.natacao.duration} min
                    </span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', marginTop: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Distância Total Nadada</span>
                  <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: 'var(--color-natacao)', marginTop: '4px' }}>
                    {totals.natacao.distance.toLocaleString('pt-BR')} metros
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Badges Shelf inside summary */}
            <div className="glass-card" style={{ marginTop: '10px' }}>
              <h3 style={{ fontSize: '16px', fontFamily: 'Outfit', color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} color="var(--color-gold)" /> Shelf de Conquistas Unlocked
              </h3>
              {stats.badges.length === 0 ? (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Você ainda não liberou conquistas. Complete treinos para destravá-las!</span>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {stats.badges.map(badgeId => (
                    <div
                      key={badgeId}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#fff',
                        fontWeight: '600'
                      }}
                      title={badgeId}
                    >
                      <span>
                        {badgeId === 'first_workout' && '🏆'}
                        {badgeId === 'heavy_lifter' && '💪'}
                        {badgeId === 'run_5k' && '⚡'}
                        {badgeId === 'swim_1k' && '🔱'}
                        {badgeId === 'streak_3' && '🔥'}
                        {badgeId === 'streak_7' && '🛡️'}
                        {badgeId === 'volume_king' && '👑'}
                      </span>
                      <span>
                        {badgeId === 'first_workout' && 'Primeiro Passo'}
                        {badgeId === 'heavy_lifter' && 'Força Suprema'}
                        {badgeId === 'run_5k' && 'Papa-Léguas'}
                        {badgeId === 'swim_1k' && 'Tritão'}
                        {badgeId === 'streak_3' && 'Fogo Inicial'}
                        {badgeId === 'streak_7' && 'Constância'}
                        {badgeId === 'volume_king' && 'Rei do Volume'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Contents: 2. Activity Feed (Strava Feed Style) */}
        {activeSubTab === 'feed' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'Outfit', color: '#fff' }}>Feed de Atividades do Atleta</h3>
            
            {logs.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--card-border)',
                borderRadius: '16px', color: 'var(--text-secondary)'
              }}>
                <Clock size={40} color="var(--text-muted)" style={{ marginBottom: '15px' }} />
                <p style={{ fontWeight: '500' }}>Nenhuma atividade registrada no feed ainda.</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px' }}>
                  Inicie e complete treinos na aba "Treinar Hoje" para alimentar seu feed Strava!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {logs.map((log) => {
                  // Determine dominant sports icon / badge in log
                  let dominantSport = 'musculacao';
                  const exTypes = log.exercises?.map(e => e.type) || [];
                  if (exTypes.includes('corrida')) dominantSport = 'corrida';
                  else if (exTypes.includes('natacao')) dominantSport = 'natacao';

                  const getSportBannerColor = (type) => {
                    switch (type) {
                      case 'musculacao': return 'rgba(167, 139, 250, 0.15)';
                      case 'corrida': return 'rgba(244, 63, 94, 0.15)';
                      case 'natacao': return 'rgba(34, 211, 238, 0.15)';
                      default: return 'rgba(255,255,255,0.05)';
                    }
                  };

                  const getSportText = (type) => {
                    switch (type) {
                      case 'musculacao': return 'Musculação 🏋️‍♂️';
                      case 'corrida': return 'Corrida 🏃‍♂️';
                      case 'natacao': return 'Natação 🏊‍♂️';
                      default: return 'Treino';
                    }
                  };

                  // Calculate key metrics (like Strava feed layout)
                  let displayMetricLabel = 'Volume';
                  let displayMetricValue = '0 kg';
                  let totalExercisesLogged = log.exercises?.length || 0;
                  let completedExercises = log.exercises?.filter(e => e.completed).length || 0;
                  let compliancePercent = totalExercisesLogged > 0 ? Math.round((completedExercises / totalExercisesLogged) * 100) : 0;

                  if (dominantSport === 'musculacao') {
                    let vol = 0;
                    log.exercises?.forEach(ex => {
                      if (ex.completed && ex.sets) {
                        ex.sets.forEach(s => {
                          vol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
                        });
                      }
                    });
                    displayMetricValue = `${vol.toLocaleString('pt-BR')} kg`;
                  } else if (dominantSport === 'corrida') {
                    displayMetricLabel = 'Distância';
                    let dist = 0;
                    log.exercises?.forEach(ex => {
                      if (ex.completed && ex.sets && ex.sets[0]) {
                        dist += parseFloat(ex.sets[0].distance) || 0;
                      }
                    });
                    displayMetricValue = `${dist.toFixed(2)} km`;
                  } else if (dominantSport === 'natacao') {
                    displayMetricLabel = 'Distância';
                    let dist = 0;
                    log.exercises?.forEach(ex => {
                      if (ex.completed && ex.sets && ex.sets[0]) {
                        dist += parseFloat(ex.sets[0].distance) || 0;
                      }
                    });
                    displayMetricValue = `${dist.toLocaleString('pt-BR')} m`;
                  }

                  const isExpanded = expandedLogId === log.id;

                  return (
                    <div key={log.id} className="glass-card animate-slide-up" style={{
                      padding: '20px',
                      background: 'rgba(18, 18, 20, 0.5)',
                      border: '1px solid var(--card-border)',
                      position: 'relative'
                    }}>
                      
                      {/* Strava feed header layout */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid var(--card-border)', paddingBottom: '14px', marginBottom: '14px' }}>
                        {/* Mini avatar */}
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '16px', fontWeight: '700', flexShrink: 0
                        }}>
                          {displayUserName.charAt(0)}
                        </div>

                        {/* Name and date */}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{displayUserName}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(log.date).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'long', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Sport badge */}
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
                          background: getSportBannerColor(dominantSport),
                          color: dominantSport === 'musculacao' ? '#c084fc' : dominantSport === 'corrida' ? '#f43f5e' : '#22d3ee'
                        }}>
                          {getSportText(dominantSport)}
                        </span>
                      </div>

                      {/* Workout Title */}
                      <h3 style={{ fontSize: '17px', fontFamily: 'Outfit', color: '#fff', marginBottom: '15px' }}>
                        Treino de {log.dayOfWeek} 💪✨
                      </h3>

                      {/* Strava Feed Metrics Grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
                        background: 'rgba(0, 0, 0, 0.2)', padding: '12px 15px', borderRadius: '12px',
                        marginBottom: '15px', textAlign: 'center'
                      }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Tempo</span>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#06b6d4', display: 'block', marginTop: '4px' }}>
                            {log.duration} min
                          </span>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{displayMetricLabel}</span>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', display: 'block', marginTop: '4px' }}>
                            {displayMetricValue}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Conclusão</span>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', display: 'block', marginTop: '4px' }}>
                            {compliancePercent}%
                          </span>
                        </div>
                      </div>

                      {/* Collapsible detail feed section */}
                      {isExpanded ? (
                        <div className="animate-slide-up" style={{
                          borderTop: '1px solid var(--card-border)', paddingTop: '15px', marginTop: '10px',
                          display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                            Lista de Exercícios Registrados:
                          </span>
                          {log.exercises?.map((ex, idx) => {
                            let detailStr = '';
                            if (ex.completed) {
                              if (ex.type === 'musculacao' && ex.sets) {
                                detailStr = `${ex.sets.length} séries completas (${ex.sets.map(s => `${s.weight}kg × ${s.reps}`).join(' | ')})`;
                              } else if (ex.type === 'corrida' && ex.sets && ex.sets[0]) {
                                detailStr = `${ex.sets[0].distance} km em ${ex.sets[0].duration} min`;
                              } else if (ex.type === 'natacao' && ex.sets && ex.sets[0]) {
                                detailStr = `${ex.sets[0].distance} m em ${ex.sets[0].duration} min`;
                              }
                            } else {
                              detailStr = 'Exercício pulado';
                            }

                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ fontWeight: '600', color: ex.completed ? '#fff' : 'var(--text-muted)', textDecoration: ex.completed ? 'none' : 'line-through' }}>
                                  {ex.name}
                                </span>
                                <span style={{ color: ex.completed ? 'var(--text-secondary)' : 'var(--color-danger)', fontSize: '11px' }}>
                                  {detailStr}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Dropdown toggle button */}
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '10px'
                        }}
                      >
                        {isExpanded ? (
                          <>Ocultar Detalhes <ChevronUp size={14} /></>
                        ) : (
                          <>Ver Detalhes do Treino <ChevronDown size={14} /></>
                        )}
                      </button>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: 3. Settings (Logout & Local Reset) */}
        {activeSubTab === 'settings' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'Outfit', color: '#fff' }}>Gerenciamento de Perfil e Ajustes</h3>
            
            {/* Account Settings */}
            <div className="glass-card">
              <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: '700', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} /> Detalhes da Conta
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>E-mail cadastrado:</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{user?.email || 'Nenhum (Modo Local Offline)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sincronização em Nuvem:</span>
                  <span style={{ fontWeight: '700', color: isFirebasePending ? 'var(--text-muted)' : 'var(--color-success)' }}>
                    {isFirebasePending ? 'Desativada (Modo Local)' : 'Ativada (Firebase)'}
                  </span>
                </div>
              </div>

              {!isFirebasePending && (
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ marginTop: '20px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', gap: '8px' }}
                >
                  <LogOut size={14} /> Sair da Conta (Logout)
                </button>
              )}
            </div>

            {/* Danger Zone: Reset Data */}
            <div className="glass-card" style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.02)',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '16px', color: 'var(--color-danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> Zona de Perigo: Redefinir Conta
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '15px' }}>
                Exclui permanentemente todos os treinos da semana, histórico de logs, troféus e sequências salvos localmente neste navegador.
              </p>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="btn-secondary"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: 'var(--color-danger)',
                  background: 'transparent'
                }}
              >
                Limpar Todos os Dados
              </button>
            </div>

            {/* Reset Confirmation Overlay Modal */}
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
                    <AlertCircle size={30} />
                  </div>

                  <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '10px', fontFamily: 'Outfit' }}>Deseja mesmo redefinir?</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '25px', lineHeight: '1.5' }}>
                    Esta ação apagará permanentemente todos os seus treinos definidos, sequência ativa ({stats.streak} dias) e troféus conquistados localmente.
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
                      style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
                    >
                      Sim, Apagar Tudo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ProfilePage;
