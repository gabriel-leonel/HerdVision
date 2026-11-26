import { useEffect, useState, type ReactNode } from 'react';
import { isApiError } from '../lib/http';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Banner } from './Feedback';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  /** "Excluir Lote D?" */
  confirmTitle: string;
  confirmText?: ReactNode;
  confirmLabel: string;
  /** Executa o DELETE. */
  onConfirm: () => Promise<void>;
  onDeleted: () => void;
  /** Quando já se sabe que há vínculos (ex.: `animals_count > 0`), abre direto no bloqueio. */
  blockedCount?: number;
  blockedTitle: string;
  /** Texto do bloqueio, a partir da quantidade e da mensagem do backend (409). */
  blockedText: (count: number | null, serverMessage: string | null) => ReactNode;
  blockedAction?: { label: string; onClick: () => void };
}

/**
 * Confirmação de exclusão que vira diálogo de bloqueio quando o backend responde 409 (§9, Diálogo 409).
 */
export function DeleteDialog(props: DeleteDialogProps) {
  const { open, onClose, confirmTitle, confirmText, confirmLabel, onConfirm, onDeleted, blockedCount, blockedTitle, blockedText, blockedAction } =
    props;
  const [blocked, setBlocked] = useState<{ count: number | null; message: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBlocked(blockedCount && blockedCount > 0 ? { count: blockedCount, message: null } : null);
      setError(null);
      setBusy(false);
    }
  }, [open, blockedCount]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onDeleted();
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        const count = typeof err.data.animals_count === 'number' ? err.data.animals_count : null;
        setBlocked({ count, message: err.message });
      } else {
        setError(err instanceof Error ? err.message : 'Não foi possível excluir.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (blocked) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        role="alertdialog"
        icon="warn"
        intent="critical"
        title={blockedTitle}
        actions={
          <>
            <Button variant="tertiary" size="page" onClick={onClose}>
              Fechar
            </Button>
            {blockedAction && (
              <Button size="page" onClick={blockedAction.onClick}>
                {blockedAction.label}
              </Button>
            )}
          </>
        }
      >
        {blockedText(blocked.count, blocked.message)}
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      role="alertdialog"
      icon="trash"
      intent="critical"
      title={confirmTitle}
      actions={
        <>
          <Button variant="tertiary" size="page" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" size="page" onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="stack-12">
        <p>{confirmText ?? 'Esta ação não pode ser desfeita.'}</p>
        {error && <Banner>{error}</Banner>}
      </div>
    </Dialog>
  );
}
