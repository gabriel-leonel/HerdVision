// Backend simulado (modo demonstração). Reproduz os contratos descritos na documentação:
// respostas paginadas do Laravel, erros `{message, errors}`, 401/403/404/409/422/429 e a regra RN01.
// Os dados ficam no localStorage do navegador.
import type { RawResponse, Service } from '../../lib/http';
import type { Alert, AlertStatus, Role } from '../types';
import { createSeed, MOCK_DB_VERSION, type MockDb, type MockUser } from './seed';
import { LEVEL_ATTENTION_BELOW, TEMPERATURE_RANGE } from '../../lib/semantics';
import { formatNumber, todayISO } from '../../lib/format';

interface MockRequest {
  service: Service;
  method: string;
  path: string;
  query: Record<string, unknown>;
  body: unknown;
  token: string | null;
}

interface Ctx {
  req: MockRequest;
  params: string[];
  body: Record<string, unknown>;
  db: MockDb;
  user: TokenClaims | null;
}

interface TokenClaims {
  sub: number;
  name: string;
  email: string;
  role: Role;
  jti: string;
  exp: number;
}

const STORAGE_KEY = 'herdvision.mock.db';
const TOKEN_TTL_SECONDS = 60 * 60;

// ---------------- Persistência ----------------
let cache: MockDb | null = null;

function loadDb(): MockDb {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed.version === MOCK_DB_VERSION) {
        cache = parsed;
        return parsed;
      }
    }
  } catch {
    // dados corrompidos: recria a semente
  }
  cache = createSeed();
  saveDb(cache);
  return cache;
}

function saveDb(db: MockDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // armazenamento indisponível: mantém em memória
  }
}

export function resetMockDb() {
  cache = createSeed();
  saveDb(cache);
}

// ---------------- Utilitários ----------------
const nowIso = () => new Date().toISOString();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function ok(body: unknown, status = 200): RawResponse {
  return { status, body };
}
function fail(status: number, message: string, extra: Record<string, unknown> = {}): RawResponse {
  return { status, body: { message, ...extra } };
}
function invalid(errors: Record<string, string>): RawResponse {
  const fields = Object.keys(errors);
  const first = errors[fields[0]];
  const message = fields.length > 1 ? `${first} (e mais ${fields.length - 1} ${fields.length - 1 === 1 ? 'erro' : 'erros'})` : first;
  return fail(422, message, { errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])) });
}
const notFound = () => fail(404, 'Recurso não encontrado.');
const forbidden = () => fail(403, 'Você não tem permissão para acessar este recurso.');

function norm(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function str(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function paginate<T>(items: T[], query: Record<string, unknown>) {
  const perPage = Math.min(100, Math.max(1, Number(query.per_page) || 15));
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(lastPage, Math.max(1, Number(query.page) || 1));
  const start = (page - 1) * perPage;
  const data = items.slice(start, start + perPage);
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: data.length ? start + 1 : null,
      to: data.length ? start + data.length : null,
    },
  };
}

function encodeToken(claims: TokenClaims): string {
  const bytes = new TextEncoder().encode(JSON.stringify(claims));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `mock.${btoa(binary)}`;
}

function decodeToken(token: string): TokenClaims | null {
  try {
    if (!token.startsWith('mock.')) return null;
    const binary = atob(token.slice(5));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as TokenClaims;
  } catch {
    return null;
  }
}

function publicUser(u: MockUser) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at, updated_at: u.updated_at };
}

