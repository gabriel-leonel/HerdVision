// Mapeamentos semânticos (DESIGN.md §8). Centralizados aqui para facilitar ajustes
// quando os valores definitivos do backend forem confirmados (§13.2).
import type { IconName } from '../components/Icon';
import type { Alert, AlertStatus, Role } from '../api/types';
import { capitalize } from './format';

export type Tone = 'critical' | 'attention' | 'healthy' | 'info' | 'neutral';

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// ---------- 8.1 Severidade ----------
export type Severity = 'alta' | 'media' | 'baixa';

export function normalizeSeverity(value: string | null | undefined): Severity {
  const v = normalize(value);
  if (v === 'alta' || v === 'high' || v === 'critica' || v === 'critico') return 'alta';
  if (v === 'media' || v === 'medium' || v === 'atencao') return 'media';
  return 'baixa';
}

export const SEVERITY: Record<Severity, { label: string; tone: Tone; long: string; apiValue: string }> = {
  alta: { label: 'Crítico', tone: 'critical', long: 'Crítico · gravidade alta', apiValue: 'alta' },
  media: { label: 'Atenção', tone: 'attention', long: 'Atenção · gravidade média', apiValue: 'média' },
  baixa: { label: 'Informação', tone: 'info', long: 'Informação · gravidade baixa', apiValue: 'baixa' },
};

export const SEVERITY_RANK: Record<Severity, number> = { alta: 3, media: 2, baixa: 1 };

// ---------- 8.2 Status do alerta (RN01) ----------
export const ALERT_STATUSES: AlertStatus[] = ['Pendente', 'Em análise', 'Resolvido'];

export const ALERT_STATUS_META: Record<AlertStatus, { tag: 'pending' | 'analysis' | 'resolved'; icon: IconName; plural: string }> = {
  Pendente: { tag: 'pending', icon: 'clock', plural: 'Pendentes' },
  'Em análise': { tag: 'analysis', icon: 'search', plural: 'Em análise' },
  Resolvido: { tag: 'resolved', icon: 'check', plural: 'Resolvidos' },
};

export interface AlertTransition {
  kind: 'advance' | 'reopen';
  to: AlertStatus;
  label: string;
  guidance: string;
}

/** A interface só oferece a próxima transição válida (§8.2). */
export function nextAlertTransition(status: AlertStatus): AlertTransition {
  switch (status) {
    case 'Pendente':
      return {
        kind: 'advance',
        to: 'Em análise',
        label: 'Iniciar análise',
        guidance: 'Ao iniciar a análise, a equipe sinaliza que o animal está sendo avaliado.',
      };
    case 'Em análise':
      return {
        kind: 'advance',
        to: 'Resolvido',
        label: 'Marcar como resolvido',
        guidance: 'Depois de avaliar o animal e tomar as providências, registre a resolução.',
      };
    default:
      return {
        kind: 'reopen',
        to: 'Pendente',
        label: 'Reabrir alerta',
        guidance: 'O alerta está resolvido. Reabra apenas se a condição voltar a merecer avaliação.',
      };
  }
}

export function isOpenAlert(alert: Pick<Alert, 'status'>): boolean {
  return alert.status !== 'Resolvido';
}

// ---------- 8.3 Tipo do alerta ----------
export function alertTypeIcon(type: string | null | undefined): IconName {
  const t = normalize(type);
  if (t.startsWith('temperatura')) return 'thermo';
  if (t.startsWith('atividade')) return 'activity';
  if (t.startsWith('alimentacao')) return 'utensils';
  return 'warn';
}

export function alertTypeLabel(type: string | null | undefined): string {
  const t = normalize(type);
  if (t.startsWith('temperatura')) return 'Temperatura';
  if (t.startsWith('atividade')) return 'Atividade';
  if (t.startsWith('alimentacao')) return 'Alimentação';
  return type ? capitalize(type) : 'Outro';
}

/** Comportamento para o título "Animal 154 com queda de atividade" (§6.9 e §12). */
export function alertBehavior(type: string | null | undefined): string {
  const t = normalize(type);
  if (t.startsWith('temperatura')) return 'com temperatura fora da referência';
  if (t.startsWith('atividade')) return 'com alteração de atividade';
  if (t.startsWith('alimentacao')) return 'com alteração na alimentação';
  return 'com condição que merece avaliação';
}

// ---------- 8.4 Situação do animal (derivada dos alertas abertos) ----------
export type Health = 'critical' | 'attention' | 'healthy' | 'unknown';

export const HEALTH_META: Record<Health, { label: string; tone: Tone }> = {
  critical: { label: 'Crítico', tone: 'critical' },
  attention: { label: 'Atenção', tone: 'attention' },
  healthy: { label: 'Saudável', tone: 'healthy' },
  unknown: { label: 'Sem dados', tone: 'neutral' },
};

export function healthFromAlerts(alerts: Pick<Alert, 'status' | 'severity'>[]): Health {
  let worst: Health = 'healthy';
  for (const a of alerts) {
    if (!isOpenAlert(a)) continue;
    const s = normalizeSeverity(a.severity);
    if (s === 'alta') return 'critical';
    if (s === 'media') worst = 'attention';
  }
  return worst;
}

// ---------- 8.5 Status cadastral do animal (valores a confirmar, §13.2 item 3) ----------
export const ANIMAL_STATUSES = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'em tratamento', label: 'Em tratamento' },
  { value: 'inativo', label: 'Inativo' },
];

export function animalStatusLabel(value: string | null | undefined): string {
  const found = ANIMAL_STATUSES.find((s) => normalize(s.value) === normalize(value));
  return found ? found.label : value ? capitalize(value) : '—';
}

export const SPECIES = ['Bovino', 'Bubalino', 'Ovino', 'Caprino', 'Equino'];

// ---------- 8.6 Protocolo ----------
export const PROTOCOL_TYPES = [
  { value: 'sanitário', label: 'Sanitário' },
  { value: 'nutricional', label: 'Nutricional' },
  { value: 'reprodutivo', label: 'Reprodutivo' },
];

export function protocolTypeLabel(value: string | null | undefined): string {
  const found = PROTOCOL_TYPES.find((t) => normalize(t.value) === normalize(value));
  return found ? found.label : value ? capitalize(value) : '—';
}

export const ASSOCIATION_STATUSES = [
  { value: 'em andamento', label: 'Em andamento', tone: 'info' as Tone },
  { value: 'concluído', label: 'Concluído', tone: 'healthy' as Tone },
];

export function associationStatusMeta(value: string | null | undefined): { label: string; tone: Tone } {
  const found = ASSOCIATION_STATUSES.find((s) => normalize(s.value) === normalize(value));
  return found ?? { label: value ? capitalize(value) : '—', tone: 'neutral' };
}

export function isAssociationDone(value: string | null | undefined): boolean {
  return normalize(value).startsWith('conclu');
}

// ---------- 8.7 Perfil ----------
export const ROLE_META: Record<Role, { label: string; icon: IconName }> = {
  admin: { label: 'Administrador', icon: 'shield' },
  user: { label: 'Usuário', icon: 'user' },
};

// ---------- Referências de monitoramento (a confirmar, §13.2 item 4) ----------
/** Faixa de referência da temperatura retal de bovinos adultos (°C). */
export const TEMPERATURE_RANGE = { min: 37.5, max: 39.5 };
/** Índices de atividade e alimentação (0–100) abaixo deste valor merecem atenção. */
export const LEVEL_ATTENTION_BELOW = 40;
