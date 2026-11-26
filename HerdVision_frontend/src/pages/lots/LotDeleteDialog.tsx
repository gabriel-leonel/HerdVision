import { useNavigate } from 'react-router-dom';
import { lotsApi } from '../../api/resources';
import type { Lot } from '../../api/types';
import { DeleteDialog } from '../../components/DeleteDialog';
import { plural } from '../../lib/format';

interface LotDeleteDialogProps {
  lot: Pick<Lot, 'id' | 'name' | 'animals_count'> | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function LotDeleteDialog({ lot, onClose, onDeleted }: LotDeleteDialogProps) {
  const navigate = useNavigate();
  return (
    <DeleteDialog
      open={!!lot}
      onClose={onClose}
      confirmTitle={`Excluir ${lot?.name ?? 'lote'}?`}
      confirmLabel="Excluir lote"
      onConfirm={() => lotsApi.remove(lot!.id)}
      onDeleted={onDeleted}
      blockedCount={lot?.animals_count}
      blockedTitle={`Não é possível excluir ${lot?.name ?? 'o lote'}`}
      blockedText={(count, message) => (
        <p>
          {count !== null
            ? `Este lote possui ${plural(count, 'animal', 'animais')}. Mova ou remova os animais antes de excluir.`
            : (message ?? 'Este lote possui animais. Mova ou remova os animais antes de excluir.')}
        </p>
      )}
      blockedAction={lot ? { label: 'Ver animais do lote', onClick: () => navigate(`/animais?lote=${lot.id}`) } : undefined}
    />
  );
}
