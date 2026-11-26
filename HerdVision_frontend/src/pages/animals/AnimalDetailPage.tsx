import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { animalLabel, animalTitle, forgetAnimal } from '../../api/lookups';
import { alertsApi, animalProtocolsApi, animalsApi, readingsApi } from '../../api/resources';
import type { AnimalProtocol, Reading } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ButtonLink, IconButton, TextAction } from '../../components/Button';
import { AlertCard, Breadcrumb, DataList, IdTile, KpiCard, SectionHeader, type Trend } from '../../components/Data';
import { DeleteDialog } from '../../components/DeleteDialog';
import { EmptyState, ErrorState, Footnote, Skeleton, SkeletonRows, useToast, VET_NOTE } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { AnimalStatusBadge, AssociationBadge, CategoryTag, HealthBadge } from '../../components/Status';
import { useAsync } from '../../hooks/useAsync';
import {
  formatAge,
  formatDate,
  formatDateTime,
  formatLevel,
  formatNumber,
  formatShortDateTime,
  formatTemperature,
  toNumber,
} from '../../lib/format';
import { healthFromAlerts, isAssociationDone, isOpenAlert, LEVEL_ATTENTION_BELOW, TEMPERATURE_RANGE } from '../../lib/semantics';
import { useAlertCount } from '../../layouts/AppLayout';
import { AssociateProtocolDialog, ReadingDialog } from './AnimalDialogs';

const HISTORY_SHORT = 6;
const HISTORY_FULL = 50;

function levelDelta(latest: unknown, previous: unknown): { trend: Trend; direction?: 'up' | 'down'; text: string } {
  const l = toNumber(latest);
  const p = toNumber(previous);
  if (l === null) return { trend: 'neutral', text: 'Sem dado na última leitura' };
  if (p === null || p === 0) return { trend: l < LEVEL_ATTENTION_BELOW ? 'negative' : 'neutral', text: l < LEVEL_ATTENTION_BELOW ? 'Abaixo da referência' : 'Primeira leitura com este dado' };
  const pct = ((l - p) / p) * 100;
  if (Math.abs(pct) < 1) return { trend: l < LEVEL_ATTENTION_BELOW ? 'negative' : 'neutral', text: 'Estável desde a leitura anterior' };
  return {
    trend: pct < 0 || l < LEVEL_ATTENTION_BELOW ? 'negative' : 'positive',
    direction: pct > 0 ? 'up' : 'down',
    text: `${pct > 0 ? '+' : '−'}${formatNumber(Math.abs(pct), 0)}% desde a leitura anterior`,
  };
}

function temperatureDelta(latest: unknown, previous: unknown): { trend: Trend; direction?: 'up' | 'down'; text: string } {
  const l = toNumber(latest);
  const p = toNumber(previous);
  if (l === null) return { trend: 'neutral', text: 'Sem dado na última leitura' };
  const out = l > TEMPERATURE_RANGE.max || l < TEMPERATURE_RANGE.min;
  const suffix = out ? ' · fora da referência' : '';
  if (p === null) return { trend: out ? 'negative' : 'neutral', text: `Referência ${formatNumber(TEMPERATURE_RANGE.min, 1)}–${formatNumber(TEMPERATURE_RANGE.max, 1)} °C` };
  const diff = l - p;
  if (Math.abs(diff) < 0.05) return { trend: out ? 'negative' : 'neutral', text: `Estável${suffix}` };
  return {
    trend: out ? 'negative' : 'neutral',
    direction: diff > 0 ? 'up' : 'down',
    text: `${diff > 0 ? '+' : '−'}${formatNumber(Math.abs(diff), 1)} °C desde a leitura anterior${suffix}`,
  };
}

function ValueCell({ value, kind }: { value: Reading['temperature']; kind: 'temperature' | 'level' }) {
  const n = toNumber(value);
  const high = kind === 'temperature' && n !== null && n > TEMPERATURE_RANGE.max;
  const low = kind === 'level' && n !== null && n < LEVEL_ATTENTION_BELOW;
  const text = kind === 'temperature' ? formatTemperature(value) : formatLevel(value);
  if (!high && !low) return <>{text}</>;
  return (
    <span className="c-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
      <Icon name={high ? 'trendUp' : 'trendDown'} size={14} />
      {text}
      <span className="sr-only">{high ? '(acima da referência)' : '(abaixo da referência)'}</span>
    </span>
  );
}

