import { describe, expect, it } from 'vitest';
import { alertTypeIcon, healthFromAlerts, nextAlertTransition, normalizeSeverity } from './semantics';

describe('RN01 — próxima transição válida do alerta', () => {
  it('oferece apenas o passo seguinte do fluxo', () => {
    expect(nextAlertTransition('Pendente')).toMatchObject({ kind: 'advance', to: 'Em análise', label: 'Iniciar análise' });
    expect(nextAlertTransition('Em análise')).toMatchObject({ kind: 'advance', to: 'Resolvido', label: 'Marcar como resolvido' });
  });

  it('exige reabertura explícita para alertas resolvidos', () => {
    expect(nextAlertTransition('Resolvido')).toMatchObject({ kind: 'reopen', label: 'Reabrir alerta' });
  });
});

describe('mapeamentos semânticos', () => {
  it('normaliza a severidade com ou sem acento', () => {
    expect(normalizeSeverity('média')).toBe('media');
    expect(normalizeSeverity('MEDIA')).toBe('media');
    expect(normalizeSeverity('alta')).toBe('alta');
    expect(normalizeSeverity('qualquer')).toBe('baixa');
  });

  it('escolhe o ícone pelo tipo do alerta', () => {
    expect(alertTypeIcon('temperatura')).toBe('thermo');
    expect(alertTypeIcon('alimentação')).toBe('utensils');
    expect(alertTypeIcon('outro')).toBe('warn');
  });

  it('deriva a situação do animal só dos alertas abertos', () => {
    expect(healthFromAlerts([])).toBe('healthy');
    expect(healthFromAlerts([{ status: 'Resolvido', severity: 'alta' }])).toBe('healthy');
    expect(healthFromAlerts([{ status: 'Em análise', severity: 'média' }])).toBe('attention');
    expect(
      healthFromAlerts([
        { status: 'Pendente', severity: 'média' },
        { status: 'Pendente', severity: 'alta' },
      ]),
    ).toBe('critical');
  });
});
