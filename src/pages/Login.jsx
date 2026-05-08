import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const bgGlow = {
    position: 'absolute',
    width: '720px',
    height: '720px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 68%)',
    top: '42%',
    left: '50%',
    transform: 'translate(-50%, -42%)',
    pointerEvents: 'none',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '480px',
    padding: '52px 44px',
    background: 'linear-gradient(180deg, rgba(18, 24, 38, 0.96), rgba(14, 19, 31, 0.96))',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    textAlign: 'left',
    position: 'relative',
    boxShadow: 'var(--shadow-soft)',
    backdropFilter: 'blur(14px)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
    }}>
      <div style={bgGlow} />

      <div className="animate-fade-up" style={cardStyle}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          background: 'linear-gradient(180deg, var(--accent), var(--accent-strong))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          fontSize: '18px',
          fontWeight: '800',
          color: 'white',
          fontFamily: 'DM Mono, monospace',
          boxShadow: '0 14px 32px rgba(59, 130, 246, 0.25)',
        }}>
          AI
        </div>

        <p className="ui-eyebrow" style={{ marginBottom: '14px' }}>
          Recruiter workspace
        </p>

        <h1 style={{
          fontSize: '40px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          marginBottom: '12px',
          letterSpacing: '-1.2px',
          lineHeight: 1.05,
        }}>
          RecruiterAI
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '17px',
          marginBottom: '36px',
          lineHeight: '1.7',
          maxWidth: '34ch',
        }}>
          Intelligent resume screening and candidate analysis in a cleaner, calmer workspace built for fast hiring decisions.
        </p>

        <a
          href={`${import.meta.env.VITE_API_URL}/auth/google`}
          className="ui-button ui-button-secondary"
          style={{ width: '100%', textDecoration: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </a>

        <p style={{
          marginTop: '22px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.2px',
        }}>
          For recruiters and hiring teams only
        </p>
      </div>
    </div>
  );
}
