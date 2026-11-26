// Dados de demonstração do modo mock. Datas são relativas ao momento da criação
// para que o painel sempre tenha "alertas de hoje".
import type { Alert, AlertHistoryEntry, Animal, AnimalProtocol, Lot, Protocol, Reading, User } from '../types';

export interface MockUser extends User {
  password: string;
}

export interface MockDb {
  version: number;
  seq: Record<'users' | 'lots' | 'animals' | 'protocols' | 'animalProtocols' | 'readings' | 'alerts', number>;
  users: MockUser[];
  lots: Omit<Lot, 'animals_count'>[];
  animals: Omit<Animal, 'lot'>[];
  protocols: Omit<Protocol, 'animals_count'>[];
  animalProtocols: Omit<AnimalProtocol, 'animal' | 'protocol'>[];
  readings: Reading[];
  alerts: Alert[];
  revoked: string[];
}

export const MOCK_DB_VERSION = 1;

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@herdvision.dev', password: 'herdvision123' },
  user: { email: 'usuario@herdvision.dev', password: 'herdvision123' },
};

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
const dateOnly = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function createSeed(now: Date = new Date()): MockDb {
  const rand = mulberry32(20261119);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();
  const daysAgo = (days: number) => ago(days * 24 * 60);

  const users: MockUser[] = [
    { id: 1, name: 'Ana Ribeiro', email: DEMO_CREDENTIALS.admin.email, password: DEMO_CREDENTIALS.admin.password, role: 'admin' },
    { id: 2, name: 'João Pereira', email: DEMO_CREDENTIALS.user.email, password: DEMO_CREDENTIALS.user.password, role: 'user' },
    { id: 3, name: 'Carlos Mendes', email: 'carlos.mendes@herdvision.dev', password: 'x1x1x1x1', role: 'admin' },
    { id: 4, name: 'Marina Costa', email: 'marina.costa@herdvision.dev', password: 'x1x1x1x1', role: 'user' },
    { id: 5, name: 'Luiza Andrade', email: 'luiza.andrade@herdvision.dev', password: 'x1x1x1x1', role: 'user' },
    { id: 6, name: 'Pedro Santos', email: 'pedro.santos@herdvision.dev', password: 'x1x1x1x1', role: 'user' },
    { id: 7, name: 'Beatriz Lima', email: 'beatriz.lima@herdvision.dev', password: 'x1x1x1x1', role: 'user' },
    { id: 8, name: 'Rafael Souza', email: 'rafael.souza@herdvision.dev', password: 'x1x1x1x1', role: 'user' },
  ].map((u, i) => ({ ...u, role: u.role as 'admin' | 'user', created_at: daysAgo(120 - i * 9), updated_at: daysAgo(60 - i * 5) }));

  const lots: MockDb['lots'] = [
    { id: 1, name: 'Lote A · Matrizes', description: 'Vacas em produção no Pasto 1, com manejo reprodutivo.' },
    { id: 2, name: 'Lote B · Recria', description: 'Novilhas e garrotes em recria no Pasto 3.' },
    { id: 3, name: 'Lote C · Engorda', description: 'Animais em terminação no confinamento.' },
    { id: 4, name: 'Lote D · Quarentena', description: 'Animais recém-chegados em observação antes de entrar no rebanho.' },
    { id: 5, name: 'Bezerros 2026', description: 'Bezerros nascidos na estação de 2026.' },
  ].map((l, i) => ({ ...l, created_at: daysAgo(200 - i * 20), updated_at: daysAgo(30 - i * 4) }));

  const names = ['Mimosa', 'Estrela', 'Valente', 'Pintada', 'Serena', 'Bonita', 'Trovão', 'Princesa', 'Malhada', 'Faísca', 'Jóia', 'Brisa', 'Cacique', 'Aurora'];
  const breeds = ['Nelore', 'Nelore', 'Angus', 'Brahman', 'Girolando', 'Senepol', 'Tabapuã'];
  const lotPlan: [number, number][] = [
    [1, 9],
    [2, 8],
    [3, 7],
    [5, 4],
  ];
  const numbers = [101, 104, 109, 112, 118, 121, 125, 128, 131, 133, 136, 140, 143, 147, 150, 154, 158, 162, 165, 170, 173, 177, 181, 186, 190, 193, 197, 199];
  // Animais citados nos alertas ficam em lotes previsíveis.
  const forcedLot: Record<number, number> = { 154: 2, 162: 1, 118: 3, 131: 1, 147: 2, 109: 1, 125: 3, 170: 2 };

  const animals: MockDb['animals'] = [];
  const lotQueue: number[] = lotPlan.flatMap(([lot, count]) => Array(count).fill(lot));
  numbers.forEach((num, index) => {
    const lotId = forcedLot[num] ?? lotQueue[index] ?? 1;
    const isCalf = lotId === 5;
    const birth = new Date(now);
    birth.setDate(birth.getDate() - Math.round(isCalf ? between(60, 300) : between(500, 2200)));
    animals.push({
      id: index + 1,
      identification: `BR${String(num).padStart(8, '0')}`,
      name: rand() < 0.55 ? names[index % names.length] : null,
      species: 'Bovino',
      breed: pick(breeds),
      birth_date: rand() < 0.9 ? dateOnly(birth) : null,
      status: num === 199 ? 'inativo' : num === 118 || num === 109 ? 'em tratamento' : 'ativo',
      lot_id: lotId,
      created_at: daysAgo(between(40, 180)),
      updated_at: daysAgo(between(1, 30)),
    });
  });
  const byNumber = (num: number) => animals.find((a) => a.identification.endsWith(String(num)))!;

  // Leituras normais a cada 6 h nos últimos 2 dias.
  const readings: Reading[] = [];
  let readingId = 0;
  const addReading = (animalId: number, minutesAgo: number, temperature: number, activity: number, feeding: number) => {
    readingId += 1;
    const at = ago(minutesAgo);
    readings.push({
      id: readingId,
      animal_id: animalId,
      temperature: Math.round(temperature * 10) / 10,
      activity_level: Math.round(activity),
      feeding_level: Math.round(feeding),
      recorded_at: at,
      created_at: at,
      updated_at: at,
    });
    return readingId;
  };
  for (const animal of animals) {
    if (animal.status === 'inativo') continue;
    for (let step = 8; step >= 1; step -= 1) {
      addReading(animal.id, step * 360 + Math.round(between(0, 40)), between(38.2, 39.2), between(58, 90), between(62, 95));
    }
  }

  // Alertas com leitura de origem fora da referência.
  const alerts: Alert[] = [];
  const admin = users[0].name;
  const operator = users[1].name;
  const addAlert = (
    num: number,
    minutesAgo: number,
    reading: [number, number, number],
    type: string,
    severity: string,
    description: string,
    status: Alert['status'],
  ) => {
    const animal = byNumber(num);
    const rId = addReading(animal.id, minutesAgo, ...reading);
    const created = ago(minutesAgo - 1);
    const history: AlertHistoryEntry[] = [{ from: null, to: 'Pendente', user_name: null, changed_at: created }];
    if (status !== 'Pendente') history.push({ from: 'Pendente', to: 'Em análise', user_name: operator, changed_at: ago(minutesAgo - 30) });
    if (status === 'Resolvido') history.push({ from: 'Em análise', to: 'Resolvido', user_name: admin, changed_at: ago(minutesAgo - 240) });
    alerts.push({
      id: alerts.length + 1,
      animal_id: animal.id,
      monitoring_reading_id: rId,
      type,
      description,
      severity,
      status,
      history,
      created_at: created,
      updated_at: history[history.length - 1].changed_at,
    });
  };

  addAlert(109, 2 * 24 * 60, [40.6, 52, 60], 'temperatura', 'alta', 'Temperatura de 40,6 °C, acima da referência de 39,5 °C. Recomenda-se avaliação.', 'Resolvido');
  addAlert(125, 30 * 60, [38.9, 61, 31], 'alimentação', 'média', 'Ingestão 38% abaixo da média do lote nas últimas 24 h. Vale observar o cocho e o comportamento.', 'Resolvido');
  addAlert(170, 20 * 60, [38.8, 44, 70], 'atividade', 'baixa', 'Movimentação 15% abaixo do padrão do animal. Vale observar nas próximas leituras.', 'Em análise');
  addAlert(147, 5 * 60, [38.7, 47, 72], 'atividade', 'baixa', 'Leve redução de movimentação em relação ao dia anterior. Vale observar.', 'Pendente');
  addAlert(118, 3 * 60, [39.1, 58, 34], 'alimentação', 'média', 'Ingestão 30% abaixo do padrão do animal. Recomenda-se avaliação do cocho e da dentição.', 'Em análise');
  addAlert(131, 2 * 60, [39.7, 63, 66], 'temperatura', 'média', 'Temperatura de 39,7 °C, levemente acima da referência. Vale repetir a medição.', 'Pendente');
  addAlert(162, 40, [40.3, 49, 58], 'temperatura', 'alta', 'Temperatura de 40,3 °C, acima da referência de 39,5 °C. Recomenda-se avaliação.', 'Pendente');
  addAlert(154, 12, [38.9, 22, 64], 'atividade', 'alta', 'Redução de 35% na movimentação em relação à média das últimas 48 h. Recomenda-se avaliação.', 'Pendente');

  const protocols: MockDb['protocols'] = [
    { id: 1, name: 'Vacinação contra febre aftosa', description: 'Aplicação semestral conforme calendário oficial.', type: 'sanitário', active: true },
    { id: 2, name: 'Vermifugação estratégica', description: 'Controle de verminoses no início e no fim das águas.', type: 'sanitário', active: true },
    { id: 3, name: 'Suplementação mineral', description: 'Sal mineral à vontade no cocho coberto.', type: 'nutricional', active: true },
    { id: 4, name: 'IATF — Inseminação em tempo fixo', description: 'Protocolo hormonal de 3 manejos para matrizes.', type: 'reprodutivo', active: true },
    { id: 5, name: 'Creep feeding', description: 'Suplementação privativa para bezerros ao pé da vaca.', type: 'nutricional', active: false },
    { id: 6, name: 'Controle de carrapatos', description: 'Banho carrapaticida a cada 21 dias no período chuvoso.', type: 'sanitário', active: true },
  ].map((p, i) => ({ ...p, created_at: daysAgo(150 - i * 10), updated_at: daysAgo(20 - i * 2) }));

  const animalProtocols: MockDb['animalProtocols'] = [];
  const associate = (animalId: number, protocolId: number, startDaysAgo: number, status: string) => {
    const start = new Date(now);
    start.setDate(start.getDate() - startDaysAgo);
    const at = daysAgo(startDaysAgo);
    animalProtocols.push({
      id: animalProtocols.length + 1,
      animal_id: animalId,
      management_protocol_id: protocolId,
      start_date: dateOnly(start),
      status,
      created_at: at,
      updated_at: at,
    });
  };
  for (const a of animals.filter((x) => x.lot_id === 1)) associate(a.id, 4, 18, 'em andamento');
  for (const a of animals.slice(0, 16)) associate(a.id, 1, 160, 'concluído');
  for (const a of animals.filter((x) => x.lot_id === 2)) associate(a.id, 2, 35, 'concluído');
  for (const a of animals.filter((x) => x.lot_id === 3)) associate(a.id, 3, 50, 'em andamento');
  associate(byNumber(154).id, 2, 4, 'em andamento');
  associate(byNumber(118).id, 6, 7, 'em andamento');

  return {
    version: MOCK_DB_VERSION,
    seq: {
      users: users.length,
      lots: lots.length,
      animals: animals.length,
      protocols: protocols.length,
      animalProtocols: animalProtocols.length,
      readings: readingId,
      alerts: alerts.length,
    },
    users,
    lots,
    animals,
    protocols,
    animalProtocols,
    readings,
    alerts,
    revoked: [],
  };
}
