<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\AnimalManagementProtocol;
use App\Models\Lot;
use App\Models\ManagementProtocol;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Rebanho de demonstração com IDs FIXOS. O seed do monitoring-service
 * (DemoMonitoringSeeder) usa os animais 1 a 12: mantenha os IDs em sincronia.
 *
 * Idempotente: se já houver lotes, não faz nada. No Render (SQLite efêmero)
 * o banco volta a este estado a cada deploy/reinício.
 */
class DemoHerdSeeder extends Seeder
{
    private const LOTS = [
        1 => ['Engorda Norte', 'Novilhos em terminação no pasto de braquiária.'],
        2 => ['Cria Sul', 'Vacas com bezerros ao pé.'],
        3 => ['Leiteiras', 'Vacas em lactação, ordenha duas vezes ao dia.'],
    ];

    /** [id, identificação, nome, espécie, raça, nascimento, status, lote] */
    private const ANIMALS = [
        [1, 'BR1001', 'Trovão', 'Bovino', 'Nelore', '2023-02-14', 'ativo', 1],
        [2, 'BR1002', null, 'Bovino', 'Nelore', '2023-03-02', 'ativo', 1],
        [3, 'BR1003', 'Pintado', 'Bovino', 'Angus', '2022-11-20', 'em tratamento', 1],
        [4, 'BR1004', null, 'Bovino', 'Nelore', '2023-01-09', 'ativo', 1],
        [5, 'BR2001', 'Mimosa', 'Bovino', 'Girolando', '2019-08-30', 'ativo', 2],
        [6, 'BR2002', 'Estrela', 'Bovino', 'Nelore', '2020-04-12', 'ativo', 2],
        [7, 'BR2003', null, 'Bovino', 'Nelore', '2025-06-01', 'ativo', 2],
        [8, 'BR2004', 'Bonita', 'Bovino', 'Girolando', '2018-12-05', 'inativo', 2],
        [9, 'BR3001', 'Malhada', 'Bovino', 'Holandês', '2020-09-18', 'ativo', 3],
        [10, 'BR3002', 'Princesa', 'Bovino', 'Holandês', '2021-01-25', 'em tratamento', 3],
        [11, 'BR3003', 'Jóia', 'Bovino', 'Girolando', '2021-07-07', 'ativo', 3],
        [12, 'BUF001', 'Negão', 'Bubalino', 'Murrah', '2022-05-15', 'ativo', 3],
    ];

    /** [id, nome, tipo, ativo, descrição] */
    private const PROTOCOLS = [
        [1, 'Vacinação contra febre aftosa', 'sanitário', true, 'Dose de reforço semestral conforme calendário oficial.'],
        [2, 'Vermifugação', 'sanitário', true, 'Aplicação de vermífugo e reavaliação em 30 dias.'],
        [3, 'Suplementação mineral', 'nutricional', true, 'Sal mineral à vontade no cocho coberto.'],
        [4, 'IATF', 'reprodutivo', true, 'Inseminação artificial em tempo fixo, protocolo de 3 manejos.'],
        [5, 'Ração de transição', 'nutricional', false, 'Substituído pela suplementação mineral.'],
    ];

    /** [id, animal, protocolo, dias atrás, status] */
    private const APPLICATIONS = [
        [1, 1, 1, 40, 'concluído'],
        [2, 2, 1, 40, 'concluído'],
        [3, 3, 2, 5, 'em andamento'],
        [4, 3, 1, 40, 'concluído'],
        [5, 5, 4, 12, 'em andamento'],
        [6, 6, 4, 12, 'em andamento'],
        [7, 9, 3, 60, 'em andamento'],
        [8, 10, 2, 3, 'em andamento'],
        [9, 11, 3, 60, 'em andamento'],
        [10, 9, 5, 200, 'concluído'],
    ];

    public function run(): void
    {
        if (Lot::query()->exists()) {
            return;
        }

        DB::transaction(function () {
            foreach (self::LOTS as $id => [$name, $description]) {
                (new Lot)->forceFill(['id' => $id, 'name' => $name, 'description' => $description])->save();
            }

            foreach (self::ANIMALS as [$id, $identification, $name, $species, $breed, $birth, $status, $lot]) {
                (new Animal)->forceFill([
                    'id' => $id, 'identification' => $identification, 'name' => $name, 'species' => $species,
                    'breed' => $breed, 'birth_date' => $birth, 'status' => $status, 'lot_id' => $lot,
                ])->save();
            }

            foreach (self::PROTOCOLS as [$id, $name, $type, $active, $description]) {
                (new ManagementProtocol)->forceFill([
                    'id' => $id, 'name' => $name, 'type' => $type, 'active' => $active, 'description' => $description,
                ])->save();
            }

            foreach (self::APPLICATIONS as [$id, $animal, $protocol, $daysAgo, $status]) {
                (new AnimalManagementProtocol)->forceFill([
                    'id' => $id, 'animal_id' => $animal, 'management_protocol_id' => $protocol,
                    'start_date' => now()->subDays($daysAgo)->toDateString(), 'status' => $status,
                ])->save();
            }
        });
    }
}
