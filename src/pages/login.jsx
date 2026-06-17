import React, { useState } from 'react';
import { navigate } from 'gatsby';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useAuth } from '../components/AuthContext';
import { Dumbbell, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import '../components/Theme.css';

const LoginPage = () => {
  const { enterDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFirebasePending = !auth || (auth.app && auth.app.options && auth.app.options.apiKey === 'YOUR_API_KEY');
  
  // Forgot Password state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Error/Success alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (activeTab === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem!');
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          setError('Por favor, verifique seu e-mail antes de acessar.');
          await sendEmailVerification(user); // resend automatically
          navigate('/verify-email');
        } else {
          navigate('/');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setSuccess('Cadastro realizado! Um e-mail de verificação foi enviado.');
        setActiveTab('login');
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
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setError('');
    setRecoverySuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, recoveryEmail);
      setRecoverySuccess('E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.');
      setRecoveryEmail('');
    } catch (err) {
      console.error(err);
      setError('Não foi possível enviar o e-mail. Verifique se o endereço está correto.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Decorative background gradients */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(250, 252, 21, 0.1)',
        filter: 'blur(80px)',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(202, 138, 4, 0.08)',
        filter: 'blur(80px)',
        zIndex: 0
      }}></div>

      <div className="glass-card animate-pop" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        padding: '40px 30px',
        zIndex: 1
      }}>
        {/* App Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)',
            padding: '12px',
            borderRadius: '16px',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 4px 20px rgba(202, 138, 4, 0.2)'
          }}>
            <Dumbbell size={28} />
          </div>
          <h2 style={{ fontSize: '24px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
            ARENA <span style={{ color: 'var(--color-gold)' }}>FITNESS</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Acesse seus treinos e conquistas semanais
          </p>
        </div>

        {isFirebasePending && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
            color: '#d97706', padding: '15px', borderRadius: '10px', marginBottom: '25px',
            fontSize: '13px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <AlertCircle size={16} />
              <span>Conexão com Firebase Pendente</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Suas credenciais do Firebase não foram configuradas. Você pode usar o aplicativo no modo de demonstração off-line.
            </p>
            <button
              type="button"
              onClick={enterDemoMode}
              className="btn-primary"
              style={{
                padding: '8px 12px', fontSize: '12px', width: '100%', justifyContent: 'center',
                boxShadow: 'none', marginTop: '5px'
              }}
            >
              Entrar em Modo de Demonstração
            </button>
          </div>
        )}

        {/* Regular Auth Panel */}
        {!showRecovery ? (
          <>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.03)',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '25px',
              border: '1px solid var(--card-border)'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                  background: activeTab === 'login' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'login' ? '700' : '500',
                  cursor: 'pointer', fontSize: '14px', transition: 'var(--transition-smooth)'
                }}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                  background: activeTab === 'signup' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'signup' ? '700' : '500',
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

            {/* Auth Form */}
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Endereço de E-mail</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                      background: 'rgba(0,0,0,0.01)', border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                    }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Password */}
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
                      background: 'rgba(0,0,0,0.01)', border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
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

              {/* Confirm Password (only for Signup) */}
              {activeTab === 'signup' && (
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
                        background: 'rgba(0,0,0,0.01)', border: '1px solid var(--card-border)',
                        color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                      }}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              )}

              {/* Forgot password trigger (only on Login tab) */}
              {activeTab === 'login' && (
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

              {/* Submit Button */}
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
                {loading ? 'Carregando...' : activeTab === 'login' ? 'Entrar' : 'Criar Conta'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </>
        ) : (
          /* Password Recovery Panel */
          <div className="animate-slide-up">
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={20} color="var(--color-gold)" /> Recuperação de Senha
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              Digite seu endereço de e-mail abaixo. Enviaremos um link seguro para você redefinir sua senha.
            </p>

            {/* Recovery alerts */}
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
                fontSize: '13px', lineHeight: '1.4'
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
                      background: 'rgba(0,0,0,0.01)', border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
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
                  {loading ? 'Enviando...' : 'Enviar Link'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
