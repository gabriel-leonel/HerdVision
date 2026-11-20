import { useEffect, useState, type FormEvent } from 'react';
import { animalProtocolsApi, protocolsApi, readingsApi } from '../../api/resources';
import type { Protocol } from '../../api/types';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Banner } from '../../components/Feedback';
import { RequiredLegend, SelectField, TextField } from '../../components/Field';
import { nowLocalInput, todayISO, toNumber } from '../../lib/format';
import { isApiError } from '../../lib/http';
import { ASSOCIATION_STATUSES, protocolTypeLabel } from '../../lib/semantics';

// ---------------- Registrar leitura (RF11) ----------------
interface ReadingDialogProps {
  open: boolean;
  animalId: number;
  onClose: () => void;
  onSaved: () => void;
}

type ReadingErrors = Partial<Record<'recorded_at' | 'temperature' | 'activity_level' | 'feeding_level', string>>;

export function ReadingDialog({ open, animalId, onClose, onSaved }: ReadingDialogProps) {
  const [recordedAt, setRecordedAt] = useState(nowLocalInput());
  const [temperature, setTemperature] = useState('');
  const [activity, setActivity] = useState('');
  const [feeding, setFeeding] = useState('');
  const [errors, setErrors] = useState<ReadingErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRecordedAt(nowLocalInput());
      setTemperature('');
      setActivity('');
      setFeeding('');
      setErrors({});
      setBanner(null);
    }
  }, [open]);

  function validate(): ReadingErrors {
    const e: ReadingErrors = {};
    if (!recordedAt) e.recorded_at = 'Informe a data e a hora da leitura.';
    else if (new Date(recordedAt).getTime() > Date.now() + 60000) e.recorded_at = 'A leitura não pode estar no futuro.';
    const t = toNumber(temperature);
    const a = toNumber(activity);
    const f = toNumber(feeding);
    if (temperature && (t === null || t < 30 || t > 45)) e.temperature = 'Informe uma temperatura entre 30 e 45 °C.';
    if (activity && (a === null || a < 0 || a > 100)) e.activity_level = 'Informe um índice entre 0 e 100.';
    if (feeding && (f === null || f < 0 || f > 100)) e.feeding_level = 'Informe um índice entre 0 e 100.';
    if (!temperature && !activity && !feeding) e.temperature = 'Informe ao menos um indicador.';
    return e;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await readingsApi.create({
        animal_id: animalId,
        recorded_at: new Date(recordedAt).toISOString(),
        temperature: toNumber(temperature),
        activity_level: toNumber(activity),
        feeding_level: toNumber(feeding),
      });
      onSaved();
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        const f = error.fieldErrors;
        setErrors({ recorded_at: f.recorded_at, temperature: f.temperature, activity_level: f.activity_level, feeding_level: f.feeding_level });
        if (!f.recorded_at && !f.temperature && !f.activity_level && !f.feeding_level) setBanner(error.message);
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível registrar a leitura.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Registrar leitura" icon="activity" intent="success" wide>
      <form id="reading-form" className="form-stack" onSubmit={submit} noValidate>
        <RequiredLegend />
        {banner && <Banner>{banner}</Banner>}
        <TextField
          label="Data e hora"
          type="datetime-local"
          value={recordedAt}
          max={nowLocalInput()}
          onChange={(e) => setRecordedAt(e.target.value)}
          error={errors.recorded_at}
          required
        />
        <div className="form-grid">
          <TextField
            label="Temperatura (°C)"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={30}
            max={45}
            placeholder="38,6"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            error={errors.temperature}
            fieldClassName="span-2"
          />
          <TextField
            label="Atividade (0–100)"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            placeholder="72"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            error={errors.activity_level}
          />
          <TextField
            label="Alimentação (0–100)"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            placeholder="80"
            value={feeding}
            onChange={(e) => setFeeding(e.target.value)}
            error={errors.feeding_level}
          />
        </div>
        <p className="t-body-s c-muted">Preencha ao menos um indicador. Valores fora da referência podem gerar alertas para avaliação.</p>
      </form>
      <div className="dialog__actions">
        <Button variant="tertiary" size="page" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" form="reading-form" size="page" loading={saving}>
          Registrar leitura
        </Button>
      </div>
    </Dialog>
  );
}

// ---------------- Associar protocolo (RF10, N:N) ----------------
interface AssociateDialogProps {
  open: boolean;
  animalId: number;
  onClose: () => void;
  onSaved: () => void;
}

export function AssociateProtocolDialog({ open, animalId, onClose, onSaved }: AssociateDialogProps) {
  const [protocols, setProtocols] = useState<Protocol[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [protocolId, setProtocolId] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [status, setStatus] = useState(ASSOCIATION_STATUSES[0].value);
  const [errors, setErrors] = useState<{ protocol?: string; start_date?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProtocolId('');
    setStartDate(todayISO());
    setStatus(ASSOCIATION_STATUSES[0].value);
    setErrors({});
    setBanner(null);
    setLoadError(null);
    protocolsApi.list({ per_page: 100 }).then(
      (page) => setProtocols(page.data.filter((p) => p.active)),
      (err) => setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os protocolos.'),
    );
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const e: typeof errors = {};
    if (!protocolId) e.protocol = 'Selecione o protocolo.';
    if (!startDate) e.start_date = 'Informe a data de início.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await animalProtocolsApi.create({ animal_id: animalId, management_protocol_id: Number(protocolId), start_date: startDate, status });
      onSaved();
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        const f = error.fieldErrors;
        setErrors({ protocol: f.management_protocol_id, start_date: f.start_date });
        if (!f.management_protocol_id && !f.start_date) setBanner(error.message);
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível associar o protocolo.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Associar protocolo" icon="clipboard" intent="success" wide>
      <form id="associate-form" className="form-stack" onSubmit={submit} noValidate>
        <RequiredLegend />
        {banner && <Banner>{banner}</Banner>}
        {loadError && <Banner>{loadError}</Banner>}
        <SelectField
          label="Protocolo"
          value={protocolId}
          onChange={(e) => setProtocolId(e.target.value)}
          error={errors.protocol}
          disabled={!protocols}
          help="Somente protocolos ativos. O mesmo protocolo pode ser aplicado mais de uma vez."
          required
        >
          <option value="">{protocols ? 'Selecione o protocolo' : 'Carregando…'}</option>
          {protocols?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {protocolTypeLabel(p.type)}
            </option>
          ))}
        </SelectField>
        <div className="form-grid">
          <TextField label="Data de início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.start_date} required />
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} required>
            {ASSOCIATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </SelectField>
        </div>
      </form>
      <div className="dialog__actions">
        <Button variant="tertiary" size="page" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" form="associate-form" size="page" loading={saving}>
          Associar
        </Button>
      </div>
    </Dialog>
  );
}
