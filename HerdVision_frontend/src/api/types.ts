// Tipos espelhando os campos das migrations (release-2-fundacao.md §3).

export type Role = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ListParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface Lot {
  id: number;
  name: string;
  description: string | null;
  animals_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LotRef {
  id: number;
  name: string;
}

export interface Animal {
  id: number;
  identification: string;
  name: string | null;
  species: string;
  breed: string | null;
  birth_date: string | null;
  status: string;
  lot_id: number;
  lot?: LotRef | null;
  created_at: string;
  updated_at: string;
}

export interface Protocol {
  id: number;
  name: string;
  description: string | null;
  type: string;
  active: boolean;
  animals_count?: number;
  created_at: string;
  updated_at: string;
}

/** Linha da tabela `animal_management_protocol` (tem `id` próprio: o mesmo protocolo pode ser reaplicado). */
export interface AnimalProtocol {
  id: number;
  animal_id: number;
  management_protocol_id: number;
  start_date: string | null;
  status: string;
  animal?: Pick<Animal, 'id' | 'identification' | 'name'> | null;
  protocol?: Pick<Protocol, 'id' | 'name' | 'type' | 'active'> | null;
  created_at: string;
  updated_at: string;
}

export interface Reading {
  id: number;
  animal_id: number;
  temperature: number | string | null;
  activity_level: number | string | null;
  feeding_level: number | string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export type AlertStatus = 'Pendente' | 'Em análise' | 'Resolvido';

export interface AlertHistoryEntry {
  from: AlertStatus | null;
  to: AlertStatus;
  user_name?: string | null;
  changed_at: string;
}

export interface Alert {
  id: number;
  animal_id: number;
  monitoring_reading_id: number | null;
  type: string;
  description: string;
  severity: string;
  status: AlertStatus;
  /** Opcional: depende da decisão sobre a entidade de histórico (DESIGN.md §13.2, item 7). */
  history?: AlertHistoryEntry[];
  created_at: string;
  updated_at: string;
}
