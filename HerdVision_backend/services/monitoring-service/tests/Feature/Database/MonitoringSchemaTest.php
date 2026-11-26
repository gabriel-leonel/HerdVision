<?php

namespace Tests\Feature\Database;

use App\Enums\AlertStatus;
use App\Models\Alert;
use App\Models\MonitoringReading;
use App\Services\AlertWorkflow;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MonitoringSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_animal_id_is_a_plain_column_not_a_foreign_key(): void
    {
        // Bancos independentes: nenhuma FK física para dados de outro serviço.
        foreach (['monitoring_readings', 'alerts'] as $table) {
            $columns = collect(Schema::getForeignKeys($table))->pluck('columns')->flatten();

            $this->assertNotContains('animal_id', $columns, "{$table}.animal_id não pode ser FK");
        }

        // Consequência prática: aceita um ID de animal que não existe localmente.
        $reading = MonitoringReading::factory()->create(['animal_id' => 987654]);

        $this->assertDatabaseHas('monitoring_readings', ['id' => $reading->id, 'animal_id' => 987654]);
    }

    public function test_reading_requires_animal_and_recorded_at(): void
    {
        $this->expectException(QueryException::class);

        MonitoringReading::factory()->create(['recorded_at' => null]);
    }

    public function test_reading_metrics_are_optional(): void
    {
        $reading = MonitoringReading::create(['animal_id' => 1, 'recorded_at' => now()]);

        $this->assertNull($reading->fresh()->temperature);
        $this->assertNull($reading->fresh()->activity_level);
        $this->assertNull($reading->fresh()->feeding_level);
    }

    public function test_alert_is_created_as_pending(): void
    {
        $alert = Alert::create([
            'animal_id' => 1, 'type' => 'temperatura', 'description' => 'Febre', 'severity' => 'alta',
        ]);

        $this->assertSame(AlertStatus::Pending, $alert->fresh()->status);
        $this->assertDatabaseHas('alerts', ['id' => $alert->id, 'status' => 'Pendente']);
    }

    public function test_alert_status_cannot_be_set_by_mass_assignment(): void
    {
        $alert = Alert::create([
            'animal_id' => 1, 'type' => 'temperatura', 'description' => 'Febre', 'severity' => 'alta',
            'status' => 'Resolvido',
        ]);

        $this->assertSame(AlertStatus::Pending, $alert->fresh()->status);
    }

    public function test_alert_requires_type_description_and_severity(): void
    {
        $this->expectException(QueryException::class);

        Alert::factory()->create(['severity' => null]);
    }

    public function test_alert_can_reference_the_reading_that_generated_it(): void
    {
        $reading = MonitoringReading::factory()->create();
        $alert = Alert::factory()->create(['monitoring_reading_id' => $reading->id]);

        $this->assertTrue($alert->reading->is($reading));
        $this->assertTrue($reading->alerts->first()->is($alert));
    }

    public function test_alert_does_not_need_a_reading(): void
    {
        $alert = Alert::factory()->create();

        $this->assertNull($alert->fresh()->reading);
    }

    public function test_alert_cannot_reference_a_nonexistent_reading(): void
    {
        $this->expectException(QueryException::class);

        Alert::factory()->create(['monitoring_reading_id' => 9999]);
    }

    public function test_deleting_a_reading_keeps_its_alerts(): void
    {
        $reading = MonitoringReading::factory()->create();
        $alert = Alert::factory()->create(['monitoring_reading_id' => $reading->id]);

        $reading->delete();

        $this->assertDatabaseHas('alerts', ['id' => $alert->id, 'monitoring_reading_id' => null]);
    }

    public function test_activity_and_feeding_levels_are_numeric(): void
    {
        $reading = MonitoringReading::create(['animal_id' => 1, 'recorded_at' => now(), 'activity_level' => 37.5, 'feeding_level' => 100]);

        $this->assertSame(37.5, $reading->fresh()->activity_level);
        $this->assertSame(100.0, $reading->fresh()->feeding_level);
        $this->assertSame(1, MonitoringReading::where('activity_level', '<', 40)->count());
    }

    public function test_status_history_is_deleted_with_its_alert(): void
    {
        $alert = app(AlertWorkflow::class)->open([
            'animal_id' => 1, 'type' => 'temperatura', 'description' => 'Febre', 'severity' => 'alta',
        ]);
        $this->assertDatabaseCount('alert_status_changes', 1);

        $alert->delete();

        $this->assertDatabaseCount('alert_status_changes', 0);
    }
}
