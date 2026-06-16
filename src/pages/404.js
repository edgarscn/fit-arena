import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'gatsby';
import { ShieldAlert } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <Layout activePage="/404">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '20px',
          borderRadius: '50%',
          color: 'var(--color-danger)',
          marginBottom: '20px'
        }}>
          <ShieldAlert size={48} />
        </div>
        <h2 style={{ fontSize: '32px', fontFamily: 'Outfit', marginBottom: '10px' }}>Página Não Encontrada</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '30px', maxWidth: '400px' }}>
          O caminho que você tentou acessar não existe ou foi movido.
        </p>
        <Link to="/" className="btn-primary">
          Voltar para o Dashboard
        </Link>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
