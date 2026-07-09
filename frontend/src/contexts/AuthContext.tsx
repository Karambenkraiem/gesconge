'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../lib/api';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (matricule: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      // refresh from server
      authAPI.getProfile().then(r => {
        setUser(r.data);
        localStorage.setItem('user', JSON.stringify(r.data));
      }).catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (matricule: string, password: string) => {
    const res = await authAPI.login(matricule, password);
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshProfile = async () => {
    const res = await authAPI.getProfile();
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
