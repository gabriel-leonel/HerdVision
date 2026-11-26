import { request } from '../lib/http';
import { routes, toPage, unwrap } from './client';
import type {
  Alert,
  AlertStatus,
  Animal,
  AnimalProtocol,
  AuthResponse,
  ListParams,
  Lot,
  Paginated,
  Protocol,
  Reading,
  Role,
  User,
} from './types';

// ---------------- Auth (auth-service) ----------------
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('auth', routes.auth.login, { method: 'POST', body: { email, password }, auth: false }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('auth', routes.auth.register, { method: 'POST', body: { name, email, password }, auth: false }),
  logout: () => request<unknown>('auth', routes.auth.logout, { method: 'POST' }),
};

// ---------------- Usuários (auth-service, somente admin) ----------------
export const usersApi = {
  list: async (params: ListParams & { role?: Role | '' }): Promise<Paginated<User>> =>
    toPage<User>(await request('auth', routes.users, { query: { ...params } })),
};

// ---------------- Lotes (herd-service) ✅ ----------------
export interface LotInput {
  name?: string;
  description?: string | null;
}

export const lotsApi = {
  list: async (params: ListParams): Promise<Paginated<Lot>> => toPage<Lot>(await request('herd', routes.lots, { query: { ...params } })),
  get: async (id: number | string) => unwrap<Lot>(await request('herd', `${routes.lots}/${id}`)),
  create: async (input: LotInput) => unwrap<Lot>(await request('herd', routes.lots, { method: 'POST', body: input })),
  update: async (id: number | string, input: LotInput) =>
    unwrap<Lot>(await request('herd', `${routes.lots}/${id}`, { method: 'PATCH', body: input })),
  remove: (id: number | string) => request<void>('herd', `${routes.lots}/${id}`, { method: 'DELETE' }),
  /** Todos os lotes (até 100) para selects e gráficos. */
  all: async () => (await lotsApi.list({ per_page: 100 })).data,
};

// ---------------- Animais (herd-service) ----------------
export interface AnimalInput {
  identification?: string;
  name?: string | null;
  species?: string;
  breed?: string | null;
  birth_date?: string | null;
  status?: string;
  lot_id?: number;
}

export interface AnimalListParams extends ListParams {
  lot_id?: number | string;
  status?: string;
}

export const animalsApi = {
  list: async (params: AnimalListParams): Promise<Paginated<Animal>> =>
    toPage<Animal>(await request('herd', routes.animals, { query: { ...params } })),
  get: async (id: number | string) => unwrap<Animal>(await request('herd', `${routes.animals}/${id}`)),
  create: async (input: AnimalInput) => unwrap<Animal>(await request('herd', routes.animals, { method: 'POST', body: input })),
  update: async (id: number | string, input: AnimalInput) =>
    unwrap<Animal>(await request('herd', `${routes.animals}/${id}`, { method: 'PATCH', body: input })),
  remove: (id: number | string) => request<void>('herd', `${routes.animals}/${id}`, { method: 'DELETE' }),
};

// ---------------- Protocolos de manejo (herd-service) ----------------
export interface ProtocolInput {
  name?: string;
  description?: string | null;
  type?: string;
  active?: boolean;
}

export interface ProtocolListParams extends ListParams {
  type?: string;
  active?: boolean;
}

export const protocolsApi = {
  list: async (params: ProtocolListParams): Promise<Paginated<Protocol>> =>
    toPage<Protocol>(await request('herd', routes.protocols, { query: { ...params } })),
  get: async (id: number | string) => unwrap<Protocol>(await request('herd', `${routes.protocols}/${id}`)),
  create: async (input: ProtocolInput) => unwrap<Protocol>(await request('herd', routes.protocols, { method: 'POST', body: input })),
  update: async (id: number | string, input: ProtocolInput) =>
    unwrap<Protocol>(await request('herd', `${routes.protocols}/${id}`, { method: 'PATCH', body: input })),
  remove: (id: number | string) => request<void>('herd', `${routes.protocols}/${id}`, { method: 'DELETE' }),
};

// ---------------- Associação animal ↔ protocolo (herd-service) ----------------
export interface AnimalProtocolInput {
  animal_id: number;
  management_protocol_id: number;
  start_date: string | null;
  status: string;
}

export const animalProtocolsApi = {
  list: async (params: { animal_id?: number | string; management_protocol_id?: number | string; per_page?: number; page?: number }) =>
    toPage<AnimalProtocol>(await request('herd', routes.animalProtocols, { query: { per_page: 100, ...params } })),
  create: async (input: AnimalProtocolInput) =>
    unwrap<AnimalProtocol>(await request('herd', routes.animalProtocols, { method: 'POST', body: input })),
  update: async (id: number, input: Partial<Pick<AnimalProtocolInput, 'start_date' | 'status'>>) =>
    unwrap<AnimalProtocol>(await request('herd', `${routes.animalProtocols}/${id}`, { method: 'PATCH', body: input })),
  remove: (id: number) => request<void>('herd', `${routes.animalProtocols}/${id}`, { method: 'DELETE' }),
};

// ---------------- Leituras (monitoring-service) 🕓 ----------------
export interface ReadingInput {
  animal_id: number;
  temperature: number | null;
  activity_level: number | null;
  feeding_level: number | null;
  recorded_at: string;
}

export const readingsApi = {
  list: async (params: { animal_id?: number | string; page?: number; per_page?: number }) =>
    toPage<Reading>(await request('monitoring', routes.readings, { query: { ...params } })),
  get: async (id: number | string) => unwrap<Reading>(await request('monitoring', `${routes.readings}/${id}`)),
  create: async (input: ReadingInput) => unwrap<Reading>(await request('monitoring', routes.readings, { method: 'POST', body: input })),
};

// ---------------- Alertas (monitoring-service) 🕓 ----------------
export interface AlertListParams extends ListParams {
  status?: AlertStatus | '';
  severity?: string;
  animal_id?: number | string;
}

export const alertsApi = {
  list: async (params: AlertListParams) => toPage<Alert>(await request('monitoring', routes.alerts, { query: { ...params } })),
  get: async (id: number | string) => unwrap<Alert>(await request('monitoring', `${routes.alerts}/${id}`)),
  /** Transição validada no backend (RN01): Pendente → Em análise → Resolvido. */
  transition: async (id: number, status: AlertStatus) =>
    unwrap<Alert>(await request('monitoring', `${routes.alerts}/${id}/status`, { method: 'PATCH', body: { status } })),
  /** Reabertura explícita de um alerta resolvido (RN01, regra 4). */
  reopen: async (id: number) => unwrap<Alert>(await request('monitoring', `${routes.alerts}/${id}/reopen`, { method: 'POST' })),
  /** Total de alertas em um status (usa `meta.total` com `per_page=1`). */
  count: async (params: AlertListParams) => (await alertsApi.list({ ...params, per_page: 1 })).meta.total,
};
