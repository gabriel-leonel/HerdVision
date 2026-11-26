import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/resources';
import { forgetAnimal } from '../api/lookups';
import type { AuthResponse, Role, User } from '../api/types';
import { configureHttp } from '../lib/http';
import { useToast } from '../components/Feedback';

interface Session {
  token: string;
  user: User;
  /** Momento de expiração em ms (a partir de `expires_in`). */
  expiresAt: number;
}

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  hasRole: (...roles: Role[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = 'herdvision.session';
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.token || !session.user || session.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function toSession(response: AuthResponse): Session {
  const ttl = Number(response.expires_in) > 0 ? Number(response.expires_in) : 3600;
  return { token: response.access_token, user: response.user, expiresAt: Date.now() + ttl * 1000 };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const navigate = useNavigate();
  const toast = useToast();

  const persist = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // armazenamento indisponível: mantém só em memória
    }
  }, []);

  const expire = useCallback(() => {
    if (!sessionRef.current) return;
    persist(null);
    forgetAnimal();
    navigate('/login?sessao=expirada', { replace: true });
  }, [navigate, persist]);

  // O cliente HTTP lê o token atual e avisa quando a API responde 401. Configurado durante
  // o render (e não em useEffect) porque os efeitos das páginas filhas rodam antes dos do provider.
  configureHttp({ getToken: () => sessionRef.current?.token ?? null, onUnauthorized: expire });

  // Expira localmente quando o JWT vence (JWT_TTL).
  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt - Date.now();
    const timer = window.setTimeout(expire, Math.max(0, Math.min(ms, 2 ** 31 - 1)));
    return () => window.clearTimeout(timer);
  }, [session, expire]);

  const login = useCallback(async (email: string, password: string) => persist(toSession(await authApi.login(email, password))), [persist]);

  const register = useCallback(
    async (name: string, email: string, password: string) => persist(toSession(await authApi.register(name, email, password))),
    [persist],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // mesmo se o servidor falhar, a sessão local é encerrada
    }
    persist(null);
    forgetAnimal();
    navigate('/login', { replace: true });
    toast.info('Você saiu da sua conta.');
  }, [navigate, persist, toast]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      user,
      isAdmin: user?.role === 'admin',
      hasRole: (...roles) => !!user && roles.includes(user.role),
      login,
      register,
      logout,
    };
  }, [session, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

/** Rotas protegidas: sem sessão válida, vai para o Login (§7.3). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

/** Telas públicas: quem já está logado vai ao Painel. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
