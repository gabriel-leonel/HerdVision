<?php

namespace Tests\Feature\Database;

use App\Models\Alert;
use App\Models\MonitoringReading;
use Database\Seeders\DemoMonitoringSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DemoMonitoringSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_readings_and_alerts_in_every_status(): void
    {
        $this->seed(DemoMonitoringSeeder::class);

        // Animais do DemoHerdSeeder (herd-service): 1 a 12.
        $this->assertSame(range(1, 12), MonitoringReading::distinct()->orderBy('animal_id')->pluck('animal_id')->all());
        $this->assertSame(48 + 5, MonitoringReading::count());

        $this->assertSame(
            ['Em análise' => 2, 'Pendente' => 4, 'Resolvido' => 1],
            Alert::all()->countBy(fn (Alert $a) => $a->status->value)->sortKeys()->all(),
        );
    }

    public function test_history_is_coherent_and_includes_a_reopening(): void
    {
        $this->seed(DemoMonitoringSeeder::class);

        $reopened = Alert::where('animal_id', 9)->firstOrFail()->history;
        $this->assertSame(
            [[null, 'Pendente'], ['Pendente', 'Em análise'], ['Em análise', 'Resolvido'], ['Resolvido', 'Pendente']],
            $reopened->map(fn ($h) => [$h->from_status?->value, $h->to_status->value])->all(),
        );
        $this->assertSame([null, 'Usuário Demo', 'Administrador Demo', 'Usuário Demo'], $reopened->pluck('user_name')->all());

        $times = $reopened->pluck('created_at');
        $this->assertEquals($times->sort()->values(), $times->values());
        $this->assertTrue($times->last()->lessThan(now()));
    }

    public function test_is_idempotent_and_restores_the_clock(): void
    {
        $this->seed(DemoMonitoringSeeder::class);
        $this->seed(DemoMonitoringSeeder::class);

        $this->assertSame(53, MonitoringReading::count());
        $this->assertFalse(Carbon::hasTestNow());
    }
}
