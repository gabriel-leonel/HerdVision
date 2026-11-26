import { describe, expect, it } from 'vitest';
import { toPage, unwrap } from './client';

describe('normalização de respostas da API', () => {
  it('lê Resource Collections do Laravel (data + meta)', () => {
    const page = toPage({ data: [{ id: 1 }], links: {}, meta: { current_page: 2, last_page: 3, per_page: 1, total: 3, from: 2, to: 2 } });
    expect(page.data).toEqual([{ id: 1 }]);
    expect(page.meta).toMatchObject({ current_page: 2, last_page: 3, total: 3 });
  });

  it('lê o paginador simples (campos no topo)', () => {
    const page = toPage({ data: [{ id: 1 }, { id: 2 }], current_page: 1, last_page: 1, per_page: 15, total: 2, from: 1, to: 2 });
    expect(page.meta.total).toBe(2);
  });

  it('aceita lista pura', () => {
    expect(toPage([{ id: 1 }]).meta).toMatchObject({ total: 1, last_page: 1 });
  });

  it('desembrulha { data: {...} }', () => {
    expect(unwrap({ data: { id: 7 } })).toEqual({ id: 7 });
    expect(unwrap({ id: 7 })).toEqual({ id: 7 });
  });
});