function issueToken(u: MockUser) {
  const claims: TokenClaims = {
    sub: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    jti: Math.random().toString(36).slice(2),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  return { user: publicUser(u), access_token: encodeToken(claims), token_type: 'bearer', expires_in: TOKEN_TTL_SECONDS };
}

// Limite de 10 tentativas por minuto em login e cadastro.
const attempts: number[] = [];
function throttled(): boolean {
  const now = Date.now();
  while (attempts.length && now - attempts[0] > 60000) attempts.shift();
  attempts.push(now);
  return attempts.length > 10;
}

// ---------------- Projeções ----------------
function lotOut(db: MockDb, lot: MockDb['lots'][number]) {
  return { ...lot, animals_count: db.animals.filter((a) => a.lot_id === lot.id).length };
}

function animalOut(db: MockDb, animal: MockDb['animals'][number]) {
  const lot = db.lots.find((l) => l.id === animal.lot_id);
  return { ...animal, lot: lot ? { id: lot.id, name: lot.name } : null };
}

function protocolOut(db: MockDb, protocol: MockDb['protocols'][number]) {
  const animalIds = new Set(db.animalProtocols.filter((ap) => ap.management_protocol_id === protocol.id).map((ap) => ap.animal_id));
  return { ...protocol, animals_count: animalIds.size };
}

function associationOut(db: MockDb, ap: MockDb['animalProtocols'][number]) {
  const animal = db.animals.find((a) => a.id === ap.animal_id);
  const protocol = db.protocols.find((p) => p.id === ap.management_protocol_id);
  return {
    ...ap,
    animal: animal ? { id: animal.id, identification: animal.identification, name: animal.name } : null,
    protocol: protocol ? { id: protocol.id, name: protocol.name, type: protocol.type, active: protocol.active } : null,
  };
}

// ---------------- Validação ----------------
const MSG = {
  required: (attr: string) => `O campo ${attr} é obrigatório.`,
  max: (attr: string, n: number) => `O campo ${attr} não pode ter mais de ${formatNumber(n)} caracteres.`,
  min: (attr: string, n: number) => `O campo ${attr} deve ter pelo menos ${n} caracteres.`,
};

function validateLot(db: MockDb, body: Record<string, unknown>, partial: boolean) {
  const errors: Record<string, string> = {};
  if (!partial || 'name' in body) {
    const name = str(body.name);
    if (!name) errors.name = MSG.required('nome');
    else if (name.length > 255) errors.name = MSG.max('nome', 255);
  }
  if ('description' in body && body.description !== null && String(body.description).length > 5000) {
    errors.description = MSG.max('descrição', 5000);
  }
  void db;
  return errors;
}

function validateAnimal(db: MockDb, body: Record<string, unknown>, partial: boolean, currentId?: number) {
  const errors: Record<string, string> = {};
  const has = (k: string) => !partial || k in body;
  if (has('identification')) {
    const v = str(body.identification);
    if (!v) errors.identification = MSG.required('identificação');
    else if (v.length > 255) errors.identification = MSG.max('identificação', 255);
    else if (db.animals.some((a) => norm(a.identification) === norm(v) && a.id !== currentId))
      errors.identification = 'Já existe um animal com esta identificação.';
  }
  if (has('species') && !str(body.species)) errors.species = MSG.required('espécie');
  if (has('status') && !str(body.status)) errors.status = MSG.required('status');
  if (has('lot_id')) {
    if (body.lot_id === null || body.lot_id === undefined || body.lot_id === '') errors.lot_id = MSG.required('lote');
    else if (!db.lots.some((l) => l.id === Number(body.lot_id))) errors.lot_id = 'O lote selecionado é inválido.';
  }
  if ('birth_date' in body && str(body.birth_date)) {
    const v = String(body.birth_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) errors.birth_date = 'O campo data de nascimento não é uma data válida.';
    else if (v > todayISO()) errors.birth_date = 'A data de nascimento não pode estar no futuro.';
  }
  for (const k of ['name', 'breed'] as const) {
    if (k in body && body[k] !== null && String(body[k]).length > 255) errors[k] = MSG.max(k === 'name' ? 'nome' : 'raça', 255);
  }
  return errors;
}

function validateProtocol(body: Record<string, unknown>, partial: boolean) {
  const errors: Record<string, string> = {};
  const has = (k: string) => !partial || k in body;
  if (has('name')) {
    const v = str(body.name);
    if (!v) errors.name = MSG.required('nome');
    else if (v.length > 255) errors.name = MSG.max('nome', 255);
  }
  if (has('type') && !str(body.type)) errors.type = MSG.required('tipo');
  if ('description' in body && body.description !== null && String(body.description).length > 5000)
    errors.description = MSG.max('descrição', 5000);
  if ('active' in body && typeof body.active !== 'boolean') errors.active = 'O campo situação deve ser verdadeiro ou falso.';
  return errors;
}

function applyFields<T extends object>(target: T, body: Record<string, unknown>, fields: (keyof T & string)[]) {
  const record = target as Record<string, unknown>;
  for (const f of fields) {
    if (!(f in body)) continue;
    const v = body[f];
    record[f] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  }
}

// ---------------- Regra simples de geração de alertas ----------------
function generateAlerts(db: MockDb, reading: MockDb['readings'][number]) {
  const created: Alert[] = [];
  const at = nowIso();
  const add = (type: string, severity: string, description: string) => {
    db.seq.alerts += 1;
    const alert: Alert = {
      id: db.seq.alerts,
      animal_id: reading.animal_id,
      monitoring_reading_id: reading.id,
      type,
      description,
      severity,
      status: 'Pendente',
      history: [{ from: null, to: 'Pendente', user_name: null, changed_at: at }],
      created_at: at,
      updated_at: at,
    };
    db.alerts.push(alert);
    created.push(alert);
  };
  const t = reading.temperature === null ? null : Number(reading.temperature);
  if (t !== null && t > TEMPERATURE_RANGE.max) {
    add(
      'temperatura',
      t >= 40 ? 'alta' : 'média',
      `Temperatura de ${formatNumber(t, 1)} °C, acima da referência de ${formatNumber(TEMPERATURE_RANGE.max, 1)} °C. Recomenda-se avaliação.`,
    );
  }
  const activity = reading.activity_level === null ? null : Number(reading.activity_level);
  if (activity !== null && activity < LEVEL_ATTENTION_BELOW) {
    add(
      'atividade',
      activity < 25 ? 'alta' : 'média',
      `Índice de atividade em ${formatNumber(activity)}, abaixo da referência de ${LEVEL_ATTENTION_BELOW}. Recomenda-se avaliação.`,
    );
  }
  const feeding = reading.feeding_level === null ? null : Number(reading.feeding_level);
  if (feeding !== null && feeding < LEVEL_ATTENTION_BELOW) {
    add(
      'alimentação',
      feeding < 25 ? 'alta' : 'média',
      `Índice de alimentação em ${formatNumber(feeding)}, abaixo da referência de ${LEVEL_ATTENTION_BELOW}. Vale observar o cocho.`,
    );
  }
  return created;
}

// ---------------- Rotas ----------------
type Handler = (ctx: Ctx) => RawResponse;
interface Route {
  service: Service;
  method: string;
  pattern: RegExp;
  public?: boolean;
  handler: Handler;
}

const id = '(\\d+)';
const routes: Route[] = [];
const on = (service: Service, method: string, path: string, handler: Handler, isPublic = false) =>
  routes.push({ service, method, pattern: new RegExp(`^${path}$`), handler, public: isPublic });

const isAdmin = (ctx: Ctx) => ctx.user?.role === 'admin';

// --- Auth ---
on(
  'auth',
  'POST',
  '/api/auth/login',
  ({ db, body }) => {
    if (throttled()) return fail(429, 'Muitas tentativas. Aguarde um minuto e tente de novo.');
    const errors: Record<string, string> = {};
    if (!str(body.email)) errors.email = MSG.required('e-mail');
    if (!str(body.password)) errors.password = MSG.required('senha');
    if (Object.keys(errors).length) return invalid(errors);
    const user = db.users.find((u) => norm(u.email) === norm(body.email));
    if (!user || user.password !== body.password) return fail(401, 'Credenciais inválidas.');
    return ok(issueToken(user));
  },
  true,
);

on(
  'auth',
  'POST',
  '/api/auth/register',
  ({ db, body }) => {
    if (throttled()) return fail(429, 'Muitas tentativas. Aguarde um minuto e tente de novo.');
    const errors: Record<string, string> = {};
    const name = str(body.name);
    const email = str(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!name) errors.name = MSG.required('nome');
    else if (name.length < 2) errors.name = MSG.min('nome', 2);
    else if (name.length > 255) errors.name = MSG.max('nome', 255);
    if (!email) errors.email = MSG.required('e-mail');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'O campo e-mail deve ser um endereço de e-mail válido.';
    else if (db.users.some((u) => norm(u.email) === norm(email))) errors.email = 'Este e-mail já está cadastrado.';
    if (!password) errors.password = MSG.required('senha');
    else if (password.length < 8) errors.password = 'O campo senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'O campo senha deve conter letras e números.';
    if (Object.keys(errors).length) return invalid(errors);
    db.seq.users += 1;
    const at = nowIso();
    const user: MockUser = { id: db.seq.users, name: name!, email: email!, password, role: 'user', created_at: at, updated_at: at };
    db.users.push(user);
    return ok(issueToken(user), 201);
  },
  true,
);

on('auth', 'POST', '/api/auth/logout', ({ db, user }) => {
  if (user) db.revoked.push(user.jti);
  return ok({ message: 'Sessão encerrada com sucesso.' });
});

on('auth', 'GET', '/api/users', (ctx) => {
  if (!isAdmin(ctx)) return forbidden();
  const q = norm(ctx.req.query.search);
  const role = str(ctx.req.query.role);
  const items = ctx.db.users
    .filter((u) => (!q || norm(u.name).includes(q) || norm(u.email).includes(q)) && (!role || u.role === role))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map(publicUser);
  return ok(paginate(items, ctx.req.query));
});

// --- Lotes ---
on('herd', 'GET', '/api/lots', ({ db, req }) => {
  const q = norm(req.query.search);
  const items = db.lots
    .filter((l) => !q || norm(l.name).includes(q) || norm(l.description).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((l) => lotOut(db, l));
  return ok(paginate(items, req.query));
});
on('herd', 'GET', `/api/lots/${id}`, ({ db, params }) => {
  const lot = db.lots.find((l) => l.id === Number(params[0]));
  return lot ? ok({ data: lotOut(db, lot) }) : notFound();
});
on('herd', 'POST', '/api/lots', ({ db, body }) => {
  const errors = validateLot(db, body, false);
  if (Object.keys(errors).length) return invalid(errors);
  db.seq.lots += 1;
  const at = nowIso();
  const lot = { id: db.seq.lots, name: str(body.name)!, description: str(body.description), created_at: at, updated_at: at };
  db.lots.push(lot);
  return ok({ data: lotOut(db, lot) }, 201);
});
const updateLot: Handler = ({ db, body, params }) => {
  const lot = db.lots.find((l) => l.id === Number(params[0]));
  if (!lot) return notFound();
  const errors = validateLot(db, body, true);
  if (Object.keys(errors).length) return invalid(errors);
  applyFields(lot, body, ['name', 'description']);
  lot.updated_at = nowIso();
  return ok({ data: lotOut(db, lot) });
};
on('herd', 'PATCH', `/api/lots/${id}`, updateLot);
on('herd', 'PUT', `/api/lots/${id}`, updateLot);
on('herd', 'DELETE', `/api/lots/${id}`, (ctx) => {
  if (!isAdmin(ctx)) return forbidden();
  const lot = ctx.db.lots.find((l) => l.id === Number(ctx.params[0]));
  if (!lot) return notFound();
  const count = ctx.db.animals.filter((a) => a.lot_id === lot.id).length;
  if (count > 0) {
    return fail(409, `Este lote possui ${formatNumber(count)} ${count === 1 ? 'animal' : 'animais'}. Mova ou remova os animais antes de excluir.`, {
      animals_count: count,
    });
  }
  ctx.db.lots = ctx.db.lots.filter((l) => l.id !== lot.id);
  return ok(null, 204);
});

// --- Animais ---
on('herd', 'GET', '/api/animals', ({ db, req }) => {
  const q = norm(req.query.search);
  const lotId = str(req.query.lot_id);
  const status = str(req.query.status);
  const items = db.animals
    .filter(
      (a) =>
        (!q || norm(a.identification).includes(q) || norm(a.name).includes(q) || norm(a.breed).includes(q)) &&
        (!lotId || a.lot_id === Number(lotId)) &&
        (!status || norm(a.status) === norm(status)),
    )
    .sort((a, b) => a.identification.localeCompare(b.identification))
    .map((a) => animalOut(db, a));
  return ok(paginate(items, req.query));
});
on('herd', 'GET', `/api/animals/${id}`, ({ db, params }) => {
  const animal = db.animals.find((a) => a.id === Number(params[0]));
  return animal ? ok({ data: animalOut(db, animal) }) : notFound();
});
on('herd', 'POST', '/api/animals', ({ db, body }) => {
  const errors = validateAnimal(db, body, false);
  if (Object.keys(errors).length) return invalid(errors);
  db.seq.animals += 1;
  const at = nowIso();
  const animal = {
    id: db.seq.animals,
    identification: str(body.identification)!,
    name: str(body.name),
    species: str(body.species)!,
    breed: str(body.breed),
    birth_date: str(body.birth_date),
    status: str(body.status)!,
    lot_id: Number(body.lot_id),
    created_at: at,
    updated_at: at,
  };
  db.animals.push(animal);
  return ok({ data: animalOut(db, animal) }, 201);
});
const updateAnimal: Handler = ({ db, body, params }) => {
  const animal = db.animals.find((a) => a.id === Number(params[0]));
  if (!animal) return notFound();
  const errors = validateAnimal(db, body, true, animal.id);
  if (Object.keys(errors).length) return invalid(errors);
  applyFields(animal, body, ['identification', 'name', 'species', 'breed', 'birth_date', 'status']);
  if ('lot_id' in body) animal.lot_id = Number(body.lot_id);
  animal.updated_at = nowIso();
  return ok({ data: animalOut(db, animal) });
};
on('herd', 'PATCH', `/api/animals/${id}`, updateAnimal);
on('herd', 'PUT', `/api/animals/${id}`, updateAnimal);
on('herd', 'DELETE', `/api/animals/${id}`, (ctx) => {
  if (!isAdmin(ctx)) return forbidden();
  const animalId = Number(ctx.params[0]);
  if (!ctx.db.animals.some((a) => a.id === animalId)) return notFound();
  ctx.db.animals = ctx.db.animals.filter((a) => a.id !== animalId);
  ctx.db.animalProtocols = ctx.db.animalProtocols.filter((ap) => ap.animal_id !== animalId);
  return ok(null, 204);
});

// --- Protocolos ---
on('herd', 'GET', '/api/protocols', ({ db, req }) => {
  const q = norm(req.query.search);
  const type = str(req.query.type);
  const items = db.protocols
    .filter((p) => (!q || norm(p.name).includes(q) || norm(p.description).includes(q)) && (!type || norm(p.type) === norm(type)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((p) => protocolOut(db, p));
  return ok(paginate(items, req.query));
});
on('herd', 'GET', `/api/protocols/${id}`, ({ db, params }) => {
  const p = db.protocols.find((x) => x.id === Number(params[0]));
  return p ? ok({ data: protocolOut(db, p) }) : notFound();
});
on('herd', 'POST', '/api/protocols', ({ db, body }) => {
  const errors = validateProtocol(body, false);
  if (Object.keys(errors).length) return invalid(errors);
  db.seq.protocols += 1;
  const at = nowIso();
  const p = {
    id: db.seq.protocols,
    name: str(body.name)!,
    description: str(body.description),
    type: str(body.type)!,
    active: body.active === undefined ? true : Boolean(body.active),
    created_at: at,
    updated_at: at,
  };
  db.protocols.push(p);
  return ok({ data: protocolOut(db, p) }, 201);
});
const updateProtocol: Handler = ({ db, body, params }) => {
  const p = db.protocols.find((x) => x.id === Number(params[0]));
  if (!p) return notFound();
  const errors = validateProtocol(body, true);
  if (Object.keys(errors).length) return invalid(errors);
  applyFields(p, body, ['name', 'description', 'type', 'active']);
  p.updated_at = nowIso();
  return ok({ data: protocolOut(db, p) });
};
on('herd', 'PATCH', `/api/protocols/${id}`, updateProtocol);
on('herd', 'PUT', `/api/protocols/${id}`, updateProtocol);
on('herd', 'DELETE', `/api/protocols/${id}`, (ctx) => {
  if (!isAdmin(ctx)) return forbidden();
  const p = ctx.db.protocols.find((x) => x.id === Number(ctx.params[0]));
  if (!p) return notFound();
  const count = protocolOut(ctx.db, p).animals_count;
  if (count > 0) {
    return fail(409, `Este protocolo foi aplicado a ${formatNumber(count)} ${count === 1 ? 'animal' : 'animais'}. Desative-o em vez de excluir.`, {
      animals_count: count,
    });
  }
  ctx.db.protocols = ctx.db.protocols.filter((x) => x.id !== p.id);
  return ok(null, 204);
});

// --- Associação animal ↔ protocolo ---
on('herd', 'GET', '/api/animal-protocols', ({ db, req }) => {
  const animalId = str(req.query.animal_id);
  const protocolId = str(req.query.management_protocol_id);
  const items = db.animalProtocols
    .filter((ap) => (!animalId || ap.animal_id === Number(animalId)) && (!protocolId || ap.management_protocol_id === Number(protocolId)))
    .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? '') || b.id - a.id)
    .map((ap) => associationOut(db, ap));
  return ok(paginate(items, req.query));
});
on('herd', 'POST', '/api/animal-protocols', ({ db, body }) => {
  const errors: Record<string, string> = {};
  const animal = db.animals.find((a) => a.id === Number(body.animal_id));
  const protocol = db.protocols.find((p) => p.id === Number(body.management_protocol_id));
  if (!body.animal_id) errors.animal_id = MSG.required('animal');
  else if (!animal) errors.animal_id = 'O animal selecionado é inválido.';
  if (!body.management_protocol_id) errors.management_protocol_id = MSG.required('protocolo');
  else if (!protocol) errors.management_protocol_id = 'O protocolo selecionado é inválido.';
  else if (!protocol.active) errors.management_protocol_id = 'Protocolos inativos não podem ser associados.';
  if (!str(body.status)) errors.status = MSG.required('status');
  if (Object.keys(errors).length) return invalid(errors);
  db.seq.animalProtocols += 1;
  const at = nowIso();
  const ap = {
    id: db.seq.animalProtocols,
    animal_id: animal!.id,
    management_protocol_id: protocol!.id,
    start_date: str(body.start_date),
    status: str(body.status)!,
    created_at: at,
    updated_at: at,
  };
  db.animalProtocols.push(ap);
  return ok({ data: associationOut(db, ap) }, 201);
});
on('herd', 'PATCH', `/api/animal-protocols/${id}`, ({ db, body, params }) => {
  const ap = db.animalProtocols.find((x) => x.id === Number(params[0]));
  if (!ap) return notFound();
  applyFields(ap, body, ['start_date', 'status']);
  ap.updated_at = nowIso();
  return ok({ data: associationOut(db, ap) });
});
on('herd', 'DELETE', `/api/animal-protocols/${id}`, ({ db, params }) => {
  const before = db.animalProtocols.length;
  db.animalProtocols = db.animalProtocols.filter((x) => x.id !== Number(params[0]));
  return before === db.animalProtocols.length ? notFound() : ok(null, 204);
});

// --- Leituras ---
on('monitoring', 'GET', '/api/readings', ({ db, req }) => {
  const animalId = str(req.query.animal_id);
  const items = db.readings
    .filter((r) => !animalId || r.animal_id === Number(animalId))
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  return ok(paginate(items, req.query));
});
on('monitoring', 'GET', `/api/readings/${id}`, ({ db, params }) => {
  const r = db.readings.find((x) => x.id === Number(params[0]));
  return r ? ok({ data: r }) : notFound();
});
on('monitoring', 'POST', '/api/readings', ({ db, body }) => {
  const errors: Record<string, string> = {};
  if (!body.animal_id) errors.animal_id = MSG.required('animal');
  else if (!db.animals.some((a) => a.id === Number(body.animal_id))) errors.animal_id = 'O animal informado não existe no rebanho.';
  if (!str(body.recorded_at)) errors.recorded_at = MSG.required('data e hora da leitura');
  else if (new Date(String(body.recorded_at)).getTime() > Date.now() + 60000) errors.recorded_at = 'A leitura não pode estar no futuro.';
  const numeric = (key: string, label: string, min: number, max: number) => {
    const v = body[key];
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) errors[key] = `O campo ${label} deve estar entre ${min} e ${max}.`;
    return n;
  };
  const temperature = numeric('temperature', 'temperatura', 30, 45);
  const activity = numeric('activity_level', 'atividade', 0, 100);
  const feeding = numeric('feeding_level', 'alimentação', 0, 100);
  if (temperature === null && activity === null && feeding === null && !errors.temperature)
    errors.temperature = 'Informe ao menos um indicador (temperatura, atividade ou alimentação).';
  if (Object.keys(errors).length) return invalid(errors);
  db.seq.readings += 1;
  const at = nowIso();
  const reading = {
    id: db.seq.readings,
    animal_id: Number(body.animal_id),
    temperature,
    activity_level: activity,
    feeding_level: feeding,
    recorded_at: new Date(String(body.recorded_at)).toISOString(),
    created_at: at,
    updated_at: at,
  };
  db.readings.push(reading);
  const alerts = generateAlerts(db, reading);
  return ok({ data: reading, alerts_created: alerts.length }, 201);
});

// --- Alertas ---
on('monitoring', 'GET', '/api/alerts', ({ db, req }) => {
  const status = str(req.query.status);
  const severity = str(req.query.severity);
  const animalId = str(req.query.animal_id);
  const q = norm(req.query.search);
  const items = db.alerts
    .filter(
      (a) =>
        (!status || a.status === status) &&
        (!severity || norm(a.severity) === norm(severity)) &&
        (!animalId || a.animal_id === Number(animalId)) &&
        (!q || norm(a.description).includes(q) || norm(a.type).includes(q)),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return ok(paginate(items, req.query));
});
on('monitoring', 'GET', `/api/alerts/${id}`, ({ db, params }) => {
  const a = db.alerts.find((x) => x.id === Number(params[0]));
  return a ? ok({ data: a }) : notFound();
});

const VALID_TRANSITIONS: Record<AlertStatus, AlertStatus | null> = {
  Pendente: 'Em análise',
  'Em análise': 'Resolvido',
  Resolvido: null,
};
function changeStatus(ctx: Ctx, alert: Alert, to: AlertStatus) {
  const at = nowIso();
  alert.history = [...(alert.history ?? []), { from: alert.status, to, user_name: ctx.user?.name ?? null, changed_at: at }];
  alert.status = to;
  alert.updated_at = at;
}
on('monitoring', 'PATCH', `/api/alerts/${id}/status`, (ctx) => {
  const alert = ctx.db.alerts.find((x) => x.id === Number(ctx.params[0]));
  if (!alert) return notFound();
  const to = str(ctx.body.status) as AlertStatus | null;
  if (!to || !(to in VALID_TRANSITIONS)) return invalid({ status: 'O status informado é inválido.' });
  if (VALID_TRANSITIONS[alert.status] !== to) {
    return invalid({ status: `Transição de status inválida: de "${alert.status}" para "${to}".` });
  }
  changeStatus(ctx, alert, to);
  return ok({ data: alert });
});
on('monitoring', 'POST', `/api/alerts/${id}/reopen`, (ctx) => {
  const alert = ctx.db.alerts.find((x) => x.id === Number(ctx.params[0]));
  if (!alert) return notFound();
  if (alert.status !== 'Resolvido') return invalid({ status: 'Apenas alertas resolvidos podem ser reabertos.' });
  changeStatus(ctx, alert, 'Pendente');
  return ok({ data: alert });
});

// ---------------- Entrada ----------------
export async function handleMockRequest(req: MockRequest): Promise<RawResponse> {
  await delay(180 + Math.random() * 220);
  const db = loadDb();
  const method = req.method.toUpperCase();

  let matched: { route: Route; params: string[] } | null = null;
  for (const route of routes) {
    if (route.service !== req.service || route.method !== method) continue;
    const m = route.pattern.exec(req.path);
    if (m) {
      matched = { route, params: m.slice(1) };
      break;
    }
  }
  if (!matched) return fail(404, 'Recurso não encontrado.');

  let user: TokenClaims | null = null;
  if (!matched.route.public) {
    if (!req.token) return fail(401, 'Token de autenticação não informado.');
    const claims = decodeToken(req.token);
    if (!claims || claims.exp * 1000 < Date.now() || db.revoked.includes(claims.jti)) {
      return fail(401, 'Token de autenticação inválido ou expirado.');
    }
    user = claims;
  }

  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const response = matched.route.handler({ req, params: matched.params, body, db, user });
  if (method !== 'GET') saveDb(db);
  // Devolve uma cópia para que a interface nunca altere o "banco" por referência.
  return { status: response.status, body: response.body == null ? null : JSON.parse(JSON.stringify(response.body)) };
}
