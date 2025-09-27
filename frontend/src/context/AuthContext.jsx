import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setReady(true); return; }
    api.get('/api/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
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
    logout: () => {
      localStorage.removeItem('token');
      setUser(null);
    }
  }), [user]);

  if (!ready) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
