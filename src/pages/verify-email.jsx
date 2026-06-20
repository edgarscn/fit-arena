import React, { useState, useEffect } from 'react';
import { navigate } from 'gatsby';
import { auth, isFirebasePending } from '../utils/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { Mail, RefreshCw, LogOut, ShieldAlert, CheckCircle } from 'lucide-react';
import '../components/Theme.css';

const VerifyEmailPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || isFirebasePending) return;
    
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email || '');
      
      // If already verified, redirect home
      if (currentUser.emailVerified) {
        navigate('/');
      }
    } else {
      navigate('/login');
    }
  }, []);

  const handleCheckVerification = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Force reload the user profile to fetch updated emailVerified status from Firebase
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          navigate('/');
        } else {
          setError('O e-mail ainda não foi verificado. Verifique sua caixa de entrada e spam.');
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao verificar status. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setSuccess('E-mail de verificação reenviado com sucesso!');
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError('Não foi possível reenviar o e-mail no momento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (isFirebasePending) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="glass-card animate-pop" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        textAlign: 'center',
        padding: '40px 30px'
      }}>
        <div style={{
          background: 'rgba(202, 138, 4, 0.1)',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: 'var(--color-gold)'
        }}>
          <Mail size={36} />
        </div>

        <h2 style={{ fontSize: '24px', fontFamily: 'Outfit', color: 'var(--text-primary)', marginBottom: '10px' }}>
          Verifique seu E-mail 📧
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
          Enviamos um e-mail de confirmação para:<br />
          <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
        </p>

        {/* Info/Warning banners */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
            fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px',
            fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Já verifiquei meu e-mail
          </button>

          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}
          >
            Reenviar e-mail de confirmação
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontSize: '13px', cursor: 'pointer', marginTop: '10px', alignSelf: 'center'
            }}
          >
            <LogOut size={14} /> Sair / Trocar de conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
