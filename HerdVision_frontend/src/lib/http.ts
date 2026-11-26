import { config, isMockMode } from './config';

export type Service = 'auth' | 'herd' | 'monitoring';
export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  /** Envia o token Bearer. Padrão: true. */
  auth?: boolean;
  signal?: AbortSignal;
}

export interface RawResponse {
  status: number;
  body: unknown;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  0: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para acessar este recurso.',
  404: 'Recurso não encontrado.',
  409: 'Não foi possível concluir a ação por causa de registros relacionados.',
  422: 'Confira os campos destacados.',
  429: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
};

/** Erro de API no formato `{"message": "...", "errors"?: {...}}` (padrão dos serviços). */
export class ApiError extends Error {
  readonly status: number;
  readonly data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  /** Primeira mensagem de cada campo de um 422. */
  get fieldErrors(): Record<string, string> {
    const raw = this.data.errors;
    const out: Record<string, string> = {};
    if (raw && typeof raw === 'object') {
      for (const [field, messages] of Object.entries(raw as Record<string, unknown>)) {
        if (Array.isArray(messages) && messages.length > 0) out[field] = String(messages[0]);
        else if (typeof messages === 'string') out[field] = messages;
      }
    }
    return out;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Mensagem amigável para qualquer erro. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Algo deu errado. Tente novamente.';
}

let getToken: () => string | null = () => null;
let onUnauthorized: (() => void) | null = null;

export function configureHttp(options: { getToken: () => string | null; onUnauthorized: () => void }) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function sendLive(service: Service, path: string, options: RequestOptions, token: string | null): Promise<RawResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${config.services[service]}${path}${buildQuery(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { status: 0, body: null };
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text.slice(0, 200) };
    }
  }
  return { status: response.status, body };
}

async function sendMock(service: Service, path: string, options: RequestOptions, token: string | null): Promise<RawResponse> {
  // Importação dinâmica: o backend simulado só entra no bundle quando usado.
  const { handleMockRequest } = await import('../api/mock/server');
  return handleMockRequest({
    service,
    method: options.method ?? 'GET',
    path,
    query: options.query ?? {},
    body: options.body,
    token,
  });
}

export async function request<T>(service: Service, path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth !== false;
  const token = useAuth ? getToken() : null;

  const { status, body } = isMockMode
    ? await sendMock(service, path, options, token)
    : await sendLive(service, path, options, token);

  if (status >= 200 && status < 300) return body as T;

  const data = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const fallback =
    DEFAULT_MESSAGES[status] ??
    (status >= 500 ? 'Ocorreu um erro no servidor. Tente novamente em instantes.' : 'Não foi possível concluir a ação.');
  const message = status !== 0 && typeof data.message === 'string' && data.message ? data.message : fallback;

  // Token ausente, inválido ou expirado em uma rota protegida: encerra a sessão local.
  if (status === 401 && useAuth && token && onUnauthorized) onUnauthorized();

  throw new ApiError(status, message, data);
}
