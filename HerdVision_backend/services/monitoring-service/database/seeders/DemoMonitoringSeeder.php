<?php

namespace Database\Seeders;

use App\Enums\AlertStatus;
use App\Models\Alert;
use App\Models\MonitoringReading;
use App\Services\AlertGenerator;
use App\Services\AlertWorkflow;
use Illuminate\Auth\GenericUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Leituras e alertas de demonstração para os animais 1 a 12 do
 * DemoHerdSeeder (herd-service). Os IDs precisam bater com o seed do herd.
 *
 * Os alertas nascem pela regra real (AlertGenerator) e mudam de status pelo
 * fluxo real (AlertWorkflow), com o relógio ajustado a cada passo, para que o
 * histórico fique coerente. Datas relativas ao momento do seed.
 *
 * Idempotente: se já houver leituras, não faz nada.
 */
class DemoMonitoringSeeder extends Seeder
{
    private const ANIMALS = 12;

    public function __construct(
        private readonly AlertGenerator $generator,
        private readonly AlertWorkflow $workflow,
    ) {}

    public function run(): void
    {
        if (MonitoringReading::query()->exists()) {
            return;
        }

        $now = Carbon::now();
        // IDs dos usuários de demonstração do auth-service (SEED_DEMO_USERS).
        $admin = new GenericUser(['id' => 1, 'name' => 'Administrador Demo']);
        $user = new GenericUser(['id' => 2, 'name' => 'Usuário Demo']);

        try {
            DB::transaction(function () use ($now, $admin, $user) {
                $this->routineReadings($now);

                // Animal 9: febre resolvida e depois reaberta (mostra a reabertura).
                [$fever] = $this->reading($now->copy()->subDays(5), 9, ['temperature' => 40.1, 'activity_level' => 66, 'feeding_level' => 72]);
                $this->advance($fever, $now->copy()->subDays(5)->addHours(2), $user);
                $this->advance($fever, $now->copy()->subDays(4), $admin);
                $this->at($now->copy()->subDays(2), fn () => $this->workflow->reopen($fever, $user));

                // Animal 3 (em tratamento): temperatura alta e atividade muito baixa.
                [$temp, $activity] = $this->reading($now->copy()->subDays(2), 3, ['temperature' => 40.4, 'activity_level' => 22, 'feeding_level' => 61]);
                $this->advance($temp, $now->copy()->subDays(2)->addHours(3), $user);
                $this->advance($activity, $now->copy()->subDays(2)->addHour(), $user);
                $this->advance($activity, $now->copy()->subDay()->subHours(4), $admin);

                // Animal 10 (em tratamento): temperatura e alimentação em atenção.
                [, $feeding] = $this->reading($now->copy()->subDay(), 10, ['temperature' => 39.8, 'activity_level' => 58, 'feeding_level' => 32]);
                $this->advance($feeding, $now->copy()->subHours(20), $admin);

                // Pendentes recentes.
                $this->reading($now->copy()->subHours(6), 6, ['temperature' => 38.9, 'activity_level' => 35, 'feeding_level' => 70]);
                $this->reading($now->copy()->subHours(3), 12, ['temperature' => 38.4, 'activity_level' => 62, 'feeding_level' => 18]);
            });
        } finally {
            Carbon::setTestNow();
        }
    }

    /**
     * Quatro leituras normais por animal nos últimos 3 dias (sem alertas).
     */
    private function routineReadings(Carbon $now): void
    {
        foreach (range(1, self::ANIMALS) as $animal) {
            foreach ([72, 48, 24, 2] as $i => $hoursAgo) {
                $this->reading($now->copy()->subHours($hoursAgo)->subMinutes($animal * 3), $animal, [
                    'temperature' => 38.3 + (($animal + $i) % 9) / 10,
                    'activity_level' => 55 + (($animal * 7 + $i * 5) % 36),
                    'feeding_level' => 60 + (($animal * 5 + $i * 3) % 36),
                ]);
            }
        }
    }

    /**
     * @param  array<string, float|int>  $indicators
     * @return list<Alert>
     */
    private function reading(Carbon $at, int $animal, array $indicators): array
    {
        return $this->at($at, function () use ($at, $animal, $indicators) {
            $reading = MonitoringReading::create(['animal_id' => $animal, 'recorded_at' => $at, ...$indicators]);

            return $this->generator->fromReading($reading);
        });
    }

    private function advance(Alert $alert, Carbon $at, GenericUser $by): void
    {
        $this->at($at, function () use ($alert, $by) {
            $next = $alert->fresh()->status->next() ?? AlertStatus::Resolved;
            $this->workflow->transition($alert, $next, $by);
        });
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function at(Carbon $moment, callable $callback): mixed
    {
        Carbon::setTestNow($moment);

        return $callback();
    }
}
