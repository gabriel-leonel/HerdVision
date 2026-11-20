import { useState } from 'react';
import { Link } from 'react-router-dom';
import { animalLabel, getAnimalCached } from '../../api/lookups';
import { alertsApi, readingsApi } from '../../api/resources';
import type { Alert, Animal, Reading } from '../../api/types';
import { Button, ButtonLink } from '../../components/Button';
import { alertTitle, DataList, Stepper } from '../../components/Data';
import { Dialog } from '../../components/Dialog';
import { ErrorState, Footnote, SkeletonRows, useToast, VET_NOTE } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { FlowTag, SeverityBadge } from '../../components/Status';
import { useAsync } from '../../hooks/useAsync';
import { formatDateTime, formatLevel, formatTemperature } from '../../lib/format';
import { alertTypeIcon, alertTypeLabel, nextAlertTransition, normalizeSeverity, SEVERITY } from '../../lib/semantics';

interface AlertDetailProps {
  alertId: number;
  onChanged: (alert: Alert) => void;
}

interface DetailData {
  alert: Alert;
  animal: Animal | null;
  reading: Reading | null;
}

function readingSummary(r: Reading): string {
  const parts = [];
  if (r.temperature !== null && r.temperature !== '') parts.push(formatTemperature(r.temperature));
  if (r.activity_level !== null && r.activity_level !== '') parts.push(`atividade ${formatLevel(r.activity_level)}`);
  if (r.feeding_level !== null && r.feeding_level !== '') parts.push(`alimentação ${formatLevel(r.feeding_level)}`);
  return `${formatDateTime(r.recorded_at)} · ${parts.join(' · ') || 'sem valores'}`;
}

export function AlertDetail({ alertId, onChanged }: AlertDetailProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);

  const detail = useAsync<DetailData>(async () => {
    const alert = await alertsApi.get(alertId);
    const [animal, reading] = await Promise.all([
      getAnimalCached(alert.animal_id),
      alert.monitoring_reading_id ? readingsApi.get(alert.monitoring_reading_id).catch(() => null) : Promise.resolve(null),
    ]);
    return { alert, animal, reading };
  }, [alertId]);

  if (detail.loading && !detail.data) return <SkeletonRows rows={5} height={60} />;
  if (detail.error) return <ErrorState error={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return null;

  const { alert, animal, reading } = detail.data;
  const severity = SEVERITY[normalizeSeverity(alert.severity)];
  const transition = nextAlertTransition(alert.status);
  const label = animalLabel(animal, alert.animal_id);

  async function run() {
    setBusy(true);
    try {
      const updated = transition.kind === 'reopen' ? await alertsApi.reopen(alert.id) : await alertsApi.transition(alert.id, transition.to);
      detail.setData((d) => ({ ...(d as DetailData), alert: updated }));
      onChanged(updated);
      toast.success(
        transition.kind === 'reopen' ? 'Alerta reaberto como Pendente.' : transition.to === 'Em análise' ? 'Análise iniciada.' : 'Alerta marcado como resolvido.',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o alerta.');
      detail.reload();
    } finally {
      setBusy(false);
      setConfirmReopen(false);
    }
  }

  const history = alert.history ?? [];

  return (
    <article className="stack-24" aria-labelledby={`alerta-${alert.id}-titulo`}>
      <header className="stack-12">
        <span className={`icon-circle icon-circle--${severity.tone}`} style={{ width: 52, height: 52 }}>
          <Icon name={alertTypeIcon(alert.type)} size={24} />
        </span>
        <h2 className="t-h2" id={`alerta-${alert.id}-titulo`}>
          {alertTitle(alert, label)}
        </h2>
        <div className="row-wrap">
          <SeverityBadge severity={alert.severity} long />
          <FlowTag status={alert.status} />
        </div>
      </header>

      <p className="t-body-l c-secondary">{alert.description}</p>

      <DataList
        single
        items={[
          {
            label: 'Animal',
            value: (
              <Link to={`/animais/${alert.animal_id}`}>
                {label}
                {animal ? ` · ${animal.identification}` : ''}
                {animal?.lot?.name ? ` · ${animal.lot.name}` : ''}
              </Link>
            ),
          },
          { label: 'Tipo', value: alertTypeLabel(alert.type) },
          { label: 'Leitura de origem', value: reading ? readingSummary(reading) : alert.monitoring_reading_id ? `Leitura #${alert.monitoring_reading_id}` : 'Sem leitura vinculada' },
          { label: 'Gerado em', value: formatDateTime(alert.created_at) },
        ]}
      />

      <section className="stack-16" aria-labelledby={`alerta-${alert.id}-tratamento`}>
        <h3 className="t-h3" id={`alerta-${alert.id}-tratamento`}>
          Tratamento
        </h3>
        <Stepper status={alert.status} />
        <div className="row-wrap">
          {transition.kind === 'advance' ? (
            <Button icon={transition.to === 'Resolvido' ? 'check' : 'search'} loading={busy} onClick={() => void run()} style={{ flex: '1 1 220px' }}>
              {transition.label}
            </Button>
          ) : (
            <Button variant="secondary" icon="rotate" onClick={() => setConfirmReopen(true)} style={{ flex: '1 1 220px' }}>
              {transition.label}
            </Button>
          )}
          <ButtonLink to={`/animais/${alert.animal_id}`} variant="tertiary" icon="eye">
            Ver animal
          </ButtonLink>
        </div>
        <p className="t-body-s c-muted">{transition.guidance}</p>
      </section>

      <section className="stack-12" aria-labelledby={`alerta-${alert.id}-historico`}>
        <h3 className="t-h3" id={`alerta-${alert.id}-historico`}>
          Histórico
        </h3>
        {history.length > 0 ? (
          <ol className="stack-8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {[...history].reverse().map((h, i) => (
              <li key={i} className="row" style={{ alignItems: 'flex-start' }}>
                <span className="icon-circle icon-circle--neutral" style={{ width: 28, height: 28, color: 'var(--bark-700)' }}>
                  <Icon name={h.to === 'Resolvido' ? 'check' : h.to === 'Em análise' ? 'search' : 'clock'} size={14} />
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 600 }}>
                    {h.from ? `${h.from} → ${h.to}` : `Alerta criado como ${h.to}`}
                  </span>
                  <span className="t-body-s c-muted">
                    {formatDateTime(h.changed_at)}
                    {h.user_name ? ` · por ${h.user_name}` : h.from ? '' : ' · pelo monitoramento'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="c-secondary t-body-m">
            Criado em {formatDateTime(alert.created_at)}
            {alert.updated_at !== alert.created_at ? ` · última alteração em ${formatDateTime(alert.updated_at)}` : ''}.
          </p>
        )}
      </section>

      <Footnote>{VET_NOTE}</Footnote>

      <Dialog
        open={confirmReopen}
        onClose={() => setConfirmReopen(false)}
        role="alertdialog"
        icon="rotate"
        intent="attention"
        title="Reabrir alerta?"
        actions={
          <>
            <Button variant="tertiary" size="page" onClick={() => setConfirmReopen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button size="page" loading={busy} onClick={() => void run()}>
              Reabrir alerta
            </Button>
          </>
        }
      >
        O alerta volta para <strong>Pendente</strong> e precisará passar novamente por análise antes de ser resolvido.
      </Dialog>
    </article>
  );
}
