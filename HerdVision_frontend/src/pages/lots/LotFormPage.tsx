import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lotsApi } from '../../api/resources';
import type { Lot } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ButtonLink } from '../../components/Button';
import { DataList, PageHeader } from '../../components/Data';
import { Banner, ErrorState, Footnote, Skeleton, useToast } from '../../components/Feedback';
import { RequiredLegend, TextAreaField, TextField } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { useAsync } from '../../hooks/useAsync';
import { formatDateTime, formatNumber, plural } from '../../lib/format';
import { isApiError } from '../../lib/http';
import { LotDeleteDialog } from './LotDeleteDialog';

const NAME_MAX = 255;
const DESCRIPTION_MAX = 5000;

type Errors = { name?: string; description?: string };

export function LotFormPage() {
  const { id } = useParams();
  const editing = id !== undefined;
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const lot = useAsync<Lot | null>(() => (editing ? lotsApi.get(id) : Promise.resolve(null)), [id]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (lot.data) {
      setName(lot.data.name);
      setDescription(lot.data.description ?? '');
    }
  }, [lot.data]);

  useEffect(() => {
    document.title = `${editing ? (lot.data?.name ?? 'Editar lote') : 'Novo lote'} · HerdVision`;
  }, [editing, lot.data]);

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Informe o nome do lote.';
    else if (name.trim().length > NAME_MAX) e.name = `O nome pode ter no máximo ${NAME_MAX} caracteres.`;
    if (description.length > DESCRIPTION_MAX) e.description = `A descrição pode ter no máximo ${formatNumber(DESCRIPTION_MAX)} caracteres.`;
    return e;
  }

  function focusFirst(e: Errors) {
    if (e.name) nameRef.current?.focus();
    else if (e.description) descriptionRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const localErrors = validate();
    setErrors(localErrors);
    if (Object.keys(localErrors).length) return focusFirst(localErrors);

    // Descrição vazia é enviada como null para limpar o campo (atualização parcial).
    const payload = { name: name.trim(), description: description.trim() ? description.trim() : null };
    setSaving(true);
    try {
      if (editing) {
        const updated = await lotsApi.update(id, payload);
        toast.success(`${updated.name} atualizado.`);
      } else {
        const created = await lotsApi.create(payload);
        toast.success(`${created.name} criado.`);
      }
      navigate('/lotes');
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        const f = error.fieldErrors;
        const mapped = { name: f.name, description: f.description };
        setErrors(mapped);
        if (!mapped.name && !mapped.description) setBanner(error.message);
        focusFirst(mapped);
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível salvar o lote.');
      }
    } finally {
      setSaving(false);
    }
  }

  const breadcrumb = [
    { to: '/lotes', label: 'Lotes' },
    { to: '#', label: editing ? (lot.data?.name ?? 'Editar lote') : 'Novo lote' },
  ];

  if (editing && lot.error) {
    return (
      <>
        <PageHeader breadcrumb={breadcrumb} title="Editar lote" />
        <div className="card">
          <ErrorState error={lot.error} onRetry={lot.reload} backTo={{ to: '/lotes', label: 'Voltar para lotes' }} />
        </div>
      </>
    );
  }

  const count = lot.data?.animals_count ?? 0;

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumb}
        title={editing ? (lot.data?.name ?? 'Editar lote') : 'Novo lote'}
        subtitle={editing ? 'Atualize o nome e a descrição do lote.' : 'Crie um grupo para organizar os animais por manejo.'}
      />

      <div className={editing ? 'grid-2' : ''} style={editing ? undefined : { maxWidth: 760 }}>
        <form className="card form-card" onSubmit={handleSubmit} noValidate aria-busy={editing && lot.loading}>
          <div className="form-card__body stack-20 form-stack">
            <RequiredLegend />
            {banner && <Banner>{banner}</Banner>}
            {editing && lot.loading ? (
              <>
                <Skeleton height={76} />
                <Skeleton height={160} />
              </>
            ) : (
              <>
                <TextField
                  ref={nameRef}
                  label="Nome do lote"
                  placeholder="Ex.: Lote B · Recria"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                  }}
                  error={errors.name}
                  help="Use um nome fácil de reconhecer no campo."
                  maxLength={NAME_MAX}
                  required
                />
                <TextAreaField
                  ref={descriptionRef}
                  label="Descrição"
                  placeholder="Pasto, fase de criação, observações de manejo…"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((er) => ({ ...er, description: undefined }));
                  }}
                  error={errors.description}
                  help="Opcional."
                  maxChars={DESCRIPTION_MAX}
                  rows={5}
                />
              </>
            )}
          </div>
          <div className="form-card__footer">
            <ButtonLink to="/lotes" variant="tertiary" size="page">
              Cancelar
            </ButtonLink>
            <Button type="submit" size="page" loading={saving} disabled={editing && lot.loading}>
              {editing ? 'Salvar alterações' : 'Salvar lote'}
            </Button>
          </div>
        </form>

        {editing && (
          <aside className="stack-24 sticky-side" aria-label="Informações do lote">
            <section className="card card--padded stack-12">
              <p className="c-secondary">Animais neste lote</p>
              {lot.loading ? <Skeleton height={38} width={80} /> : <p className="t-kpi num">{formatNumber(count)}</p>}
              <Link to={`/animais?lote=${id}`} className="text-action" style={{ paddingLeft: 0 }}>
                Ver animais do lote <Icon name="chevR" size={16} />
              </Link>
              {lot.data && (
                <DataList
                  single
                  items={[
                    { label: 'Criado em', value: formatDateTime(lot.data.created_at) },
                    { label: 'Última atualização', value: formatDateTime(lot.data.updated_at) },
                  ]}
                />
              )}
            </section>

            <section className="card card--padded stack-12" style={{ borderColor: 'var(--red-100)' }}>
              <h2 className="t-h3">Excluir lote</h2>
              <p className="c-secondary">
                {count > 0
                  ? `Este lote possui ${plural(count, 'animal', 'animais')}. Mova ou remova os animais antes de excluir.`
                  : 'O lote está vazio e pode ser excluído. Esta ação não pode ser desfeita.'}
              </p>
              <Button variant="destructive" size="page" icon="trash" disabled={!isAdmin || count > 0 || lot.loading} onClick={() => setDeleteOpen(true)}>
                Excluir lote
              </Button>
              {!isAdmin && <Footnote icon="lock">Disponível apenas para administradores.</Footnote>}
            </section>
          </aside>
        )}
      </div>

      {editing && (
        <LotDeleteDialog
          lot={deleteOpen && lot.data ? lot.data : null}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            toast.success(`${lot.data?.name ?? 'Lote'} excluído.`);
            navigate('/lotes');
          }}
        />
      )}
    </>
  );
}
