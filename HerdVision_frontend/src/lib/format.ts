// Formatação pt-BR (DESIGN.md §4.3 e §12): "1.248", "40,3 °C", "dd/mm/aaaa", 24 h, "há 12 min".

const numberFormatters = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  let formatter = numberFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    numberFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function formatTemperature(value: unknown): string {
  const n = toNumber(value);
  return n === null ? '—' : `${formatNumber(n, 1)} °C`;
}

/** Nível de atividade/alimentação: número com até 1 casa ou o texto recebido. */
export function formatLevel(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = toNumber(value);
  if (n === null) return String(value);
  return formatNumber(n, Number.isInteger(n) ? 0 : 1);
}

/** Converte "aaaa-mm-dd" (sem hora) em data local, evitando o deslocamento de fuso. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '—';
}

export function formatTime(value: string | null | undefined): string {
  const d = parseDate(value);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
}

export function formatDateTime(value: string | null | undefined): string {
  const d = parseDate(value);
  return d ? `${formatDate(value)} · ${formatTime(value)}` : '—';
}

/** "19/11 · 07:40" */
export function formatShortDateTime(value: string | null | undefined): string {
  const d = parseDate(value);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${formatTime(value)}` : '—';
}

export function formatRelative(value: string | null | undefined, now: Date = new Date()): string {
  const d = parseDate(value);
  if (!d) return '—';
  const minutes = Math.round((now.getTime() - d.getTime()) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return formatDate(value);
}

export function formatAge(birth: string | null | undefined, now: Date = new Date()): string {
  const d = parseDate(birth);
  if (!d) return '';
  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) return '';
  if (months < 1) return 'menos de 1 mês';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years > 0 ? `${years} ${years === 1 ? 'ano' : 'anos'}` : '';
  const m = rest > 0 ? `${rest} ${rest === 1 ? 'mês' : 'meses'}` : '';
  return [y, m].filter(Boolean).join(' e ');
}

/** Data local de hoje em "aaaa-mm-dd", para campos `type="date"`. */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Valor para `datetime-local` ("aaaa-mm-ddThh:mm"). */
export function nowLocalInput(now: Date = new Date()): string {
  return `${todayISO(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function longDateLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
}

export function isSameDay(value: string | null | undefined, now: Date = new Date()): boolean {
  const d = parseDate(value);
  return !!d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Número curto do animal para o ladrilho de ID: "BR00000154" → "154". */
export function animalNumber(identification: string | null | undefined): string {
  if (!identification) return '?';
  const digits = identification.replace(/\D/g, '').replace(/^0+/, '');
  if (digits) return digits.slice(-4);
  return identification.slice(0, 3).toUpperCase();
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

export function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
