<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Dados de demonstração (lotes, animais, protocolos e associações).
     * No container, só roda com SEED_DEMO_DATA=true (ver docker-entrypoint.sh).
     */
    public function run(): void
    {
        $this->call(DemoHerdSeeder::class);
    }
}
