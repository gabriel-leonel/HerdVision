import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lotsApi } from '../../api/resources';
import type { Lot } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ButtonLink, IconButton, IconLink } from '../../components/Button';
import { PageHeader, PER_PAGE_OPTIONS, TableFooter } from '../../components/Data';
import { EmptyState, ErrorState, Footnote, SkeletonRows, useToast } from '../../components/Feedback';
import { SearchField, SelectField } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { useAsync, useQueryState } from '../../hooks/useAsync';
import { useSearchInput } from '../../hooks/useSearchInput';
import { formatDate, formatNumber, plural } from '../../lib/format';
import { LotDeleteDialog } from './LotDeleteDialog';

export function LotsListPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useQueryState({ busca: '', pagina: '1', por_pagina: '15' });
  const [search, setSearch] = useSearchInput(query.busca, (busca) => setQuery({ busca }));
  const [toDelete, setToDelete] = useState<Lot | null>(null);

  useEffect(() => {
    document.title = 'Lotes · HerdVision';
  }, []);

  const list = useAsync(
    () => lotsApi.list({ search: query.busca, page: Number(query.pagina), per_page: Number(query.por_pagina) }),
    [query.busca, query.pagina, query.por_pagina],
  );

  const meta = list.data?.meta;
  const lots = list.data?.data ?? [];
  const filtering = !!query.busca;

  // Depois de excluir o último item de uma página, volta para a última página existente.
  useEffect(() => {
    if (meta && lots.length === 0 && meta.current_page > 1) setQuery({ pagina: String(Math.max(1, meta.last_page)) }, { keepPage: true });
  }, [meta, lots.length, setQuery]);

  return (
    <>
      <PageHeader
        overline="Rebanho"
        title="Lotes"
        subtitle={meta ? `${plural(meta.total, 'lote cadastrado', 'lotes cadastrados')}` : 'Organize os animais em grupos de manejo.'}
        actions={
          <ButtonLink to="/lotes/novo" size="page" icon="plus">
            Novo lote
          </ButtonLink>
        }
      />

      <div className="stack-24">
        <div className="filter-bar" role="search">
          <SearchField
            label="Buscar lote"
            placeholder="Nome ou descrição"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fieldClassName="filter-bar__search"
          />
          <SelectField
            label="Itens por página"
            value={query.por_pagina}
            onChange={(e) => setQuery({ por_pagina: e.target.value })}
            fieldClassName="filter-bar__select"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="card table-card">
          {list.loading && !list.data ? (
            <div style={{ padding: 16 }}>
              <SkeletonRows rows={6} />
            </div>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : lots.length === 0 ? (
            filtering ? (
              <EmptyState
                title={`Nenhum resultado para "${query.busca}"`}
                text="Confira a grafia ou busque por outro termo."
                actions={
                  <Button variant="tertiary" size="page" onClick={() => setQuery({ busca: '' })}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon="layers"
                title="Nenhum lote cadastrado"
                text="Lotes agrupam os animais por manejo, pasto ou fase. Todo animal pertence a um lote."
                actions={
                  <ButtonLink to="/lotes/novo" size="page" icon="plus">
                    Criar primeiro lote
                  </ButtonLink>
                }
              />
            )
          ) : (
            <>
              <div className="table-scroll" aria-busy={list.loading}>
                <table className="table">
                  <caption className="sr-only">Lista de lotes</caption>
                  <thead>
                    <tr>
                      <th scope="col">Lote</th>
                      <th scope="col">Descrição</th>
                      <th scope="col" className="num-col">
                        Animais
                      </th>
                      <th scope="col">Criado em</th>
                      <th scope="col" className="actions-col">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((lot) => (
                      <tr key={lot.id}>
                        <td>
                          <div className="table__primary">
                            <span className="id-tile id-tile--sm id-tile--lot" aria-hidden="true">
                              <Icon name="layers" size={20} />
                            </span>
                            <Link to={`/lotes/${lot.id}`} className="table__primary-title">
                              {lot.name}
                            </Link>
                          </div>
                        </td>
                        <td>
                          <span className="table__clamp">{lot.description || <span className="c-muted">Sem descrição</span>}</span>
                        </td>
                        <td className="num-col">
                          <Link to={`/animais?lote=${lot.id}`} aria-label={`Ver ${plural(lot.animals_count ?? 0, 'animal', 'animais')} de ${lot.name}`}>
                            {formatNumber(lot.animals_count ?? 0)}
                          </Link>
                        </td>
                        <td>{formatDate(lot.created_at)}</td>
                        <td className="actions-col">
                          <span className="table__actions">
                            <IconLink to={`/lotes/${lot.id}`} icon="pencil" label={`Editar ${lot.name}`} />
                            {isAdmin && <IconButton icon="trash" danger label={`Excluir ${lot.name}`} onClick={() => setToDelete(lot)} />}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && <TableFooter meta={meta} onPage={(p) => setQuery({ pagina: String(p) }, { keepPage: true })} />}
            </>
          )}
        </div>

        <Footnote icon="lock">Somente administradores podem excluir lotes, e apenas lotes sem animais.</Footnote>
      </div>

      <LotDeleteDialog
        lot={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={() => {
          toast.success(`${toDelete?.name ?? 'Lote'} excluído.`);
          setToDelete(null);
          list.reload();
        }}
      />
    </>
  );
}
