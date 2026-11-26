import type { PageMeta, Paginated } from './types';

/** Aceita `{data: {...}}` (API Resource do Laravel) ou o objeto direto. */
export function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'data' in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

/** Normaliza respostas paginadas: Resource Collection (`data` + `meta`), paginador simples ou lista. */
export function toPage<T>(raw: unknown): Paginated<T> {
  if (Array.isArray(raw)) {
    return { data: raw as T[], meta: singlePageMeta(raw.length) };
  }
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (Array.isArray(obj.data) ? obj.data : []) as T[];
  const source = (obj.meta && typeof obj.meta === 'object' ? obj.meta : obj) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : fallback);

  if (source.current_page === undefined) {
    return { data, meta: singlePageMeta(data.length) };
  }
  const meta: PageMeta = {
    current_page: num(source.current_page, 1),
    last_page: num(source.last_page, 1),
    per_page: num(source.per_page, data.length || 15),
    total: num(source.total, data.length),
    from: source.from == null ? null : num(source.from, 0),
    to: source.to == null ? null : num(source.to, 0),
  };
  return { data, meta };
}

function singlePageMeta(count: number): PageMeta {
  return { current_page: 1, last_page: 1, per_page: Math.max(count, 1), total: count, from: count ? 1 : null, to: count || null };
}

/**
 * Rotas dos serviços (todas existem no backend desde a Release 3).
 */
export const routes = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
  },
  users: '/api/users',
  lots: '/api/lots',
  animals: '/api/animals',
  protocols: '/api/protocols',
  animalProtocols: '/api/animal-protocols', // tabela animal_management_protocol
  readings: '/api/readings', // monitoring-service
  alerts: '/api/alerts', // monitoring-service
};
