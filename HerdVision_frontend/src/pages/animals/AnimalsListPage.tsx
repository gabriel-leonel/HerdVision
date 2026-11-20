import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animalTitle, fetchHealthMap, forgetAnimal, healthOf } from '../../api/lookups';
import { animalsApi, lotsApi } from '../../api/resources';
import type { Animal } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ButtonLink, IconButton, IconLink } from '../../components/Button';
import { ChipGroup, IdTile, PageHeader, PER_PAGE_OPTIONS, TableFooter } from '../../components/Data';
import { DeleteDialog } from '../../components/DeleteDialog';
import { EmptyState, ErrorState, SkeletonRows, useToast } from '../../components/Feedback';
import { SearchField, SelectField } from '../../components/Field';
import { AnimalStatusBadge, HealthBadge } from '../../components/Status';
import { useAsync, useQueryState } from '../../hooks/useAsync';
import { useSearchInput } from '../../hooks/useSearchInput';
import { formatDate, plural } from '../../lib/format';
import { ANIMAL_STATUSES } from '../../lib/semantics';

export function AnimalsListPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useQueryState({ busca: '', lote: '', status: '', pagina: '1', por_pagina: '15' });
  const [search, setSearch] = useSearchInput(query.busca, (busca) => setQuery({ busca }));
  const [toDelete, setToDelete] = useState<Animal | null>(null);

  useEffect(() => {
    document.title = 'Animais · HerdVision';
  }, []);

  const lots = useAsync(() => lotsApi.all(), []);
  const health = useAsync(() => fetchHealthMap(), []);
  const list = useAsync(
    () =>
      animalsApi.list({
        search: query.busca,
        lot_id: query.lote,
        status: query.status,
        page: Number(query.pagina),
        per_page: Number(query.por_pagina),
      }),
    [query.busca, query.lote, query.status, query.pagina, query.por_pagina],
  );

  const meta = list.data?.meta;
  const animals = list.data?.data ?? [];
  const filtering = !!(query.busca || query.lote || query.status);
  const lotName = (animal: Animal) => animal.lot?.name ?? lots.data?.find((l) => l.id === animal.lot_id)?.name ?? '—';

  useEffect(() => {
    if (meta && animals.length === 0 && meta.current_page > 1) setQuery({ pagina: String(Math.max(1, meta.last_page)) }, { keepPage: true });
  }, [meta, animals.length, setQuery]);

  const selectedLot = lots.data?.find((l) => String(l.id) === query.lote);

  return (
    <>
      <PageHeader
        overline="Rebanho"
        title="Animais"
        subtitle={
          meta
            ? `${plural(meta.total, filtering ? 'animal encontrado' : 'animal cadastrado', filtering ? 'animais encontrados' : 'animais cadastrados')}${selectedLot ? ` em ${selectedLot.name}` : ''}`
            : 'Pesquise, filtre e acompanhe cada animal do rebanho.'
        }
        actions={
          <ButtonLink to="/animais/novo" size="page" icon="plus">
            Novo animal
          </ButtonLink>
        }
      />

      <div className="stack-24">
        <div className="filter-bar" role="search">
          <SearchField
            label="Buscar animal"
            placeholder="Identificação, nome ou raça"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fieldClassName="filter-bar__search"
          />
          <SelectField label="Lote" value={query.lote} onChange={(e) => setQuery({ lote: e.target.value })} fieldClassName="filter-bar__select">
            <option value="">Todos os lotes</option>
            {lots.data?.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.name}
              </option>
            ))}
          </SelectField>
          <div className="filter-bar__chips">
            <ChipGroup
              label="Status"
              value={query.status}
              onChange={(status) => setQuery({ status })}
              options={[{ value: '', label: 'Todos' }, ...ANIMAL_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
            />
          </div>
        </div>

        <div className="card table-card">
          {list.loading && !list.data ? (
            <div style={{ padding: 16 }}>
              <SkeletonRows rows={6} height={60} />
            </div>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} unavailableOn404 />
          ) : animals.length === 0 ? (
            <EmptyState
              icon={filtering ? 'search' : 'list'}
              title={query.busca ? `Nenhum resultado para "${query.busca}"` : 'Nenhum animal encontrado'}
              text={filtering ? 'Tente limpar os filtros ou buscar por outro termo.' : 'Cadastre o primeiro animal para começar o monitoramento.'}
              actions={
                <>
                  {filtering && (
                    <Button variant="tertiary" size="page" onClick={() => setQuery({ busca: '', lote: '', status: '' })}>
                      Limpar filtros
                    </Button>
                  )}
                  <ButtonLink to={query.lote ? `/animais/novo?lote=${query.lote}` : '/animais/novo'} size="page" icon="plus">
                    {filtering ? 'Novo animal' : 'Cadastrar primeiro animal'}
                  </ButtonLink>
                </>
              }
            />
          ) : (
            <>
              <div className="table-scroll" aria-busy={list.loading}>
                <table className="table">
                  <caption className="sr-only">Lista de animais</caption>
                  <thead>
                    <tr>
                      <th scope="col">Animal</th>
                      <th scope="col">Espécie · Raça</th>
                      <th scope="col">Lote</th>
                      <th scope="col">Nascimento</th>
                      <th scope="col">Status</th>
                      <th scope="col">Situação</th>
                      <th scope="col" className="actions-col">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((animal) => {
                      const h = healthOf(health.data, animal.id);
                      return (
                        <tr key={animal.id}>
                          <td>
                            <div className="table__primary">
                              <IdTile identification={animal.identification} health={h} size="sm" />
                              <div>
                                <Link to={`/animais/${animal.id}`} className="table__primary-title">
                                  {animalTitle(animal)}
                                </Link>
                                <p className="table__primary-sub">{animal.identification}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            {animal.species}
                            {animal.breed ? ` · ${animal.breed}` : ''}
                          </td>
                          <td>{lotName(animal)}</td>
                          <td>{formatDate(animal.birth_date)}</td>
                          <td>
                            <AnimalStatusBadge status={animal.status} />
                          </td>
                          <td>{health.loading ? <span className="c-muted">…</span> : <HealthBadge health={h} />}</td>
                          <td className="actions-col">
                            <span className="table__actions">
                              <IconLink to={`/animais/${animal.id}`} icon="eye" label={`Ver ${animalTitle(animal)}`} />
                              <IconLink to={`/animais/${animal.id}/editar`} icon="pencil" label={`Editar ${animalTitle(animal)}`} />
                              {isAdmin && (
                                <IconButton icon="trash" danger label={`Excluir ${animalTitle(animal)}`} onClick={() => setToDelete(animal)} />
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {meta && <TableFooter meta={meta} onPage={(p) => setQuery({ pagina: String(p) }, { keepPage: true })} />}
            </>
          )}
        </div>

        {meta && meta.total > 0 && (
          <div className="row" style={{ justifyContent: 'flex-end' }}>
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
        )}
      </div>

      <DeleteDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        confirmTitle={`Excluir ${toDelete ? animalTitle(toDelete) : 'animal'}?`}
        confirmText={`${toDelete?.identification ?? ''} será removido do rebanho, junto com as associações a protocolos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir animal"
        onConfirm={() => animalsApi.remove(toDelete!.id)}
        onDeleted={() => {
          toast.success(`${toDelete ? animalTitle(toDelete) : 'Animal'} excluído.`);
          if (toDelete) forgetAnimal(toDelete.id);
          setToDelete(null);
          list.reload();
        }}
        blockedTitle="Não é possível excluir o animal"
        blockedText={(_, message) => <p>{message ?? 'Existem registros vinculados a este animal.'}</p>}
      />
    </>
  );
}
