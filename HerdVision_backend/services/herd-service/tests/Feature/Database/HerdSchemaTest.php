<?php

namespace Tests\Feature\Database;

use App\Models\Animal;
use App\Models\Lot;
use App\Models\ManagementProtocol;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HerdSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_lot_has_many_animals(): void
    {
        $lot = Lot::factory()->create();
        Animal::factory()->count(3)->create(['lot_id' => $lot->id]);

        $this->assertCount(3, $lot->animals);
        $this->assertTrue($lot->animals->first()->lot->is($lot));
    }

    public function test_animal_requires_a_lot(): void
    {
        $this->expectException(QueryException::class);

        Animal::factory()->create(['lot_id' => null]);
    }

    public function test_animal_cannot_reference_a_nonexistent_lot(): void
    {
        $this->expectException(QueryException::class);

        Animal::factory()->create(['lot_id' => 9999]);
    }

    public function test_identification_must_be_unique(): void
    {
        $lot = Lot::factory()->create();
        Animal::factory()->create(['identification' => 'BR0001', 'lot_id' => $lot->id]);

        $this->expectException(QueryException::class);

        Animal::factory()->create(['identification' => 'BR0001', 'lot_id' => $lot->id]);
    }

    public function test_lot_with_animals_cannot_be_deleted_at_database_level(): void
    {
        $lot = Lot::factory()->create();
        Animal::factory()->create(['lot_id' => $lot->id]);

        try {
            $lot->delete();
            $this->fail('A exclusão do lote com animais deveria ser bloqueada pelo banco.');
        } catch (QueryException) {
            $this->assertDatabaseHas('lots', ['id' => $lot->id]);
        }
    }

    public function test_empty_lot_can_be_deleted(): void
    {
        $lot = Lot::factory()->create();

        $lot->delete();

        $this->assertDatabaseMissing('lots', ['id' => $lot->id]);
    }

    public function test_animal_and_protocol_many_to_many_works_from_both_sides(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();

        $animal->protocols()->attach($protocol, ['start_date' => '2026-05-10', 'status' => 'aplicado']);

        $this->assertTrue($animal->protocols->first()->is($protocol));
        $this->assertTrue($protocol->animals->first()->is($animal));
        $this->assertSame('aplicado', $animal->protocols->first()->pivot->status);
    }

    public function test_same_protocol_can_be_applied_to_the_same_animal_more_than_once(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();

        $animal->protocols()->attach($protocol, ['start_date' => '2026-05-10', 'status' => 'aplicado']);
        $animal->protocols()->attach($protocol, ['start_date' => '2026-11-10', 'status' => 'aplicado']);

        $this->assertCount(2, $animal->fresh()->protocolApplications);
        $this->assertDatabaseCount('animal_management_protocol', 2);
    }

    public function test_deleting_an_animal_removes_its_protocol_associations(): void
    {
        $animal = Animal::factory()->create();
        $animal->protocols()->attach(ManagementProtocol::factory()->create(), ['start_date' => '2026-05-10', 'status' => 'aplicado']);

        $animal->delete();

        $this->assertDatabaseCount('animal_management_protocol', 0);
    }

    public function test_protocol_in_use_cannot_be_deleted(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();
        $animal->protocols()->attach($protocol, ['start_date' => '2026-05-10', 'status' => 'aplicado']);

        $this->expectException(QueryException::class);

        $protocol->delete();
    }

    public function test_protocol_is_active_by_default(): void
    {
        $protocol = ManagementProtocol::create(['name' => 'Vermifugação', 'type' => 'sanitário']);

        $this->assertTrue($protocol->fresh()->active);
    }
}
