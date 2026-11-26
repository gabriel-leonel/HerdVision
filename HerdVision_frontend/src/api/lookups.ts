// Consultas cruzadas entre serviços. `alerts.animal_id` é só um ID (sem FK entre bancos),
// então o nome/lote do animal é buscado no herd-service quando a tela precisa.
import { animalNumber } from '../lib/format';
import { healthFromAlerts, type Health } from '../lib/semantics';
import { alertsApi, animalsApi } from './resources';
import type { Alert, Animal } from './types';

const animalCache = new Map<number, Promise<Animal | null>>();

export function getAnimalCached(id: number): Promise<Animal | null> {
  let entry = animalCache.get(id);
  if (!entry) {
    entry = animalsApi.get(id).catch(() => {
      animalCache.delete(id);
      return null;
    });
    animalCache.set(id, entry);
  }
  return entry;
}

export function forgetAnimal(id?: number) {
  if (id === undefined) animalCache.clear();
  else animalCache.delete(id);
}

export async function getAnimalsByIds(ids: number[]): Promise<Map<number, Animal>> {
  const unique = [...new Set(ids)];
  const results = await Promise.all(unique.map((id) => getAnimalCached(id)));
  const map = new Map<number, Animal>();
  results.forEach((animal, i) => {
    if (animal) map.set(unique[i], animal);
  });
  return map;
}

/** Rótulo curto do animal: "Animal 154". */
export function animalLabel(animal: Pick<Animal, 'identification'> | null | undefined, fallbackId?: number): string {
  if (animal) return `Animal ${animalNumber(animal.identification)}`;
  return fallbackId !== undefined ? `Animal #${fallbackId}` : 'Animal';
}

/** Título do animal no cabeçalho: nome, se houver, ou "Animal 154". */
export function animalTitle(animal: Pick<Animal, 'identification' | 'name'>): string {
  return animal.name ? animal.name : animalLabel(animal);
}

/** Alertas abertos (Pendente e Em análise), até 100 de cada. */
export async function fetchOpenAlerts(): Promise<Alert[]> {
  const [pending, analysis] = await Promise.all([
    alertsApi.list({ status: 'Pendente', per_page: 100 }),
    alertsApi.list({ status: 'Em análise', per_page: 100 }),
  ]);
  return [...pending.data, ...analysis.data];
}

/** Situação de saúde por animal (§8.4). Retorna `null` se o monitoring-service não responder. */
export async function fetchHealthMap(): Promise<Map<number, Health> | null> {
  try {
    const open = await fetchOpenAlerts();
    const grouped = new Map<number, Alert[]>();
    for (const alert of open) {
      const list = grouped.get(alert.animal_id) ?? [];
      list.push(alert);
      grouped.set(alert.animal_id, list);
    }
    const map = new Map<number, Health>();
    grouped.forEach((alerts, animalId) => map.set(animalId, healthFromAlerts(alerts)));
    return map;
  } catch {
    return null;
  }
}

export function healthOf(map: Map<number, Health> | null | undefined, animalId: number): Health {
  if (!map) return 'unknown';
  return map.get(animalId) ?? 'healthy';
}