export function AnimalDetailPage() {
  const { id } = useParams();
  const animalId = Number(id);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh: refreshAlertCount } = useAlertCount();

  const [fullHistory, setFullHistory] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toUnlink, setToUnlink] = useState<AnimalProtocol | null>(null);

  const animal = useAsync(() => animalsApi.get(animalId), [animalId]);
  const readings = useAsync(
    () => readingsApi.list({ animal_id: animalId, per_page: fullHistory ? HISTORY_FULL : HISTORY_SHORT }),
    [animalId, fullHistory],
  );
  const alerts = useAsync(() => alertsApi.list({ animal_id: animalId, per_page: 50 }), [animalId]);
  const associations = useAsync(() => animalProtocolsApi.list({ animal_id: animalId }), [animalId]);

  useEffect(() => {
    document.title = `${animal.data ? animalTitle(animal.data) : 'Animal'} · HerdVision`;
  }, [animal.data]);

  if (animal.error) {
    return (
      <>
        <div style={{ marginBottom: 24 }}>
          <Breadcrumb items={[{ to: '/animais', label: 'Animais' }, { to: '#', label: 'Animal' }]} />
        </div>
        <div className="card">
          <ErrorState error={animal.error} onRetry={animal.reload} backTo={{ to: '/animais', label: 'Voltar para animais' }} />
        </div>
      </>
    );
  }

  const a = animal.data;
  const alertList = alerts.data?.data ?? [];
  const openAlerts = alertList.filter(isOpenAlert);
  const health = alerts.error ? 'unknown' : healthFromAlerts(alertList);
  const readingList = readings.data?.data ?? [];
  const [latest, previous] = readingList;
  const sortedAlerts = [...openAlerts, ...alertList.filter((x) => !isOpenAlert(x))];

  async function afterReading() {
    setReadingOpen(false);
    const before = alerts.data?.meta.total ?? 0;
    readings.reload();
    try {
      const page = await alertsApi.list({ animal_id: animalId, per_page: 50 });
      alerts.setData(page);
      const created = page.meta.total - before;
      if (created > 0) toast.info(`Leitura registrada. ${created === 1 ? '1 novo alerta foi gerado' : `${created} novos alertas foram gerados`} para avaliação.`);
      else toast.success('Leitura registrada.');
      refreshAlertCount();
    } catch {
      toast.success('Leitura registrada.');
    }
  }

  async function toggleDone(item: AnimalProtocol) {
    try {
      await animalProtocolsApi.update(item.id, { status: isAssociationDone(item.status) ? 'em andamento' : 'concluído' });
      associations.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o status.');
    }
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ to: '/animais', label: 'Animais' }, { to: '#', label: a ? animalTitle(a) : 'Carregando…' }]} />
      </div>

      <div className="stack-32">
        {/* Cabeçalho do animal */}
        <section className="card" style={{ borderRadius: 'var(--radius-24)', padding: 28 }} aria-busy={animal.loading}>
          {!a ? (
            <div className="row" style={{ gap: 20 }}>
              <Skeleton width={72} height={72} radius={16} />
              <div className="stack-8" style={{ flex: 1 }}>
                <Skeleton height={32} width="40%" />
                <Skeleton height={18} width="60%" />
              </div>
            </div>
          ) : (
            <div className="stack-24">
              <div className="row-wrap" style={{ gap: 20, alignItems: 'flex-start' }}>
                <IdTile identification={a.identification} health={health} size="lg" />
                <div className="stack-8" style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div className="row-wrap">
                    <h1 className="t-h1">{animalTitle(a)}</h1>
                    {alerts.loading ? null : <HealthBadge health={health} />}
                    <AnimalStatusBadge status={a.status} />
                  </div>
                  <p className="c-secondary">
                    {[a.identification, a.species, a.breed].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="row-wrap">
                  {isAdmin && (
                    <Button variant="destructive-quiet" size="page" icon="trash" onClick={() => setDeleteOpen(true)}>
                      Excluir
                    </Button>
                  )}
                  <ButtonLink to={`/animais/${a.id}/editar`} variant="secondary" size="page" icon="pencil">
                    Editar
                  </ButtonLink>
                </div>
              </div>
              <DataList
                items={[
                  {
                    label: 'Lote',
                    value: <Link to={`/lotes/${a.lot_id}`}>{a.lot?.name ?? `Lote #${a.lot_id}`}</Link>,
                  },
                  {
                    label: 'Nascimento',
                    value: a.birth_date ? `${formatDate(a.birth_date)}${formatAge(a.birth_date) ? ` · ${formatAge(a.birth_date)}` : ''}` : 'Não informado',
                  },
                  { label: 'Cadastrado em', value: formatDate(a.created_at) },
                  { label: 'Última atualização', value: formatDateTime(a.updated_at) },
                ]}
              />
            </div>
          )}
        </section>

        {/* KPIs da última leitura */}
        <section aria-label="Última leitura" className="stack-12">
          <div className="kpi-grid">
            <KpiCard
              label="Temperatura"
              icon="thermo"
              loading={readings.loading && !readings.data}
              value={latest && toNumber(latest.temperature) !== null ? formatNumber(toNumber(latest.temperature), 1) : '—'}
              unit={latest && toNumber(latest.temperature) !== null ? '°C' : undefined}
              delta={latest ? temperatureDelta(latest.temperature, previous?.temperature) : undefined}
            />
            <KpiCard
              label="Atividade"
              icon="activity"
              loading={readings.loading && !readings.data}
              value={latest ? formatLevel(latest.activity_level) : '—'}
              delta={latest ? levelDelta(latest.activity_level, previous?.activity_level) : undefined}
            />
            <KpiCard
              label="Alimentação"
              icon="utensils"
              loading={readings.loading && !readings.data}
              value={latest ? formatLevel(latest.feeding_level) : '—'}
              delta={latest ? levelDelta(latest.feeding_level, previous?.feeding_level) : undefined}
            />
          </div>
          {latest && <p className="t-body-s c-muted">Última leitura em {formatDateTime(latest.recorded_at)}. Atividade e alimentação em índice de 0 a 100.</p>}
        </section>

        <div className="grid-2 grid-2--equal">
          {/* Histórico de monitoramento */}
          <section className="card table-card" aria-labelledby="historico">
            <div style={{ padding: '20px 20px 12px' }}>
              <SectionHeader
                id="historico"
                title="Histórico de monitoramento"
                action={
                  <Button variant="tonal" icon="plus" onClick={() => setReadingOpen(true)} disabled={!a}>
                    Registrar leitura
                  </Button>
                }
              />
            </div>
            {readings.loading && !readings.data ? (
              <div style={{ padding: 16 }}>
                <SkeletonRows rows={4} height={40} />
              </div>
            ) : readings.error ? (
              <ErrorState error={readings.error} onRetry={readings.reload} unavailableOn404 />
            ) : readingList.length === 0 ? (
              <EmptyState icon="activity" title="Nenhuma leitura registrada" text="Registre a primeira leitura para acompanhar a evolução do animal." />
            ) : (
              <>
                <div className="table-scroll">
                  <table className="table">
                    <caption className="sr-only">Leituras de monitoramento</caption>
                    <thead>
                      <tr>
                        <th scope="col">Data e hora</th>
                        <th scope="col" className="num-col">
                          Temperatura
                        </th>
                        <th scope="col" className="num-col">
                          Atividade
                        </th>
                        <th scope="col" className="num-col">
                          Alimentação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {readingList.map((r) => (
                        <tr key={r.id}>
                          <td>{formatShortDateTime(r.recorded_at)}</td>
                          <td className="num-col">
                            <ValueCell value={r.temperature} kind="temperature" />
                          </td>
                          <td className="num-col">
                            <ValueCell value={r.activity_level} kind="level" />
                          </td>
                          <td className="num-col">
                            <ValueCell value={r.feeding_level} kind="level" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(fullHistory || (readings.data?.meta.total ?? 0) > HISTORY_SHORT) && (
                  <div className="table-footer">
                    <p className="c-secondary">
                      {fullHistory
                        ? `Mostrando as ${formatNumber(readingList.length)} leituras mais recentes`
                        : `${formatNumber(readings.data?.meta.total ?? 0)} leituras no total`}
                    </p>
                    <TextAction onClick={() => setFullHistory((v) => !v)}>
                      {fullHistory ? 'Mostrar menos' : 'Ver histórico completo'} <Icon name="chevR" size={16} />
                    </TextAction>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Alertas do animal */}
          <section className="section-container stack-16" aria-labelledby="alertas-animal">
            <SectionHeader
              id="alertas-animal"
              title="Alertas"
              action={
                <Link to="/alertas" className="text-action">
                  Central de alertas <Icon name="chevR" size={16} />
                </Link>
              }
            />
            {alerts.loading && !alerts.data ? (
              <SkeletonRows rows={3} height={76} />
            ) : alerts.error ? (
              <div className="card">
                <ErrorState error={alerts.error} onRetry={alerts.reload} unavailableOn404 />
              </div>
            ) : sortedAlerts.length === 0 ? (
              <div className="card">
                <EmptyState icon="check" tone="success" title="Nenhum alerta para este animal" text="Tudo em ordem nas leituras registradas." />
              </div>
            ) : (
              <div className="stack-8">
                {sortedAlerts.slice(0, 6).map((alert) => (
                  <AlertCard key={alert.id} alert={alert} compact animalLabel={animalLabel(a, animalId)} to={`/alertas?alerta=${alert.id}`} />
                ))}
              </div>
            )}
            <Footnote>{VET_NOTE}</Footnote>
          </section>
        </div>

        {/* Protocolos (N:N) */}
        <section className="card table-card" aria-labelledby="protocolos-animal">
          <div style={{ padding: '20px 20px 12px' }}>
            <SectionHeader
              id="protocolos-animal"
              title="Protocolos"
              action={
                <Button variant="tonal" icon="link" onClick={() => setAssociateOpen(true)} disabled={!a}>
                  Associar
                </Button>
              }
            />
          </div>
          {associations.loading && !associations.data ? (
            <div style={{ padding: 16 }}>
              <SkeletonRows rows={3} height={44} />
            </div>
          ) : associations.error ? (
            <ErrorState error={associations.error} onRetry={associations.reload} unavailableOn404 />
          ) : (associations.data?.data.length ?? 0) === 0 ? (
            <EmptyState icon="clipboard" title="Nenhum protocolo associado" text="Associe vacinas, vermífugos, suplementação e protocolos reprodutivos aplicados a este animal." />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <caption className="sr-only">Protocolos aplicados ao animal</caption>
                <thead>
                  <tr>
                    <th scope="col">Protocolo</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Início</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="actions-col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {associations.data!.data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/protocolos?protocolo=${item.management_protocol_id}`} className="table__primary-title">
                          {item.protocol?.name ?? `Protocolo #${item.management_protocol_id}`}
                        </Link>
                      </td>
                      <td>{item.protocol ? <CategoryTag type={item.protocol.type} /> : '—'}</td>
                      <td>{formatDate(item.start_date)}</td>
                      <td>
                        <AssociationBadge status={item.status} />
                      </td>
                      <td className="actions-col">
                        <span className="table__actions">
                          <IconButton
                            icon={isAssociationDone(item.status) ? 'rotate' : 'check'}
                            label={isAssociationDone(item.status) ? 'Marcar como em andamento' : 'Marcar como concluído'}
                            onClick={() => void toggleDone(item)}
                          />
                          <IconButton icon="x" danger label="Remover associação" onClick={() => setToUnlink(item)} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {a && (
        <>
          <ReadingDialog open={readingOpen} animalId={a.id} onClose={() => setReadingOpen(false)} onSaved={() => void afterReading()} />
          <AssociateProtocolDialog
            open={associateOpen}
            animalId={a.id}
            onClose={() => setAssociateOpen(false)}
            onSaved={() => {
              setAssociateOpen(false);
              toast.success('Protocolo associado.');
              associations.reload();
            }}
          />
          <DeleteDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            confirmTitle={`Excluir ${animalTitle(a)}?`}
            confirmText={`${a.identification} será removido do rebanho, junto com as associações a protocolos. Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir animal"
            onConfirm={() => animalsApi.remove(a.id)}
            onDeleted={() => {
              forgetAnimal(a.id);
              toast.success(`${animalTitle(a)} excluído.`);
              navigate('/animais');
            }}
            blockedTitle="Não é possível excluir o animal"
            blockedText={(_, message) => <p>{message ?? 'Existem registros vinculados a este animal.'}</p>}
          />
          <DeleteDialog
            open={!!toUnlink}
            onClose={() => setToUnlink(null)}
            confirmTitle="Remover associação?"
            confirmText={`${toUnlink?.protocol?.name ?? 'O protocolo'} deixará de aparecer no histórico deste animal.`}
            confirmLabel="Remover"
            onConfirm={() => animalProtocolsApi.remove(toUnlink!.id)}
            onDeleted={() => {
              setToUnlink(null);
              toast.success('Associação removida.');
              associations.reload();
            }}
            blockedTitle="Não foi possível remover"
            blockedText={(_, message) => <p>{message}</p>}
          />
        </>
      )}
    </>
  );
}

