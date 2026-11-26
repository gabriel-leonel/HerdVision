import { useEffect, useRef } from 'react';
import { animalLabel, getAnimalsByIds } from '../../api/lookups';
import { alertsApi } from '../../api/resources';
import type { AlertStatus } from '../../api/types';
import { Button } from '../../components/Button';
import { AlertCard, ChipGroup, PageHeader, Pagination } from '../../components/Data';
import { EmptyState, ErrorState, Footnote, SkeletonRows, VET_NOTE } from '../../components/Feedback';
import { SearchField, SelectField } from '../../components/Field';
import { useAsync, useQueryState } from '../../hooks/useAsync';
import { useSearchInput } from '../../hooks/useSearchInput';
import { formatNumber, plural } from '../../lib/format';
import { ALERT_STATUSES, ALERT_STATUS_META, SEVERITY } from '../../lib/semantics';
import { useAlertCount } from '../../layouts/AppLayout';
import { AlertDetail } from './AlertDetail';

const PER_PAGE = 10;

export function AlertsPage() {
  const [query, setQuery] = useQueryState({ busca: '', status: '', gravidade: '', pagina: '1', alerta: '' });
  const [search, setSearch] = useSearchInput(query.busca, (busca) => setQuery({ busca, alerta: '' }));
  const { refresh: refreshSidebar } = useAlertCount();
  const detailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = 'Central de alertas · HerdVision';
  }, []);

  const counts = useAsync(async () => {
    const values = await Promise.all(ALERT_STATUSES.map((status) => alertsApi.count({ status, severity: query.gravidade, search: query.busca })));
    const byStatus = Object.fromEntries(ALERT_STATUSES.map((s, i) => [s, values[i]])) as Record<AlertStatus, number>;
    return { ...byStatus, total: values.reduce((a, b) => a + b, 0) };
  }, [query.gravidade, query.busca]);

  // Filtros que geraram a lista exibida; evita agir sobre a lista anterior enquanto a nova carrega.
  const listKey = [query.status, query.gravidade, query.busca, query.pagina].join('|');
  const list = useAsync(async () => {
    const key = listKey;
    const page = await alertsApi.list({
      status: query.status as AlertStatus | '',
      severity: query.gravidade,
      search: query.busca,
      page: Number(query.pagina),
      per_page: PER_PAGE,
    });
    const animals = await getAnimalsByIds(page.data.map((a) => a.animal_id));
    return { page, animals, key };
  }, [query.status, query.gravidade, query.busca, query.pagina]);

  const alerts = list.data?.page.data ?? [];
  const meta = list.data?.page.meta;
  const selectedId = query.alerta ? Number(query.alerta) : null;

  // Em telas largas, abre o primeiro alerta da lista quando nada está selecionado.
  // Espera a lista do filtro atual carregar, para não abrir um alerta da lista anterior.
  const listIsCurrent = list.data?.key === listKey;
  useEffect(() => {
    if (listIsCurrent && !selectedId && alerts.length > 0 && window.matchMedia('(min-width: 1200px)').matches) {
      setQuery({ alerta: String(alerts[0].id) }, { keepPage: true });
    }
  }, [listIsCurrent, alerts, selectedId, setQuery]);

  useEffect(() => {
    if (meta && alerts.length === 0 && meta.current_page > 1) setQuery({ pagina: String(Math.max(1, meta.last_page)) }, { keepPage: true });
  }, [meta, alerts.length, setQuery]);

  function select(id: number) {
    setQuery({ alerta: String(id) }, { keepPage: true });
    window.setTimeout(() => {
      if (window.matchMedia('(max-width: 1199px)').matches) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  const c = counts.data;
  const statusOptions = [
    { value: '', label: 'Todos', count: c?.total ?? null },
    ...ALERT_STATUSES.map((s) => ({ value: s as string, label: ALERT_STATUS_META[s].plural, count: c ? c[s] : null })),
  ];

  return (
    <>
      <PageHeader
        overline="Monitoramento"
        title="Central de alertas"
        subtitle={c ? `${plural(c.Pendente, 'alerta pendente', 'alertas pendentes')} · ${formatNumber(c['Em análise'])} em análise` : 'Acompanhe e trate os alertas do rebanho.'}
      />

      <div className="stack-24">
        <div className="filter-bar" role="search">
          <SearchField
            label="Buscar alerta"
            placeholder="Descrição ou tipo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fieldClassName="filter-bar__search"
          />
          <div className="filter-bar__chips">
            <ChipGroup
              label="Status"
              value={query.status}
              onChange={(status) => setQuery({ status, alerta: '' })}
              options={statusOptions}
            />
          </div>
          <SelectField
            label="Gravidade"
            value={query.gravidade}
            onChange={(e) => setQuery({ gravidade: e.target.value, alerta: '' })}
            fieldClassName="filter-bar__select"
          >
            <option value="">Todas</option>
            {Object.values(SEVERITY).map((s) => (
              <option key={s.apiValue} value={s.apiValue}>
                {s.label} · {s.apiValue}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid-2 grid-2--wide-side">
          <section className="stack-12" aria-label="Lista de alertas">
            {list.loading && !list.data ? (
              <SkeletonRows rows={5} height={76} />
            ) : list.error ? (
              <div className="card">
                <ErrorState error={list.error} onRetry={list.reload} unavailableOn404 />
              </div>
            ) : alerts.length === 0 ? (
              <div className="card">
                {query.busca || query.status || query.gravidade ? (
                  <EmptyState
                    icon="search"
                    title="Nenhum alerta com estes filtros"
                    actions={
                      <Button variant="tertiary" size="page" onClick={() => setQuery({ busca: '', status: '', gravidade: '', alerta: '' })}>
                        Limpar filtros
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState icon="check" tone="success" title="Nenhum alerta registrado" text="Tudo em ordem no rebanho." />
                )}
              </div>
            ) : (
              <>
                <div className="stack-8" aria-busy={list.loading}>
                  {alerts.map((alert) => {
                    const animal = list.data?.animals.get(alert.animal_id);
                    return (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        compact
                        selected={alert.id === selectedId}
                        animalLabel={animalLabel(animal, alert.animal_id)}
                        lotName={animal?.lot?.name}
                        onClick={() => select(alert.id)}
                      />
                    );
                  })}
                </div>
                {meta && meta.last_page > 1 && (
                  <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                    <p className="c-secondary">
                      {formatNumber(meta.from ?? 0)}–{formatNumber(meta.to ?? 0)} de {formatNumber(meta.total)}
                    </p>
                    <Pagination meta={meta} onPage={(p) => setQuery({ pagina: String(p), alerta: '' }, { keepPage: true })} />
                  </div>
                )}
              </>
            )}
          </section>

          <section ref={detailRef} className="elevated side-panel" aria-label="Detalhe do alerta" style={{ padding: 28 }}>
            {selectedId ? (
              <AlertDetail
                key={selectedId}
                alertId={selectedId}
                onChanged={(updated) => {
                  list.setData((d) =>
                    d ? { ...d, page: { ...d.page, data: d.page.data.map((a) => (a.id === updated.id ? updated : a)) } } : (d as never),
                  );
                  counts.reload();
                  refreshSidebar();
                }}
              />
            ) : (
              <>
                <EmptyState icon="bell" title="Selecione um alerta" text="Escolha um alerta na lista para ver os detalhes e registrar o tratamento." />
                <Footnote>{VET_NOTE}</Footnote>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
