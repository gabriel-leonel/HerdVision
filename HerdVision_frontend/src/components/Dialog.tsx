import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: IconName;
  intent?: 'critical' | 'attention' | 'info' | 'success';
  /** `alertdialog` quando bloqueia ou confirma algo destrutivo (§6.17). */
  role?: 'dialog' | 'alertdialog';
  wide?: boolean;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, children, actions, icon, intent = 'info', role = 'dialog', wide }: DialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Foco inicial: primeiro campo, senão a primeira ação (geralmente "Cancelar"/"Fechar").
    const first =
      panel?.querySelector<HTMLElement>('input, select, textarea') ?? panel?.querySelector<HTMLElement>('.dialog__actions button') ?? panel;
    first?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && role === 'dialog') onClose();
      }}
    >
      <div
        ref={panelRef}
        className={['dialog', wide ? 'dialog--wide' : ''].join(' ')}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
      >
        {icon && (
          <span className={`icon-circle icon-circle--${intent}`} style={{ width: 48, height: 48, marginBottom: 16 }}>
            <Icon name={icon} size={22} />
          </span>
        )}
        <h2 id={titleId} className="t-h2">
          {title}
        </h2>
        {children && (
          <div id={bodyId} className="dialog__text t-body-l">
            {children}
          </div>
        )}
        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
