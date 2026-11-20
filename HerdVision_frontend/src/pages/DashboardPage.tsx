import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animalLabel, animalTitle, fetchOpenAlerts, getAnimalsByIds } from '../api/lookups';
import { alertsApi, lotsApi } from '../api/resources';
import type { Alert, Animal } from '../api/types';
import { ButtonLink } from '../components/Button';
import { AlertCard, AnimalRow, HBars, KpiCard, PageHeader, SectionHeader } from '../components/Data';
import { EmptyState, ErrorState, Footnote, Skeleton, SkeletonRows, VET_NOTE } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { useAsync } from '../hooks/useAsync';
import { formatNumber, formatRelative, isSameDay, longDateLabel, plural } from '../lib/format';
import { normalizeSeverity, SEVERITY_RANK, type Health } from '../lib/semantics';

interface MonitoringData {
  pending: number;
  analysis: number;
  resolved: number;
  open: Alert[];
  animals: Map<number, Animal>;
}

const bySeverityThenDate = (a: Alert, b: Alert) =>
  SEVERITY_RANK[normalizeSeverity(b.severity)] - SEVERITY_RANK[normalizeSeverity(a.severity)] || b.created_at.localeCompare(a.created_at);

export function DashboardPage() {
  const [loadedAt, setLoadedAt] = useState(() => new Date().toISOString());
  const [, forceTick] = useState(0);

  useEffect(() => {
    document.title = 'Painel do rebanho · HerdVision';
    const timer = window.setInterval(() => forceTick((t) => t + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const herd = useAsync(async () => {
    const page = await lotsApi.list({ per_page: 100 });
    return { lots: page.data, totalLots: page.meta.total };
  }, []);

  const monitoring = useAsync<MonitoringData>(async () => {
    const [pending, analysis, resolved, open] = await Promise.all([
      alertsApi.count({ status: 'Pendente' }),
      alertsApi.count({ status: 'Em análise' }),
      alertsApi.count({ status: 'Resolvido' }),
      fetchOpenAlerts(),
    ]);
    const animals = await getAnimalsByIds(open.map((a) => a.animal_id));
    setLoadedAt(new Date().toISOString());
    return { pending, analysis, resolved, open, animals };
  }, []);

  const lots = herd.data?.lots ?? [];
  const totalAnimals = lots.reduce((sum, lot) => sum + (lot.animals_count ?? 0), 0);
  const lotName = (id: number | undefined) => lots.find((l) => l.id === id)?.name ?? null;

  const m = monitoring.data;
  const criticalPending = m?.open.filter((a) => a.status === 'Pendente' && normalizeSeverity(a.severity) === 'alta').length ?? 0;
  const todayAlerts = m ? m.open.filter((a) => isSameDay(a.created_at)).sort(bySeverityThenDate) : [];

  // Animais em atenção: pior severidade aberta por animal (alta ou média).
  const attention: { animal: Animal; health: Health }[] = [];
  if (m) {
    const worst = new Map<number, Health>();
    for (const alert of [...m.open].sort(bySeverityThenDate)) {
      const s = normalizeSeverity(alert.severity);
      if (s === 'baixa' || worst.has(alert.animal_id)) continue;
      worst.set(alert.animal_id, s === 'alta' ? 'critical' : 'attention');
    }
    worst.forEach((health, id) => {
      const animal = m.animals.get(id);
      if (animal) attention.push({ animal, health });
    });
  }

  // Animais por lote: até 5 maiores + "Outros".
  const sortedLots = [...lots].sort((a, b) => (b.animals_count ?? 0) - (a.animals_count ?? 0));
  const bars = sortedLots.slice(0, 5).map((l) => ({ label: l.name, value: l.animals_count ?? 0, to: `/animais?lote=${l.id}` }));
  const others = sortedLots.slice(5).reduce((sum, l) => sum + (l.animals_count ?? 0), 0);
  if (sortedLots.length > 5) bars.push({ label: 'Outros', value: others, to: '/lotes', other: true } as (typeof bars)[number]);

  return (
    <>
      <PageHeader
        overline={longDateLabel()}
        title="Painel do rebanho"
        subtitle={<span className="c-muted">Atualizado {formatRelative(loadedAt)}</span>}
        actions={
          <>
            <ButtonLink to="/alertas" variant="secondary" size="page" icon="bell">
              Ver alertas
            </ButtonLink>
            <ButtonLink to="/animais/novo" size="page" icon="plus">
              Novo animal
            </ButtonLink>
          </>
        }
      />

      <div className="stack-32">
        <section aria-label="Indicadores" className="kpi-grid">
          <KpiCard
            label="Animais monitorados"
            icon="list"
            loading={herd.loading}
            value={herd.error ? '—' : formatNumber(totalAnimals)}
            delta={herd.data ? { trend: 'neutral', text: `em ${plural(herd.data.totalLots, 'lote', 'lotes')}` } : undefined}
          />
          <KpiCard
            label="Lotes"
            icon="layers"
            loading={herd.loading}
            value={herd.error ? '—' : formatNumber(herd.data?.totalLots ?? 0)}
            delta={
              herd.data && herd.data.totalLots > 0
                ? { trend: 'neutral', text: `média de ${formatNumber(totalAnimals / herd.data.totalLots, 1)} animais por lote` }
                : undefined
            }
          />
          <KpiCard
            label="Alertas pendentes"
            icon="bell"
            loading={monitoring.loading}
            value={monitoring.error ? '—' : formatNumber(m?.pending ?? 0)}
            delta={
              m
                ? criticalPending > 0
                  ? { trend: 'negative', direction: 'up', text: `${plural(criticalPending, 'crítico aguardando', 'críticos aguardando')} análise` }
                  : { trend: 'positive', direction: 'down', text: 'nenhum crítico aguardando' }
                : undefined
            }
          />
          <KpiCard
            label="Em análise"
            icon="search"
            loading={monitoring.loading}
            value={monitoring.error ? '—' : formatNumber(m?.analysis ?? 0)}
            delta={m ? { trend: 'neutral', text: `${plural(m.resolved, 'alerta resolvido', 'alertas resolvidos')} no total` } : undefined}
          />
        </section>

        <div className="grid-2 grid-2--wide-side">
          <section className="section-container stack-16" aria-labelledby="alertas-hoje">
            <SectionHeader
              id="alertas-hoje"
              title="Alertas de hoje"
              action={
                <Link to="/alertas" className="text-action">
                  Ver todos <Icon name="chevR" size={16} />
                </Link>
              }
            />
            {monitoring.loading ? (
              <SkeletonRows rows={3} height={112} />
            ) : monitoring.error ? (
              <div className="card">
                <ErrorState error={monitoring.error} onRetry={monitoring.reload} unavailableOn404 />
              </div>
            ) : todayAlerts.length === 0 ? (
              <div className="card">
                <EmptyState icon="check" tone="success" title="Nenhum alerta hoje." text="Tudo em ordem no rebanho." />
              </div>
            ) : (
              <div className="stack-12">
                {todayAlerts.slice(0, 3).map((alert) => {
                  const animal = m?.animals.get(alert.animal_id);
                  return (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      animalLabel={animalLabel(animal, alert.animal_id)}
                      lotName={animal?.lot?.name ?? lotName(animal?.lot_id)}
                      to={`/alertas?alerta=${alert.id}`}
                    />
                  );
                })}
                {todayAlerts.length > 3 && (
                  <p className="c-secondary t-body-m">
                    E mais {plural(todayAlerts.length - 3, 'alerta', 'alertas')} hoje. <Link to="/alertas">Ver na central</Link>
                  </p>
                )}
              </div>
            )}
            <Footnote>{VET_NOTE}</Footnote>
          </section>

          <div className="stack-24">
            <section className="card card--padded stack-16" aria-labelledby="em-atencao">
              <SectionHeader id="em-atencao" title="Animais em atenção" />
              {monitoring.loading ? (
                <SkeletonRows rows={3} height={72} />
              ) : monitoring.error ? (
                <p className="c-muted">Monitoramento indisponível no momento.</p>
              ) : attention.length === 0 ? (
                <p className="c-secondary">Nenhum animal com alerta crítico ou de atenção em aberto.</p>
              ) : (
                <div className="stack-8">
                  {attention.slice(0, 4).map(({ animal, health }) => (
                    <AnimalRow
                      key={animal.id}
                      to={`/animais/${animal.id}`}
                      identification={animal.identification}
                      title={animalTitle(animal)}
                      subtitle={animal.lot?.name ?? lotName(animal.lot_id) ?? '—'}
                      health={health}
                    />
                  ))}
                  {attention.length > 4 && (
                    <Link to="/alertas" className="text-action">
                      Ver mais {formatNumber(attention.length - 4)} <Icon name="chevR" size={16} />
                    </Link>
                  )}
                </div>
              )}
            </section>

            <section className="card card--padded stack-16" aria-labelledby="por-lote">
              <SectionHeader
                id="por-lote"
                title="Animais por lote"
                action={
                  <Link to="/lotes" className="text-action">
                    Lotes <Icon name="chevR" size={16} />
                  </Link>
                }
              />
              {herd.loading ? (
                <div className="stack-12">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} height={30} />
                  ))}
                </div>
              ) : herd.error ? (
                <ErrorState error={herd.error} onRetry={herd.reload} />
              ) : bars.length === 0 ? (
                <p className="c-secondary">
                  Nenhum lote cadastrado. <Link to="/lotes/novo">Criar lote</Link>
                </p>
              ) : (
                <HBars items={bars} />
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
