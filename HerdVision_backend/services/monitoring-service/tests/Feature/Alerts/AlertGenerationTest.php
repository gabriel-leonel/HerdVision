<?php

namespace Tests\Feature\Alerts;

use App\Models\Alert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AlertGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['monitoring.herd.url' => 'http://herd.test']);
        Http::fake(['herd.test/*' => Http::response(['data' => ['id' => 7]], 200)]);
    }

    private function register(array $indicators): TestResponse
    {
        return $this->asUser()->postJson('/api/readings', array_merge([
            'animal_id' => 7,
            'recorded_at' => now()->subMinutes(10)->toIso8601String(),
            'temperature' => null,
            'activity_level' => null,
            'feeding_level' => null,
        ], $indicators));
    }

    /**
     * @return array<string, array{array<string, float|int>, string|null, string|null}>
     */
    public static function conditions(): array
    {
        return [
            'temperatura no limite (39,5): sem alerta' => [['temperature' => 39.5], null, null],
            'temperatura 39,6: média' => [['temperature' => 39.6], 'temperatura', 'média'],
            'temperatura 39,9: média' => [['temperature' => 39.9], 'temperatura', 'média'],
            'temperatura 40,0: alta' => [['temperature' => 40.0], 'temperatura', 'alta'],
            'atividade 40: sem alerta' => [['activity_level' => 40], null, null],
            'atividade 39: média' => [['activity_level' => 39], 'atividade', 'média'],
            'atividade 25: média' => [['activity_level' => 25], 'atividade', 'média'],
            'atividade 24: alta' => [['activity_level' => 24], 'atividade', 'alta'],
            'alimentação 40: sem alerta' => [['feeding_level' => 40], null, null],
            'alimentação 30: média' => [['feeding_level' => 30], 'alimentação', 'média'],
            'alimentação 0: alta' => [['feeding_level' => 0], 'alimentação', 'alta'],
        ];
    }

    /**
     * @param  array<string, float|int>  $indicators
     */
    #[DataProvider('conditions')]
    public function test_condition_generates_the_expected_alert(array $indicators, ?string $type, ?string $severity): void
    {
        $response = $this->register($indicators)->assertCreated();

        if ($type === null) {
            $response->assertJsonPath('alerts_created', 0);
            $this->assertDatabaseCount('alerts', 0);

            return;
        }

        $response->assertJsonPath('alerts_created', 1);
        $this->assertDatabaseHas('alerts', [
            'animal_id' => 7,
            'monitoring_reading_id' => $response->json('data.id'),
            'type' => $type,
            'severity' => $severity,
            'status' => 'Pendente',
        ]);
    }

    public function test_each_condition_out_of_reference_generates_its_own_alert(): void
    {
        $this->register(['temperature' => 40.2, 'activity_level' => 20, 'feeding_level' => 35])
            ->assertCreated()
            ->assertJsonPath('alerts_created', 3);

        $this->assertSame(['alimentação', 'atividade', 'temperatura'], Alert::orderBy('type')->pluck('type')->all());
    }

    public function test_descriptions_are_in_portuguese_with_pt_br_numbers(): void
    {
        $this->register(['temperature' => 40.2, 'activity_level' => 18, 'feeding_level' => 35])->assertCreated();

        $this->assertSame(
            'Temperatura de 40,2 °C, acima da referência de 39,5 °C. Recomenda-se avaliação.',
            Alert::where('type', 'temperatura')->value('description'),
        );
        $this->assertSame(
            'Índice de atividade em 18, abaixo da referência de 40. Recomenda-se avaliação.',
            Alert::where('type', 'atividade')->value('description'),
        );
        $this->assertSame(
            'Índice de alimentação em 35, abaixo da referência de 40. Vale observar o cocho.',
            Alert::where('type', 'alimentação')->value('description'),
        );
    }

    public function test_thresholds_come_from_config(): void
    {
        config(['monitoring.thresholds.temperature_max' => 39.0]);

        $this->register(['temperature' => 39.2])->assertCreated()->assertJsonPath('alerts_created', 1);
    }

    public function test_alert_creation_is_recorded_in_history_without_user(): void
    {
        $this->register(['temperature' => 41])->assertCreated();
        $alert = Alert::firstOrFail();

        $this->asUser()->getJson("/api/alerts/{$alert->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.history')
            ->assertJsonPath('data.history.0.from', null)
            ->assertJsonPath('data.history.0.to', 'Pendente')
            ->assertJsonPath('data.history.0.user_name', null);
    }
}
