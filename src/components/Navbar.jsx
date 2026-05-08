import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('');

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';
  const showAvatar = Boolean(user?.avatar) && failedAvatarUrl !== user.avatar;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav style={{
      minHeight: '72px',
      background: 'rgba(13, 17, 26, 0.82)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(18px)',
    }}>
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, var(--accent), var(--accent-strong))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '800',
          color: 'white',
          fontFamily: 'DM Mono, monospace',
          boxShadow: '0 10px 24px rgba(59, 130, 246, 0.24)',
        }}>
          AI
        </div>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          letterSpacing: '-0.4px',
        }}>
          RecruiterAI
        </span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            background: 'rgba(18, 24, 38, 0.9)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
          }}>
            {showAvatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={() => setFailedAvatarUrl(user.avatar)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-strong)',
                }}
              />
            ) : (
              <div
                aria-label={user.name}
                title={user.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                {userInitial}
              </div>
            )}
            <span style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}>
              {user.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="ui-button ui-button-secondary"
            style={{
              minHeight: '42px',
              padding: '0 16px',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
