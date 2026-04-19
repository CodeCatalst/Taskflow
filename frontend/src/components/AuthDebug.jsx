import { useEffect, useState } from 'react';

/**
 * Debug Authentication Component
 *
 * This component helps diagnose authentication issues.
 * Add it temporarily to your app to check auth state.
 *
 * Usage: Import and add <AuthDebug /> to your main App.jsx
 */
export default function AuthDebug() {
  const [authState, setAuthState] = useState({
    hasUser: false,
    user: null,
  });

  useEffect(() => {
    const user = localStorage.getItem('user');

    setAuthState({
      hasUser: !!user,
      user: user ? JSON.parse(user) : null,
    });
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#4ade80' }}>
        Auth Debug
      </div>

      <div style={{ marginBottom: '5px' }}>
        User:{' '}
        <span style={{ color: authState.hasUser ? '#4ade80' : '#ef4444' }}>
          {authState.hasUser ? 'Present' : 'Missing'}
        </span>
      </div>

      {authState.user && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          }}
        >
          <div>Email: {authState.user.email}</div>
          <div>Role: {authState.user.role}</div>
          <div>ID: {authState.user.id}</div>
        </div>
      )}

      <button
        onClick={clearAuth}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '8px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Clear Auth & Reload
      </button>
    </div>
  );
}
