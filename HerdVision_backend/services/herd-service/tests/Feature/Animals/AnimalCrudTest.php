<?php

namespace Tests\Feature\Animals;

use App\Models\Animal;
use App\Models\AnimalManagementProtocol;
use App\Models\Lot;
use App\Models\ManagementProtocol;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnimalCrudTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'identification' => 'BR0001',
            'name' => 'Mimosa',
            'species' => 'Bovino',
            'breed' => 'Nelore',
            'birth_date' => '2022-03-10',
            'status' => 'ativo',
            'lot_id' => Lot::factory()->create()->id,
        ], $overrides);
    }

    // ----------------------------------------------------------------- listar

    public function test_user_can_list_animals_with_lot_and_pagination(): void
    {
        $lot = Lot::factory()->create(['name' => 'Engorda']);
        Animal::factory()->create(['identification' => 'A001', 'lot_id' => $lot->id]);
        Animal::factory()->count(4)->create();

        $this->asUser()->getJson('/api/animals?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('data.0.identification', 'A001')
            ->assertJsonPath('data.0.lot', ['id' => $lot->id, 'name' => 'Engorda']);
    }

    public function test_list_can_be_searched_by_identification_name_or_breed(): void
    {
        Animal::factory()->create(['identification' => 'XYZ-9', 'name' => null, 'breed' => null]);
        Animal::factory()->create(['identification' => 'A1', 'name' => 'Estrela', 'breed' => null]);
        Animal::factory()->create(['identification' => 'A2', 'name' => null, 'breed' => 'Girolando']);

        $this->asUser()->getJson('/api/animals?search=xyz')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.identification', 'XYZ-9');
        $this->asUser()->getJson('/api/animals?search=estrela')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.identification', 'A1');
        $this->asUser()->getJson('/api/animals?search=giro')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.identification', 'A2');
        $this->asUser()->getJson('/api/animals?search=nada')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_list_can_be_filtered_by_lot_and_status(): void
    {
        $lot = Lot::factory()->create();
        Animal::factory()->create(['lot_id' => $lot->id, 'status' => 'ativo']);
        Animal::factory()->create(['lot_id' => $lot->id, 'status' => 'em tratamento']);
        Animal::factory()->create(['status' => 'em tratamento']);

        $this->asUser()->getJson("/api/animals?lot_id={$lot->id}")->assertOk()->assertJsonPath('meta.total', 2);
        $this->asUser()->getJson('/api/animals?status=em%20tratamento')->assertOk()->assertJsonPath('meta.total', 2);
        $this->asUser()->getJson("/api/animals?lot_id={$lot->id}&status=ativo")->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_list_validates_query_parameters(): void
    {
        $this->asUser()->getJson('/api/animals?per_page=101')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->asUser()->getJson('/api/animals?lot_id=abc')->assertUnprocessable()->assertJsonValidationErrors('lot_id');
        $this->asUser()->getJson('/api/animals?search='.str_repeat('a', 101))->assertUnprocessable()->assertJsonValidationErrors('search');
    }

    // --------------------------------------------------------------- consultar

    public function test_user_can_show_an_animal(): void
    {
        $animal = Animal::factory()->create(['identification' => 'BR1', 'birth_date' => '2021-05-01']);

        $this->asUser()->getJson("/api/animals/{$animal->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $animal->id)
            ->assertJsonPath('data.identification', 'BR1')
            ->assertJsonPath('data.birth_date', '2021-05-01')
            ->assertJsonPath('data.lot.id', $animal->lot_id);
    }

    public function test_showing_a_missing_animal_returns_a_clean_404(): void
    {
        $response = $this->asUser()->getJson('/api/animals/9999')->assertNotFound();

        $this->assertSame('Recurso não encontrado.', $response->json('message'));
    }

    // ------------------------------------------------------------------- criar

    public function test_admin_and_user_can_create_an_animal(): void
    {
        $payload = $this->payload();

        $this->asAdmin()->postJson('/api/animals', $payload)
            ->assertCreated()
            ->assertJsonPath('data.identification', 'BR0001')
            ->assertJsonPath('data.birth_date', '2022-03-10')
            ->assertJsonPath('data.lot.id', $payload['lot_id']);

        $this->asUser()->postJson('/api/animals', $this->payload(['identification' => 'BR0002', 'name' => null, 'breed' => null, 'birth_date' => null]))
            ->assertCreated();

        $this->assertDatabaseHas('animals', ['identification' => 'BR0001', 'lot_id' => $payload['lot_id']]);
        $this->assertDatabaseHas('animals', ['identification' => 'BR0002', 'name' => null]);
    }

    public function test_create_requires_the_mandatory_fields(): void
    {
        $this->asUser()->postJson('/api/animals', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['identification', 'species', 'status', 'lot_id']);

        $this->assertDatabaseCount('animals', 0);
    }

    public function test_identification_must_be_unique(): void
    {
        Animal::factory()->create(['identification' => 'BR0001']);

        $this->asUser()->postJson('/api/animals', $this->payload())
            ->assertUnprocessable()
            ->assertJsonPath('errors.identification.0', 'Já existe um animal com esta identificação.');
    }

    public function test_lot_must_exist(): void
    {
        $this->asUser()->postJson('/api/animals', $this->payload(['lot_id' => 9999]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('lot_id');
    }

    public function test_birth_date_must_be_a_past_date_in_iso_format(): void
    {
        $this->asUser()->postJson('/api/animals', $this->payload(['birth_date' => now()->addDay()->format('Y-m-d')]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.birth_date.0', 'A data de nascimento não pode estar no futuro.');

        $this->asUser()->postJson('/api/animals', $this->payload(['birth_date' => '10/03/2022']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('birth_date');

        $this->asUser()->postJson('/api/animals', $this->payload(['birth_date' => now()->format('Y-m-d')]))
            ->assertCreated();
    }

    public function test_status_and_species_only_accept_known_values(): void
    {
        $this->asUser()->postJson('/api/animals', $this->payload(['status' => 'doente']))
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->asUser()->postJson('/api/animals', $this->payload(['species' => 'Dragão']))
            ->assertUnprocessable()->assertJsonValidationErrors('species');

        foreach (['ativo', 'em tratamento', 'inativo'] as $i => $status) {
            $this->asUser()->postJson('/api/animals', $this->payload(['identification' => "S{$i}", 'status' => $status]))->assertCreated();
        }
    }

    public function test_text_fields_have_a_max_length(): void
    {
        $this->asUser()->postJson('/api/animals', $this->payload([
            'identification' => str_repeat('a', 256),
            'name' => str_repeat('b', 256),
            'breed' => str_repeat('c', 256),
        ]))->assertUnprocessable()->assertJsonValidationErrors(['identification', 'name', 'breed']);
    }

    // ---------------------------------------------------------------- atualizar

    public function test_update_is_partial_with_put_and_patch(): void
    {
        $animal = Animal::factory()->create(['identification' => 'BR1', 'name' => 'Antiga', 'status' => 'ativo']);
        $newLot = Lot::factory()->create();

        $this->asAdmin()->putJson("/api/animals/{$animal->id}", ['name' => 'Via PUT'])->assertOk()->assertJsonPath('data.name', 'Via PUT');
        $this->asUser()->patchJson("/api/animals/{$animal->id}", ['status' => 'em tratamento', 'lot_id' => $newLot->id])
            ->assertOk()
            ->assertJsonPath('data.status', 'em tratamento')
            ->assertJsonPath('data.lot.id', $newLot->id);

        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'identification' => 'BR1', 'name' => 'Via PUT', 'lot_id' => $newLot->id]);
    }

    public function test_optional_fields_can_be_cleared(): void
    {
        $animal = Animal::factory()->create(['name' => 'X', 'breed' => 'Y', 'birth_date' => '2020-01-01']);

        $this->asUser()->patchJson("/api/animals/{$animal->id}", ['name' => null, 'breed' => null, 'birth_date' => null])->assertOk();

        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'name' => null, 'breed' => null, 'birth_date' => null]);
    }

    public function test_update_keeps_its_own_identification_but_rejects_another_animals(): void
    {
        $animal = Animal::factory()->create(['identification' => 'BR1']);
        Animal::factory()->create(['identification' => 'BR2']);

        $this->asUser()->patchJson("/api/animals/{$animal->id}", ['identification' => 'BR1'])->assertOk();
        $this->asUser()->patchJson("/api/animals/{$animal->id}", ['identification' => 'BR2'])
            ->assertUnprocessable()->assertJsonValidationErrors('identification');
    }

    public function test_update_rejects_clearing_mandatory_fields(): void
    {
        $animal = Animal::factory()->create();

        $this->asUser()->patchJson("/api/animals/{$animal->id}", ['identification' => '', 'lot_id' => null, 'status' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['identification', 'lot_id', 'status']);
    }

    public function test_updating_a_missing_animal_returns_404(): void
    {
        $this->asUser()->patchJson('/api/animals/9999', ['name' => 'X'])->assertNotFound();
    }

    // ------------------------------------------------------------------ excluir

    public function test_admin_can_delete_an_animal_and_its_protocol_applications_go_with_it(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();
        AnimalManagementProtocol::create([
            'animal_id' => $animal->id, 'management_protocol_id' => $protocol->id,
            'start_date' => '2026-01-01', 'status' => 'em andamento',
        ]);

        $this->asAdmin()->deleteJson("/api/animals/{$animal->id}")->assertNoContent();

        $this->assertDatabaseMissing('animals', ['id' => $animal->id]);
        $this->assertDatabaseCount('animal_management_protocol', 0);
        $this->assertDatabaseHas('management_protocols', ['id' => $protocol->id]);
        $this->assertDatabaseHas('lots', ['id' => $animal->lot_id]);
    }

    public function test_regular_user_cannot_delete_an_animal(): void
    {
        $animal = Animal::factory()->create();

        $this->asUser()->deleteJson("/api/animals/{$animal->id}")->assertForbidden();

        $this->assertDatabaseHas('animals', ['id' => $animal->id]);
    }

    public function test_deleting_a_missing_animal_returns_404(): void
    {
        $this->asAdmin()->deleteJson('/api/animals/9999')->assertNotFound();
    }
}
