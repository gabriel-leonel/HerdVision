<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Leituras e alertas de demonstração (animais 1 a 12 do seed do herd).
     * No container, só roda com SEED_DEMO_DATA=true (ver docker-entrypoint.sh).
     */
    public function run(): void
    {
        $this->call(DemoMonitoringSeeder::class);
    }
}
