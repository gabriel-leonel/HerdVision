import { useEffect, useRef, useState } from 'react';
import { protocolsApi } from '../../api/resources';
import type { Protocol } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, IconButton } from '../../components/Button';
import { ChipGroup, PageHeader, TableFooter } from '../../components/Data';
import { DeleteDialog } from '../../components/DeleteDialog';
import { EmptyState, ErrorState, Footnote, SkeletonRows, useToast } from '../../components/Feedback';
import { SearchField } from '../../components/Field';
import { ActiveBadge, CategoryTag } from '../../components/Status';
import { useAsync, useQueryState } from '../../hooks/useAsync';
import { useSearchInput } from '../../hooks/useSearchInput';
import { formatNumber, plural } from '../../lib/format';
import { PROTOCOL_TYPES } from '../../lib/semantics';
import { ProtocolAnimals, ProtocolForm } from './ProtocolPanels';

export function ProtocolsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useQueryState({ busca: '', tipo: '', pagina: '1', protocolo: '', novo: '' });
  const [search, setSearch] = useSearchInput(query.busca, (busca) => setQuery({ busca }));
  const [toDelete, setToDelete] = useState<Protocol | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = 'Protocolos de manejo · HerdVision';
  }, []);

  const list = useAsync(
    () => protocolsApi.list({ search: query.busca, type: query.tipo, page: Number(query.pagina), per_page: 10 }),
    [query.busca, query.tipo, query.pagina],
  );

  const selectedId = query.protocolo;
  const creating = query.novo === '1';
  // O protocolo selecionado pode estar fora da página atual: busca individualmente.
  const selected = useAsync<Protocol | null>(() => (selectedId ? protocolsApi.get(selectedId) : Promise.resolve(null)), [selectedId]);

  const meta = list.data?.meta;
  const protocols = list.data?.data ?? [];
  const filtering = !!(query.busca || query.tipo);
  const panelOpen = creating || !!selectedId;

  useEffect(() => {
    if (meta && protocols.length === 0 && meta.current_page > 1) setQuery({ pagina: String(Math.max(1, meta.last_page)) }, { keepPage: true });
  }, [meta, protocols.length, setQuery]);

  function select(id: number | null, opts: { create?: boolean } = {}) {
    setQuery({ protocolo: id ? String(id) : '', novo: opts.create ? '1' : '' }, { keepPage: true });
    // Em telas estreitas o painel fica abaixo da lista.
    window.setTimeout(() => {
      if (window.matchMedia('(max-width: 1199px)').matches) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  async function deactivate(protocol: Protocol) {
    try {
      await protocolsApi.update(protocol.id, { active: false });
      toast.success(`${protocol.name} desativado.`);
      setToDelete(null);
      list.reload();
      if (String(protocol.id) === selectedId) selected.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível desativar.');
    }
  }

  return (
    <>
      <PageHeader
        overline="Manejo"
        title="Protocolos de manejo"
        subtitle={meta ? plural(meta.total, 'protocolo', 'protocolos') : 'Procedimentos sanitários, nutricionais e reprodutivos do rebanho.'}
        actions={
          <Button size="page" icon="plus" onClick={() => select(null, { create: true })}>
            Novo protocolo
          </Button>
        }
      />

      <div className={panelOpen ? 'grid-2 grid-2--wide-side' : ''}>
        <div className="stack-24">
          <div className="filter-bar" role="search">
            <SearchField
              label="Buscar protocolo"
              placeholder="Nome ou descrição"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fieldClassName="filter-bar__search"
            />
            <div className="filter-bar__chips">
              <ChipGroup
                label="Tipo"
                value={query.tipo}
                onChange={(tipo) => setQuery({ tipo }, { keepPage: false })}
                options={[{ value: '', label: 'Todos' }, ...PROTOCOL_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
              />
            </div>
          </div>

          <div className="card table-card">
            {list.loading && !list.data ? (
              <div style={{ padding: 16 }}>
                <SkeletonRows rows={5} height={64} />
              </div>
            ) : list.error ? (
              <ErrorState error={list.error} onRetry={list.reload} unavailableOn404 />
            ) : protocols.length === 0 ? (
              <EmptyState
                icon={filtering ? 'search' : 'clipboard'}
                title={query.busca ? `Nenhum resultado para "${query.busca}"` : filtering ? 'Nenhum protocolo deste tipo' : 'Nenhum protocolo cadastrado'}
                text={filtering ? 'Tente limpar os filtros.' : 'Cadastre vacinas, vermífugos, suplementação e protocolos reprodutivos.'}
                actions={
                  filtering ? (
                    <Button variant="tertiary" size="page" onClick={() => setQuery({ busca: '', tipo: '' })}>
                      Limpar filtros
                    </Button>
                  ) : (
                    <Button size="page" icon="plus" onClick={() => select(null, { create: true })}>
                      Criar primeiro protocolo
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <div className="table-scroll" aria-busy={list.loading}>
                  <table className="table">
                    <caption className="sr-only">Lista de protocolos</caption>
                    <thead>
                      <tr>
                        <th scope="col">Protocolo</th>
                        <th scope="col">Tipo</th>
                        <th scope="col" className="num-col">
                          Animais
                        </th>
                        <th scope="col">Situação</th>
                        <th scope="col" className="actions-col">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocols.map((p) => {
                        const isSelected = String(p.id) === selectedId;
                        return (
                          <tr key={p.id} className={isSelected ? 'is-selected' : undefined}>
                            <td>
                              <button
                                type="button"
                                onClick={() => select(p.id)}
                                style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', minWidth: 200 }}
                                aria-label={`Abrir ${p.name}`}
                              >
                                <span className="table__primary-title" style={{ display: 'block', color: 'var(--bark-900)' }}>
                                  {p.name}
                                </span>
                                {p.description && (
                                  <span className="table__clamp t-body-s" style={{ display: '-webkit-box', maxWidth: 360 }}>
                                    {p.description}
                                  </span>
                                )}
                              </button>
                            </td>
                            <td>
                              <CategoryTag type={p.type} />
                            </td>
                            <td className="num-col">{formatNumber(p.animals_count ?? 0)}</td>
                            <td>
                              <ActiveBadge active={p.active} />
                            </td>
                            <td className="actions-col">
                              <span className="table__actions">
                                <IconButton icon="pencil" label={`Editar ${p.name}`} onClick={() => select(p.id)} />
                                {isAdmin && <IconButton icon="trash" danger label={`Excluir ${p.name}`} onClick={() => setToDelete(p)} />}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {meta && <TableFooter meta={meta} onPage={(page) => setQuery({ pagina: String(page) }, { keepPage: true })} />}
              </>
            )}
          </div>
          <Footnote icon="lock">Somente administradores podem excluir protocolos, e apenas os que nunca foram aplicados.</Footnote>
        </div>

        {panelOpen && (
          <aside ref={panelRef} className="stack-24" aria-label="Painel do protocolo">
            <div className="elevated side-panel">
              {creating ? (
                <ProtocolForm
                  key="novo"
                  protocol={null}
                  onCancel={() => select(null)}
                  onSaved={(saved) => {
                    toast.success(`${saved.name} criado.`);
                    list.reload();
                    select(saved.id);
                  }}
                />
              ) : selected.loading && !selected.data ? (
                <SkeletonRows rows={4} height={64} />
              ) : selected.error ? (
                <ErrorState error={selected.error} onRetry={selected.reload} />
              ) : selected.data ? (
                <ProtocolForm
                  key={`${selected.data.id}-${selected.data.updated_at}`}
                  protocol={selected.data}
                  onCancel={() => select(null)}
                  onSaved={(saved) => {
                    toast.success(`${saved.name} atualizado.`);
                    selected.setData(saved);
                    list.reload();
                  }}
                />
              ) : null}
            </div>
            {!creating && selected.data && (
              <ProtocolAnimals
                protocol={selected.data}
                onChanged={() => {
                  list.reload();
                }}
              />
            )}
          </aside>
        )}
      </div>

      <DeleteDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        confirmTitle={`Excluir ${toDelete?.name ?? 'protocolo'}?`}
        confirmLabel="Excluir protocolo"
        onConfirm={() => protocolsApi.remove(toDelete!.id)}
        onDeleted={() => {
          toast.success(`${toDelete?.name ?? 'Protocolo'} excluído.`);
          if (toDelete && String(toDelete.id) === selectedId) select(null);
          setToDelete(null);
          list.reload();
        }}
        blockedCount={toDelete?.animals_count}
        blockedTitle={`Não é possível excluir ${toDelete?.name ?? 'o protocolo'}`}
        blockedText={(count, message) => (
          <p>
            {count !== null
              ? `Este protocolo foi aplicado a ${plural(count, 'animal', 'animais')}. Desative-o em vez de excluir.`
              : (message ?? 'Este protocolo já foi aplicado. Desative-o em vez de excluir.')}
          </p>
        )}
        blockedAction={toDelete && toDelete.active ? { label: 'Desativar protocolo', onClick: () => void deactivate(toDelete) } : undefined}
      />
    </>
  );
}
