<?php

namespace Tests\Feature\AnimalProtocols;

use App\Models\Animal;
use App\Models\AnimalManagementProtocol;
use App\Models\ManagementProtocol;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnimalProtocolTest extends TestCase
{
    use RefreshDatabase;

    private function application(array $attributes = []): AnimalManagementProtocol
    {
        return AnimalManagementProtocol::create(array_merge([
            'animal_id' => $attributes['animal_id'] ?? Animal::factory()->create()->id,
            'management_protocol_id' => $attributes['management_protocol_id'] ?? ManagementProtocol::factory()->create()->id,
            'start_date' => '2026-01-01',
            'status' => 'em andamento',
        ], $attributes));
    }

    // ----------------------------------------------------------------- listar

    public function test_list_returns_animal_and_protocol_ordered_by_start_date_desc(): void
    {
        $animal = Animal::factory()->create(['identification' => 'BR1', 'name' => 'Mimosa']);
        $protocol = ManagementProtocol::factory()->create(['name' => 'Aftosa', 'type' => 'sanitário']);
        $old = $this->application(['animal_id' => $animal->id, 'management_protocol_id' => $protocol->id, 'start_date' => '2025-05-01']);
        $new = $this->application(['animal_id' => $animal->id, 'management_protocol_id' => $protocol->id, 'start_date' => '2026-05-01']);

        $this->asUser()->getJson('/api/animal-protocols')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.id', $new->id)
            ->assertJsonPath('data.1.id', $old->id)
            ->assertJsonPath('data.0.start_date', '2026-05-01')
            ->assertJsonPath('data.0.animal', ['id' => $animal->id, 'identification' => 'BR1', 'name' => 'Mimosa'])
            ->assertJsonPath('data.0.protocol', ['id' => $protocol->id, 'name' => 'Aftosa', 'type' => 'sanitário', 'active' => true]);
    }

    public function test_list_can_be_filtered_by_animal_and_protocol(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();
        $this->application(['animal_id' => $animal->id, 'management_protocol_id' => $protocol->id]);
        $this->application(['animal_id' => $animal->id]);
        $this->application(['management_protocol_id' => $protocol->id]);

        $this->asUser()->getJson("/api/animal-protocols?animal_id={$animal->id}")->assertOk()->assertJsonPath('meta.total', 2);
        $this->asUser()->getJson("/api/animal-protocols?management_protocol_id={$protocol->id}")->assertOk()->assertJsonPath('meta.total', 2);
        $this->asUser()->getJson("/api/animal-protocols?animal_id={$animal->id}&management_protocol_id={$protocol->id}")->assertOk()->assertJsonPath('meta.total', 1);
        $this->asUser()->getJson('/api/animal-protocols?animal_id=x')->assertUnprocessable()->assertJsonValidationErrors('animal_id');
    }

    // ----------------------------------------------------------------- aplicar

    public function test_admin_and_user_can_apply_a_protocol_to_an_animal(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();
        $payload = ['animal_id' => $animal->id, 'management_protocol_id' => $protocol->id, 'start_date' => '2026-11-20', 'status' => 'em andamento'];

        $this->asUser()->postJson('/api/animal-protocols', $payload)
            ->assertCreated()
            ->assertJsonPath('data.animal_id', $animal->id)
            ->assertJsonPath('data.protocol.id', $protocol->id)
            ->assertJsonPath('data.start_date', '2026-11-20')
            ->assertJsonPath('data.status', 'em andamento');

        // Reaplicar o mesmo protocolo ao mesmo animal é permitido (histórico).
        $this->asAdmin()->postJson('/api/animal-protocols', [...$payload, 'start_date' => '2026-11-25', 'status' => 'concluído'])->assertCreated();

        $this->assertDatabaseCount('animal_management_protocol', 2);
        $this->assertCount(2, $animal->fresh()->protocols);
    }

    public function test_apply_validates_the_payload(): void
    {
        $this->asUser()->postJson('/api/animal-protocols', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['animal_id', 'management_protocol_id', 'start_date', 'status']);

        $this->asUser()->postJson('/api/animal-protocols', [
            'animal_id' => 9999, 'management_protocol_id' => 9999, 'start_date' => '20/11/2026', 'status' => 'pausado',
        ])->assertUnprocessable()->assertJsonValidationErrors(['animal_id', 'management_protocol_id', 'start_date', 'status']);

        $this->assertDatabaseCount('animal_management_protocol', 0);
    }

    public function test_inactive_protocol_cannot_be_applied(): void
    {
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create(['active' => false]);

        $this->asUser()->postJson('/api/animal-protocols', [
            'animal_id' => $animal->id, 'management_protocol_id' => $protocol->id, 'start_date' => '2026-11-20', 'status' => 'em andamento',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.management_protocol_id.0', 'Protocolos inativos não podem ser associados. Reative o protocolo antes.');

        $this->assertDatabaseCount('animal_management_protocol', 0);
    }

    // ------------------------------------------------------- concluir / reabrir

    public function test_application_can_be_completed_reopened_and_redated(): void
    {
        $application = $this->application();

        $this->asUser()->patchJson("/api/animal-protocols/{$application->id}", ['status' => 'concluído'])
            ->assertOk()->assertJsonPath('data.status', 'concluído');
        $this->asAdmin()->patchJson("/api/animal-protocols/{$application->id}", ['status' => 'em andamento', 'start_date' => '2026-02-01'])
            ->assertOk()->assertJsonPath('data.status', 'em andamento')->assertJsonPath('data.start_date', '2026-02-01');
    }

    public function test_update_only_changes_start_date_and_status(): void
    {
        $application = $this->application();
        $otherAnimal = Animal::factory()->create();

        $this->asUser()->patchJson("/api/animal-protocols/{$application->id}", ['animal_id' => $otherAnimal->id, 'status' => 'concluído'])->assertOk();

        $this->assertDatabaseHas('animal_management_protocol', ['id' => $application->id, 'animal_id' => $application->animal_id, 'status' => 'concluído']);
    }

    public function test_update_validates_the_payload(): void
    {
        $application = $this->application();

        $this->asUser()->patchJson("/api/animal-protocols/{$application->id}", ['status' => 'x', 'start_date' => null])
            ->assertUnprocessable()->assertJsonValidationErrors(['status', 'start_date']);
        $this->asUser()->patchJson('/api/animal-protocols/9999', ['status' => 'concluído'])->assertNotFound();
    }

    // -------------------------------------------------------------- desvincular

    public function test_admin_and_user_can_unlink_without_deleting_animal_or_protocol(): void
    {
        $first = $this->application();
        $second = $this->application();

        $this->asUser()->deleteJson("/api/animal-protocols/{$first->id}")->assertNoContent();
        $this->asAdmin()->deleteJson("/api/animal-protocols/{$second->id}")->assertNoContent();

        $this->assertDatabaseCount('animal_management_protocol', 0);
        $this->assertDatabaseHas('animals', ['id' => $first->animal_id]);
        $this->assertDatabaseHas('management_protocols', ['id' => $first->management_protocol_id]);
        $this->asAdmin()->deleteJson("/api/animal-protocols/{$first->id}")->assertNotFound();
    }

    public function test_protocol_can_be_deleted_after_all_its_applications_are_unlinked(): void
    {
        $application = $this->application();

        $this->asAdmin()->deleteJson("/api/protocols/{$application->management_protocol_id}")->assertStatus(409);
        $this->asUser()->deleteJson("/api/animal-protocols/{$application->id}")->assertNoContent();
        $this->asAdmin()->deleteJson("/api/protocols/{$application->management_protocol_id}")->assertNoContent();
    }
}
