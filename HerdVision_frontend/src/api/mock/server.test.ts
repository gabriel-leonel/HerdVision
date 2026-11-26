import { beforeEach, describe, expect, it } from 'vitest';
import { handleMockRequest, resetMockDb } from './server';
import { DEMO_CREDENTIALS } from './seed';
import type { Service } from '../../lib/http';

async function call(service: Service, method: string, path: string, token: string | null, body?: unknown, query: Record<string, unknown> = {}) {
  return handleMockRequest({ service, method, path, query, body, token });
}

async function loginAs(role: 'admin' | 'user') {
  const res = await call('auth', 'POST', '/api/auth/login', null, DEMO_CREDENTIALS[role]);
  return (res.body as { access_token: string }).access_token;
}

describe('backend simulado', () => {
  beforeEach(() => resetMockDb());

  it('recusa credenciais inválidas com 401 e mensagem genérica', async () => {
    const res = await call('auth', 'POST', '/api/auth/login', null, { email: DEMO_CREDENTIALS.admin.email, password: 'errada123' });
    expect(res.status).toBe(401);
  });

  it('exige token nas rotas protegidas', async () => {
    const res = await call('herd', 'GET', '/api/lots', null);
    expect(res.status).toBe(401);
  });

  it('bloqueia a exclusão de lote com animais (409 + animals_count)', async () => {
    const token = await loginAs('admin');
    const res = await call('herd', 'DELETE', '/api/lots/1', token);
    expect(res.status).toBe(409);
    expect((res.body as { animals_count: number }).animals_count).toBeGreaterThan(0);
  });

  it('permite excluir lote vazio só para admin', async () => {
    const userToken = await loginAs('user');
    expect((await call('herd', 'DELETE', '/api/lots/4', userToken)).status).toBe(403);
    const adminToken = await loginAs('admin');
    expect((await call('herd', 'DELETE', '/api/lots/4', adminToken)).status).toBe(204);
  });

  it('valida campos obrigatórios com 422', async () => {
    const token = await loginAs('user');
    const res = await call('herd', 'POST', '/api/lots', token, { name: '' });
    expect(res.status).toBe(422);
    expect((res.body as { errors: Record<string, string[]> }).errors.name[0]).toMatch(/obrigatório/);
  });

  it('aplica RN01: Pendente → Em análise → Resolvido, sem atalhos', async () => {
    const token = await loginAs('user');
    const list = await call('monitoring', 'GET', '/api/alerts', token, undefined, { status: 'Pendente', per_page: 1 });
    const alert = (list.body as { data: { id: number }[] }).data[0];

    const skip = await call('monitoring', 'PATCH', `/api/alerts/${alert.id}/status`, token, { status: 'Resolvido' });
    expect(skip.status).toBe(422);

    expect((await call('monitoring', 'PATCH', `/api/alerts/${alert.id}/status`, token, { status: 'Em análise' })).status).toBe(200);
    const resolved = await call('monitoring', 'PATCH', `/api/alerts/${alert.id}/status`, token, { status: 'Resolvido' });
    expect((resolved.body as { data: { status: string } }).data.status).toBe('Resolvido');

    const back = await call('monitoring', 'PATCH', `/api/alerts/${alert.id}/status`, token, { status: 'Pendente' });
    expect(back.status).toBe(422);
    const reopened = await call('monitoring', 'POST', `/api/alerts/${alert.id}/reopen`, token);
    expect((reopened.body as { data: { status: string } }).data.status).toBe('Pendente');
  });

  it('gera alerta Pendente para leitura fora da referência', async () => {
    const token = await loginAs('user');
    const res = await call('monitoring', 'POST', '/api/readings', token, {
      animal_id: 1,
      temperature: 40.8,
      activity_level: null,
      feeding_level: null,
      recorded_at: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
    expect((res.body as { alerts_created: number }).alerts_created).toBe(1);
  });
});
