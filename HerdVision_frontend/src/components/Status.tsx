import type { ReactNode } from 'react';
import type { AlertStatus, Role } from '../api/types';
import {
  ALERT_STATUS_META,
  animalStatusLabel,
  associationStatusMeta,
  HEALTH_META,
  normalizeSeverity,
  protocolTypeLabel,
  ROLE_META,
  SEVERITY,
  type Health,
  type Tone,
} from '../lib/semantics';
import { Icon } from './Icon';

/** Badge: sempre ponto colorido + texto (estado nunca só pela cor). */
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`badge badge--${tone}`}>
      <span className="badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function SeverityBadge({ severity, long }: { severity: string; long?: boolean }) {
  const meta = SEVERITY[normalizeSeverity(severity)];
  return <Badge tone={meta.tone}>{long ? meta.long : meta.label}</Badge>;
}

export function HealthBadge({ health }: { health: Health }) {
  const meta = HEALTH_META[health];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function AnimalStatusBadge({ status }: { status: string }) {
  return <Badge tone="neutral">{animalStatusLabel(status)}</Badge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? <Badge tone="healthy">Ativo</Badge> : <Badge tone="neutral">Inativo</Badge>;
}

export function AssociationBadge({ status }: { status: string }) {
  const meta = associationStatusMeta(status);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** Tag de fluxo do alerta (§6.5): separada do badge de severidade. */
export function FlowTag({ status }: { status: AlertStatus }) {
  const meta = ALERT_STATUS_META[status] ?? ALERT_STATUS_META.Pendente;
  return (
    <span className={`tag tag--${meta.tag}`}>
      <Icon name={meta.icon} size={14} />
      {status}
    </span>
  );
}

/** Tag de categoria do protocolo (§6.6): neutra de propósito. */
export function CategoryTag({ type }: { type: string }) {
  return (
    <span className="tag tag--category">
      <Icon name="tag" size={12} />
      {protocolTypeLabel(type)}
    </span>
  );
}

export function RolePill({ role }: { role: Role }) {
  const meta = ROLE_META[role] ?? ROLE_META.user;
  return (
    <span className={`role-pill role-pill--${role === 'admin' ? 'admin' : 'user'}`}>
      <Icon name={meta.icon} size={14} />
      {meta.label}
    </span>
  );
}
