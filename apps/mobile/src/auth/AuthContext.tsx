import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '../api/client';
import { clearSession, getStoredUser, getToken, saveSession, StoredUser } from './storage';

type AuthContextValue = {
  user: StoredUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedToken = await getToken();
      const storedUser = await getStoredUser();
      if (!storedToken || !storedUser) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        await api.getCurrentUser(storedToken);
        if (!cancelled) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        if (err instanceof api.ApiRequestError && err.status === 401) {
          await clearSession();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    const nextUser: StoredUser = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
    };
    await saveSession(response.access_token, nextUser);
    setToken(response.access_token);
    setUser(nextUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await api.register(name, email, password);
    const nextUser: StoredUser = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
    };
    await saveSession(response.access_token, nextUser);
    setToken(response.access_token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // Clear local session even if API logout fails.
      }
    }
    await clearSession();
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
