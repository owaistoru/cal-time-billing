// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Check for an existing token on initial app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setReady(true);
      return;
    }
    api.get('/api/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => {
        // If token is invalid, clear it
        clearAuthToken();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    login: async (email, password) => {
      const r = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', r.data.token);
      setUser(r.data.user);
      return r.data.user;
    },
    register: async (email, password, full_name) => {
      const payload = { email, password };
      if (full_name) payload.full_name = full_name;
      const r = await api.post('/api/auth/register', payload);
      localStorage.setItem('token', r.data.token);
      setUser(r.data.user);
      return r.data.user;
    },
    logout: async () => {
      try {
        // Inform the server of logout (best effort)
        await api.post('/api/auth/logout');
      } catch (e) {
        console.error('Logout API call failed', e);
      } finally {
        // Always clear token and user state on the client
        clearAuthToken();
        setUser(null);
      }
    }
  }), [user]);

  // Render children only when auth status is resolved
  if (!ready) {
    return <div className="card" style={{ padding: 24 }}>Authenticating…</div>;
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}