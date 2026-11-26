import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { alertsApi } from '../api/resources';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Brand';
import { Icon, type IconName } from '../components/Icon';
import { isMockMode } from '../lib/config';
import { formatNumber, initials } from '../lib/format';
import { ROLE_META } from '../lib/semantics';

interface AlertCountContextValue {
  pending: number | null;
  refresh: () => void;
}

const AlertCountContext = createContext<AlertCountContextValue>({ pending: null, refresh: () => undefined });
export const useAlertCount = () => useContext(AlertCountContext);

const NAV: { to: string; label: string; icon: IconName; end?: boolean; counter?: boolean }[] = [
  { to: '/', label: 'Painel', icon: 'home', end: true },
  { to: '/animais', label: 'Animais', icon: 'list' },
  { to: '/lotes', label: 'Lotes', icon: 'layers' },
  { to: '/protocolos', label: 'Protocolos', icon: 'clipboard' },
  { to: '/alertas', label: 'Alertas', icon: 'bell', counter: true },
];

export function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const refresh = useCallback(() => {
    alertsApi.count({ status: 'Pendente' }).then(setPending, () => setPending(null));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    refresh();
  }, [location.pathname, refresh]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  if (!user) return null;

  return (
    <AlertCountContext.Provider value={{ pending, refresh }}>
      <div className="app-shell">
        <a href="#conteudo" className="sr-only">
          Pular para o conteúdo
        </a>

        <div className="topbar">
          <Logo variant="reverse" symbolSize={32} wordSize={20} />
          <button
            type="button"
            className="icon-btn"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
          </button>
        </div>

        {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

        <aside className="sidebar" id="menu-principal" data-open={menuOpen}>
          <div className="sidebar__brand">
            <Logo variant="reverse" symbolSize={36} wordSize={22} />
          </div>

          <nav className="sidebar__nav" aria-label="Navegação principal">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-item">
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
                {item.counter && pending !== null && pending > 0 && (
                  <span className="nav-item__count" aria-label={`${pending} alertas pendentes`}>
                    {formatNumber(pending)}
                  </span>
                )}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <p className="sidebar__group-label">Administração</p>
                <NavLink to="/usuarios" className="nav-item">
                  <Icon name="users" size={20} />
                  <span>Usuários</span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="sidebar__footer">
            {isMockMode && (
              <p className="sidebar__mode">
                <strong>Modo demonstração.</strong> Dados simulados, salvos só neste navegador.
              </p>
            )}
            <div className="sidebar__user">
              <span className="avatar" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="sidebar__user-name" style={{ display: 'block' }}>
                  {user.name}
                </span>
                <span className="sidebar__user-role">{ROLE_META[user.role]?.label ?? user.role}</span>
              </span>
            </div>
            <button type="button" className="nav-item sidebar__logout" onClick={() => void logout()}>
              <Icon name="logout" size={20} />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        <main className="main" id="conteudo" tabIndex={-1}>
          <div className="content">
            <Outlet />
          </div>
        </main>
      </div>
    </AlertCountContext.Provider>
  );
}
