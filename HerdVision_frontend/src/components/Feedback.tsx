import { createContext, useCallback, useContext, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '../lib/http';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

// ---------------- Banner e nota ----------------
export function Banner({ kind = 'error', children, icon }: { kind?: 'error' | 'info' | 'success'; children: ReactNode; icon?: IconName }) {
  const defaultIcon: IconName = kind === 'error' ? 'warn' : kind === 'success' ? 'check' : 'info';
  return (
    <div className={`banner banner--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon name={icon ?? defaultIcon} size={18} />
      <div>{children}</div>
    </div>
  );
}

export function Footnote({ children, icon = 'info' }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className="footnote">
      <Icon name={icon} size={14} />
      <span>{children}</span>
    </p>
  );
}

export const VET_NOTE = 'Alertas indicam condições que merecem avaliação e não substituem o diagnóstico veterinário.';

// ---------------- Esqueletos ----------------
export function Skeleton({ height = 16, width = '100%', radius, style }: { height?: number; width?: number | string; radius?: number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 5, height = 56 }: { rows?: number; height?: number }) {
  return (
    <div className="stack-8" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} radius={12} />
      ))}
    </div>
  );
}

// ---------------- Estados vazios e de página ----------------
interface EmptyStateProps {
  icon?: IconName;
  title: string;
  text?: ReactNode;
  actions?: ReactNode;
  tone?: 'neutral' | 'success' | 'critical';
}

export function EmptyState({ icon = 'search', title, text, actions, tone = 'neutral' }: EmptyStateProps) {
  const color = tone === 'success' ? 'var(--forest-500)' : tone === 'critical' ? 'var(--red-600)' : undefined;
  return (
    <div className="empty-state">
      <span className="empty-state__icon" style={color ? { color } : undefined}>
        <Icon name={icon} size={48} />
      </span>
      <h2 className="t-h3">{title}</h2>
      {text && <p className="empty-state__text">{text}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  backTo?: { to: string; label: string };
  /** Recurso ainda não exposto pelo backend (rota prevista 🕓): 404 na listagem. */
  unavailableOn404?: boolean;
}

/** Converte erros da API em estados de página (§10). */
export function ErrorState({ error, onRetry, backTo, unavailableOn404 }: ErrorStateProps) {
  const status = isApiError(error) ? error.status : -1;
  const message = error instanceof Error ? error.message : 'Algo deu errado.';

  if (status === 403) {
    return <EmptyState icon="lock" title="Acesso restrito" text={message} actions={backTo && <BackLink {...backTo} />} />;
  }
  if (status === 404 && unavailableOn404) {
    return (
      <EmptyState
        icon="clock"
        title="Recurso ainda não disponível"
        text="O backend ainda não expõe esta rota. A tela já está pronta e passa a funcionar assim que o endpoint for publicado."
        actions={onRetry && <Button variant="secondary" size="page" onClick={onRetry}>Tentar de novo</Button>}
      />
    );
  }
  if (status === 404) {
    return <EmptyState icon="search" title="Não encontrado" text={message} actions={backTo && <BackLink {...backTo} />} />;
  }
  return (
    <EmptyState
      icon="warn"
      tone="critical"
      title={status === 0 ? 'Sem conexão com o servidor' : 'Não foi possível carregar'}
      text={message}
      actions={
        <>
          {onRetry && (
            <Button variant="secondary" size="page" icon="rotate" onClick={onRetry}>
              Tentar de novo
            </Button>
          )}
          {backTo && <BackLink {...backTo} />}
        </>
      }
    />
  );
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="btn btn--tertiary btn--page">
      <Icon name="chevL" size={18} />
      {label}
    </Link>
  );
}

// ---------------- Toast ----------------
type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}
interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (kind: ToastKind, message: string) => {
      counter.current += 1;
      const id = counter.current;
      setItems((list) => [...list.slice(-2), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <span className="toast__icon" aria-hidden="true">
              <Icon name={t.kind === 'success' ? 'check' : t.kind === 'error' ? 'warn' : 'info'} size={16} />
            </span>
            <span className="toast__text">{t.message}</span>
            <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={() => dismiss(t.id)}>
              <Icon name="x" size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
