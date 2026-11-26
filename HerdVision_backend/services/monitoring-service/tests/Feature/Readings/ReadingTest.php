<?php

namespace Tests\Feature\Readings;

use App\Models\MonitoringReading;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReadingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['monitoring.herd.url' => 'http://herd.test']);
    }

    private function herdHasAnimal(int $id = 7): void
    {
        Http::fake([
            "herd.test/api/animals/{$id}" => Http::response(['data' => ['id' => $id]], 200),
            'herd.test/*' => Http::response(['message' => 'Recurso não encontrado.'], 404),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'animal_id' => 7,
            'recorded_at' => now()->subHour()->toIso8601String(),
            'temperature' => 38.6,
            'activity_level' => 70,
            'feeding_level' => 80,
        ], $overrides);
    }

    // ---------------------------------------------------------------- registrar

    public function test_user_registers_a_reading_within_reference_without_alerts(): void
    {
        $this->herdHasAnimal();

        $this->asUser()->postJson('/api/readings', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.animal_id', 7)
            ->assertJsonPath('data.temperature', 38.6)
            ->assertJsonPath('data.activity_level', 70)
            ->assertJsonPath('data.feeding_level', 80)
            ->assertJsonPath('alerts_created', 0);

        $this->assertDatabaseCount('monitoring_readings', 1);
        $this->assertDatabaseCount('alerts', 0);
    }

    public function test_herd_is_called_with_the_users_bearer_token(): void
    {
        $this->herdHasAnimal();
        $token = $this->tokenFor(['role' => 'admin']);

        $this->withToken($token)->postJson('/api/readings', $this->payload())->assertCreated();

        Http::assertSent(fn (HttpRequest $r) => $r->url() === 'http://herd.test/api/animals/7'
            && $r->method() === 'GET'
            && $r->hasHeader('Authorization', "Bearer {$token}"));
    }

    public function test_a_single_indicator_is_enough(): void
    {
        $this->herdHasAnimal();

        $this->asUser()->postJson('/api/readings', $this->payload(['temperature' => null, 'activity_level' => null]))
            ->assertCreated()
            ->assertJsonPath('data.temperature', null)
            ->assertJsonPath('data.feeding_level', 80);
    }

    public function test_recorded_at_is_stored_in_utc(): void
    {
        $this->herdHasAnimal();

        $this->asUser()->postJson('/api/readings', $this->payload(['recorded_at' => '2026-11-20T08:30:00-03:00']))
            ->assertCreated()
            ->assertJsonPath('data.recorded_at', '2026-11-20T11:30:00+00:00');
    }

    // ---------------------------------------------------------------- validação

    public function test_animal_that_does_not_exist_in_the_herd_is_rejected(): void
    {
        $this->herdHasAnimal(7);

        $this->asUser()->postJson('/api/readings', $this->payload(['animal_id' => 99]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.animal_id.0', 'O animal informado não existe no rebanho.');

        $this->assertDatabaseCount('monitoring_readings', 0);
    }

    public function test_herd_offline_returns_503_and_saves_nothing(): void
    {
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $this->asUser()->postJson('/api/readings', $this->payload(['temperature' => 41]))
            ->assertStatus(503)
            ->assertJsonPath('message', 'Não foi possível confirmar o animal no serviço de rebanho agora. Tente novamente em instantes.');

        $this->assertDatabaseCount('monitoring_readings', 0);
        $this->assertDatabaseCount('alerts', 0);
    }

    public function test_herd_server_error_also_returns_503(): void
    {
        Http::fake(['herd.test/*' => Http::response('erro', 500)]);

        $this->asUser()->postJson('/api/readings', $this->payload())->assertStatus(503);

        $this->assertDatabaseCount('monitoring_readings', 0);
    }

    public function test_local_validation_runs_before_calling_the_herd(): void
    {
        Http::fake();

        $this->asUser()->postJson('/api/readings', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['animal_id', 'recorded_at', 'temperature']);

        Http::assertNothingSent();
    }

    public function test_at_least_one_indicator_is_required(): void
    {
        Http::fake();

        $this->asUser()->postJson('/api/readings', $this->payload(['temperature' => null, 'activity_level' => null, 'feeding_level' => null]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.temperature.0', 'Informe ao menos um indicador (temperatura, atividade ou alimentação).');
    }

    public function test_indicators_must_be_within_their_ranges(): void
    {
        Http::fake();

        $this->asUser()->postJson('/api/readings', $this->payload(['temperature' => 29.9, 'activity_level' => -1, 'feeding_level' => 100.1]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.temperature.0', 'O campo temperatura deve estar entre 30 e 45.')
            ->assertJsonPath('errors.activity_level.0', 'O campo índice de atividade deve estar entre 0 e 100.')
            ->assertJsonPath('errors.feeding_level.0', 'O campo índice de alimentação deve estar entre 0 e 100.');

        $this->asUser()->postJson('/api/readings', $this->payload(['temperature' => 'quente']))
            ->assertUnprocessable()->assertJsonValidationErrors('temperature');
    }

    public function test_recorded_at_cannot_be_in_the_future_beyond_one_minute(): void
    {
        $this->herdHasAnimal();

        $this->asUser()->postJson('/api/readings', $this->payload(['recorded_at' => now()->addMinutes(5)->toIso8601String()]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.recorded_at.0', 'A leitura não pode estar no futuro.');

        $this->asUser()->postJson('/api/readings', $this->payload(['recorded_at' => now()->addSeconds(30)->toIso8601String()]))
            ->assertCreated();
    }

    // ------------------------------------------------------------------ consultar

    public function test_list_filters_by_animal_newest_first_with_pagination(): void
    {
        MonitoringReading::factory()->create(['animal_id' => 7, 'recorded_at' => '2026-11-01 10:00:00']);
        $latest = MonitoringReading::factory()->create(['animal_id' => 7, 'recorded_at' => '2026-11-10 10:00:00']);
        MonitoringReading::factory()->create(['animal_id' => 8]);

        $this->asUser()->getJson('/api/readings?animal_id=7&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.id', $latest->id);

        $this->asUser()->getJson('/api/readings')->assertOk()->assertJsonPath('meta.total', 3);
        $this->asUser()->getJson('/api/readings?per_page=101')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    public function test_show_returns_a_reading_or_a_clean_404(): void
    {
        $reading = MonitoringReading::factory()->create(['temperature' => 39.1]);

        $this->asUser()->getJson("/api/readings/{$reading->id}")->assertOk()->assertJsonPath('data.temperature', 39.1);
        $this->asUser()->getJson('/api/readings/9999')->assertNotFound()->assertJsonPath('message', 'Recurso não encontrado.');
    }
}
