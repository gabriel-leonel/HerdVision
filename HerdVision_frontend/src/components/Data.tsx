import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Alert, AlertStatus, PageMeta } from '../api/types';
import { animalNumber, formatNumber, formatRelative } from '../lib/format';
import { alertTypeIcon, ALERT_STATUSES, alertBehavior, HEALTH_META, normalizeSeverity, SEVERITY, type Health } from '../lib/semantics';
import { Icon, type IconName } from './Icon';
import { FlowTag, HealthBadge, SeverityBadge } from './Status';

// ---------------- Cabeçalho de página (§7.2) ----------------
interface PageHeaderProps {
  overline?: ReactNode;
  overlineIcon?: IconName;
  breadcrumb?: { to: string; label: string }[];
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ overline, overlineIcon, breadcrumb, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {breadcrumb ? (
          <Breadcrumb items={breadcrumb} />
        ) : overline ? (
          <p className="t-overline page-header__overline">
            {overlineIcon && <Icon name={overlineIcon} size={14} />}
            {overline}
          </p>
        ) : null}
        <h1 className="t-h1">{title}</h1>
        {subtitle && <p className="c-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

// ---------------- Trilha (§6.19) ----------------
export function Breadcrumb({ items }: { items: { to: string; label: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="Trilha de navegação">
      <ol>
        {items.map((item, i) => (
          <li key={item.to + i}>
            {i > 0 && <Icon name="chevR" size={14} />}
            {i < items.length - 1 ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---------------- Cabeçalho de seção (§6.8) ----------------
export function SectionHeader({ title, action, as: Tag = 'h2', id }: { title: ReactNode; action?: ReactNode; as?: 'h2' | 'h3'; id?: string }) {
  return (
    <div className="section-header">
      <Tag className={Tag === 'h2' ? 't-h2' : 't-h3'} id={id}>
        {title}
      </Tag>
      {action}
    </div>
  );
}

// ---------------- KPI (§6.10) ----------------
export type Trend = 'positive' | 'negative' | 'neutral';

interface KpiCardProps {
  label: string;
  icon?: IconName;
  value: ReactNode;
  unit?: string;
  delta?: { trend: Trend; direction?: 'up' | 'down'; text: ReactNode };
  loading?: boolean;
}

export function KpiCard({ label, icon, value, unit, delta, loading }: KpiCardProps) {
  const deltaIcon: IconName = !delta || delta.trend === 'neutral' || !delta.direction ? 'activity' : delta.direction === 'up' ? 'trendUp' : 'trendDown';
  return (
    <div className="card kpi">
      <p className="kpi__label">
        {icon && <Icon name={icon} size={18} />}
        {label}
      </p>
      {loading ? (
        <div className="skeleton" style={{ height: 38, width: 96, marginTop: 8 }} aria-hidden="true" />
      ) : (
        <p className="t-kpi kpi__value num">
          {value}
          {unit && <span className="kpi__unit">{unit}</span>}
        </p>
      )}
      {delta && !loading && (
        <p className={`kpi__delta kpi__delta--${delta.trend}`}>
          <Icon name={deltaIcon} size={16} />
          <span className="kpi__delta-text">{delta.text}</span>
        </p>
      )}
    </div>
  );
}

// ---------------- Ladrilho de ID e linha de animal (§6.11) ----------------
export function IdTile({ identification, health, size }: { identification: string; health: Health; size?: 'sm' | 'lg' }) {
  return (
    <span className={['id-tile', `id-tile--${health}`, size ? `id-tile--${size}` : ''].join(' ')} aria-hidden="true">
      {animalNumber(identification)}
    </span>
  );
}

interface AnimalRowProps {
  to: string;
  identification: string;
  title: string;
  subtitle: string;
  health: Health;
}

export function AnimalRow({ to, identification, title, subtitle, health }: AnimalRowProps) {
  return (
    <Link to={to} className="animal-row" aria-label={`${title}, ${subtitle}, situação ${HEALTH_META[health].label}`}>
      <IdTile identification={identification} health={health} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="animal-row__name" style={{ display: 'block' }}>
          {title}
        </span>
        <span className="animal-row__sub">{subtitle}</span>
      </span>
      <HealthBadge health={health} />
    </Link>
  );
}

// ---------------- Cartão de alerta (§6.9) ----------------
interface AlertCardProps {
  alert: Alert;
  animalLabel: string;
  lotName?: string | null;
  to?: string;
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
  showStatus?: boolean;
}

export function alertTitle(alert: Pick<Alert, 'type'>, animalLabel: string) {
  return `${animalLabel} ${alertBehavior(alert.type)}`;
}

export function AlertCard({ alert, animalLabel, lotName, to, onClick, compact, selected, showStatus = true }: AlertCardProps) {
  const severity = SEVERITY[normalizeSeverity(alert.severity)];
  const className = ['alert-card', compact ? 'alert-card--compact' : '', selected ? 'alert-card--selected' : ''].filter(Boolean).join(' ');
  const iconSize = compact ? 40 : 44;
  const content = (
    <>
      <span className={`icon-circle icon-circle--${severity.tone}`} style={{ width: iconSize, height: iconSize }}>
        <Icon name={alertTypeIcon(alert.type)} size={compact ? 20 : 22} />
      </span>
      <span className="alert-card__body">
        <span className="alert-card__title" style={{ display: 'block' }}>
          {alertTitle(alert, animalLabel)}
        </span>
        {!compact && <span className="alert-card__desc" style={{ display: 'block' }}>{alert.description}</span>}
        <span className="alert-card__meta">
          <SeverityBadge severity={alert.severity} />
          {showStatus && <FlowTag status={alert.status} />}
          <span className="alert-card__time">
            <Icon name="clock" size={14} />
            {formatRelative(alert.created_at)}
            {lotName ? ` · ${lotName}` : ''}
          </span>
        </span>
      </span>
      <Icon name="chevR" size={20} className="alert-card__chev" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} aria-current={selected ? 'true' : undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-current={selected ? 'true' : undefined}>
      {content}
    </button>
  );
}

// ---------------- Chips (§6.7) ----------------
interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number | null;
}

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="field">
      <span className="field__label" id={`chips-${label}`}>
        {label}
      </span>
      <div className="chips" role="group" aria-labelledby={`chips-${label}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="chip"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && option.count !== null ? ` · ${formatNumber(option.count)}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Paginação (§6.13) ----------------
function pageItems(current: number, last: number): (number | 'gap')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) items.push('gap');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < last - 1) items.push('gap');
  items.push(last);
  return items;
}

export function Pagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  if (meta.last_page <= 1) return null;
  const current = meta.current_page;
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        type="button"
        className="page-btn page-btn--arrow"
        onClick={() => onPage(current - 1)}
        disabled={current <= 1}
        aria-label="Página anterior"
      >
        <Icon name="chevL" size={18} />
      </button>
      {pageItems(current, meta.last_page).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="page-ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="page-btn"
            aria-current={item === current ? 'page' : undefined}
            aria-label={`Página ${item}`}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="page-btn page-btn--arrow"
        onClick={() => onPage(current + 1)}
        disabled={current >= meta.last_page}
        aria-label="Próxima página"
      >
        <Icon name="chevR" size={18} />
      </button>
    </nav>
  );
}

export function TableFooter({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  return (
    <div className="table-footer">
      <p className="c-secondary t-body-m">
        {meta.total === 0
          ? 'Nenhum registro'
          : `Mostrando ${formatNumber(meta.from ?? 0)}–${formatNumber(meta.to ?? 0)} de ${formatNumber(meta.total)}`}
      </p>
      <Pagination meta={meta} onPage={onPage} />
    </div>
  );
}

export const PER_PAGE_OPTIONS = [15, 30, 50];

// ---------------- Indicador de etapas (§6.20) ----------------
export function Stepper({ status }: { status: AlertStatus }) {
  const index = ALERT_STATUSES.indexOf(status);
  return (
    <ol className="stepper" aria-label={`Etapa atual: ${status}`}>
      {ALERT_STATUSES.map((step, i) => (
        <li key={step} className="stepper__item" data-done={i <= index} aria-current={i === index ? 'step' : undefined}>
          <div className="stepper__bar" />
          <p className="stepper__label">
            {i + 1} · {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

// ---------------- Barras horizontais ----------------
export function HBars({ items }: { items: { label: string; value: number; other?: boolean; to?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="hbars">
      {items.map((item) => (
        <li key={item.label}>
          <div className="hbars__head">
            <span className="hbars__name">{item.to ? <Link to={item.to}>{item.label}</Link> : item.label}</span>
            <span className="hbars__value">{formatNumber(item.value)}</span>
          </div>
          <div
            className="hbars__track"
            role="meter"
            aria-label={item.label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={item.value}
          >
            <div className={['hbars__fill', item.other ? 'hbars__fill--other' : ''].join(' ')} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------- Lista de dados ----------------
export function DataList({ items, single }: { items: { label: string; value: ReactNode }[]; single?: boolean }) {
  return (
    <dl className={['data-list', single ? 'data-list--single' : ''].join(' ')}>
      {items.map((item) => (
        <Fragment key={item.label}>
          <div>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        </Fragment>
      ))}
    </dl>
  );
}
