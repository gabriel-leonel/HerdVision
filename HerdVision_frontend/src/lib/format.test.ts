import { describe, expect, it } from 'vitest';
import { animalNumber, formatAge, formatDate, formatNumber, formatRelative, formatTemperature, initials, parseDate } from './format';

describe('formatação pt-BR', () => {
  it('usa separador de milhar e vírgula decimal', () => {
    expect(formatNumber(1248)).toBe('1.248');
    expect(formatTemperature(40.3)).toBe('40,3 °C');
    expect(formatTemperature('39.75')).toBe('39,8 °C');
    expect(formatTemperature(null)).toBe('—');
  });

  it('formata datas como dd/mm/aaaa sem deslocar o fuso em datas sem hora', () => {
    expect(formatDate('2026-11-19')).toBe('19/11/2026');
    expect(parseDate('2026-01-01')?.getDate()).toBe(1);
    expect(formatDate(null)).toBe('—');
  });

  it('descreve tempo relativo', () => {
    const now = new Date('2026-11-19T12:00:00Z');
    expect(formatRelative('2026-11-19T11:48:00Z', now)).toBe('há 12 min');
    expect(formatRelative('2026-11-19T09:00:00Z', now)).toBe('há 3 h');
    expect(formatRelative('2026-11-18T10:00:00Z', now)).toBe('ontem');
  });

  it('calcula a idade em anos e meses', () => {
    expect(formatAge('2024-09-19', new Date(2026, 10, 19))).toBe('2 anos e 2 meses');
    expect(formatAge('2026-05-19', new Date(2026, 10, 19))).toBe('6 meses');
  });

  it('extrai o número curto do animal e as iniciais', () => {
    expect(animalNumber('BR00000154')).toBe('154');
    expect(animalNumber('ABC')).toBe('ABC');
    expect(initials('Ana Ribeiro Souza')).toBe('AS');
  });
});
