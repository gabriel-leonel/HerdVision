<?php

namespace Tests\Feature\Protocols;

use App\Models\Animal;
use App\Models\AnimalManagementProtocol;
use App\Models\ManagementProtocol;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProtocolCrudTest extends TestCase
{
    use RefreshDatabase;

    private function apply(ManagementProtocol $protocol, Animal $animal, string $date = '2026-01-01'): void
    {
        AnimalManagementProtocol::create([
            'animal_id' => $animal->id, 'management_protocol_id' => $protocol->id,
            'start_date' => $date, 'status' => 'em andamento',
        ]);
    }

    // ----------------------------------------------------------------- listar

    public function test_user_can_list_protocols_with_distinct_animal_count(): void
    {
        $protocol = ManagementProtocol::factory()->create(['name' => 'A Vacinação']);
        $animal = Animal::factory()->create();
        // Mesmo animal duas vezes (reaplicação) + outro animal = 2 animais distintos.
        $this->apply($protocol, $animal, '2026-01-01');
        $this->apply($protocol, $animal, '2026-06-01');
        $this->apply($protocol, Animal::factory()->create());
        ManagementProtocol::factory()->count(3)->create();

        $this->asUser()->getJson('/api/protocols?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('data.0.name', 'A Vacinação')
            ->assertJsonPath('data.0.animals_count', 2)
            ->assertJsonPath('data.1.animals_count', 0);
    }

    public function test_list_can_be_searched_and_filtered_by_type_and_active(): void
    {
        ManagementProtocol::factory()->create(['name' => 'Aftosa', 'description' => null, 'type' => 'sanitário', 'active' => true]);
        ManagementProtocol::factory()->create(['name' => 'Sal mineral', 'description' => 'Cocho coberto', 'type' => 'nutricional', 'active' => true]);
        ManagementProtocol::factory()->create(['name' => 'IATF', 'description' => null, 'type' => 'reprodutivo', 'active' => false]);

        $this->asUser()->getJson('/api/protocols?search=aftosa')->assertOk()->assertJsonCount(1, 'data');
        $this->asUser()->getJson('/api/protocols?search=cocho')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Sal mineral');
        $this->asUser()->getJson('/api/protocols?type=reprodutivo')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'IATF');
        $this->asUser()->getJson('/api/protocols?active=false')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.active', false);
        $this->asUser()->getJson('/api/protocols?active=1')->assertOk()->assertJsonCount(2, 'data');
        $this->asUser()->getJson('/api/protocols?active=talvez')->assertUnprocessable()->assertJsonValidationErrors('active');
    }

    // --------------------------------------------------------------- consultar

    public function test_user_can_show_a_protocol(): void
    {
        $protocol = ManagementProtocol::factory()->create(['name' => 'Vermifugação']);
        $this->apply($protocol, Animal::factory()->create());

        $this->asUser()->getJson("/api/protocols/{$protocol->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Vermifugação')
            ->assertJsonPath('data.animals_count', 1);
    }

    public function test_showing_a_missing_protocol_returns_404(): void
    {
        $this->asUser()->getJson('/api/protocols/9999')->assertNotFound()->assertJsonPath('message', 'Recurso não encontrado.');
    }

    // ------------------------------------------------------------------- criar

    public function test_admin_and_user_can_create_a_protocol_active_by_default(): void
    {
        $this->asAdmin()->postJson('/api/protocols', ['name' => 'Aftosa', 'type' => 'sanitário', 'description' => 'Maio e novembro'])
            ->assertCreated()
            ->assertJsonPath('data.active', true)
            ->assertJsonPath('data.animals_count', 0);

        $this->asUser()->postJson('/api/protocols', ['name' => 'Sal', 'type' => 'nutricional', 'active' => false])
            ->assertCreated()
            ->assertJsonPath('data.active', false);

        $this->assertDatabaseHas('management_protocols', ['name' => 'Aftosa', 'active' => true]);
        $this->assertDatabaseHas('management_protocols', ['name' => 'Sal', 'active' => false]);
    }

    public function test_create_validates_the_payload(): void
    {
        $this->asUser()->postJson('/api/protocols', [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'type']);
        $this->asUser()->postJson('/api/protocols', ['name' => 'X', 'type' => 'místico'])->assertUnprocessable()->assertJsonValidationErrors('type');
        $this->asUser()->postJson('/api/protocols', ['name' => 'X', 'type' => 'sanitário', 'active' => 'sim'])->assertUnprocessable()->assertJsonValidationErrors('active');
        $this->asUser()->postJson('/api/protocols', ['name' => str_repeat('a', 256), 'type' => 'sanitário', 'description' => str_repeat('b', 5001)])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'description']);

        $this->assertDatabaseCount('management_protocols', 0);
    }

    // ---------------------------------------------------------------- atualizar

    public function test_protocol_can_be_edited_and_deactivated(): void
    {
        $protocol = ManagementProtocol::factory()->create(['name' => 'Antigo', 'type' => 'sanitário', 'active' => true]);

        $this->asAdmin()->putJson("/api/protocols/{$protocol->id}", ['name' => 'Novo'])->assertOk()->assertJsonPath('data.name', 'Novo');
        $this->asUser()->patchJson("/api/protocols/{$protocol->id}", ['active' => false])->assertOk()->assertJsonPath('data.active', false);

        $this->assertDatabaseHas('management_protocols', ['id' => $protocol->id, 'name' => 'Novo', 'type' => 'sanitário', 'active' => false]);
    }

    public function test_update_validates_the_payload(): void
    {
        $protocol = ManagementProtocol::factory()->create();

        $this->asUser()->patchJson("/api/protocols/{$protocol->id}", ['name' => '', 'type' => 'x', 'active' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'type', 'active']);
    }

    // ------------------------------------------------------------------ excluir

    public function test_admin_can_delete_an_unused_protocol(): void
    {
        $protocol = ManagementProtocol::factory()->create();

        $this->asAdmin()->deleteJson("/api/protocols/{$protocol->id}")->assertNoContent();

        $this->assertDatabaseMissing('management_protocols', ['id' => $protocol->id]);
    }

    public function test_regular_user_cannot_delete_a_protocol(): void
    {
        $protocol = ManagementProtocol::factory()->create();

        $this->asUser()->deleteJson("/api/protocols/{$protocol->id}")->assertForbidden();

        $this->assertDatabaseHas('management_protocols', ['id' => $protocol->id]);
    }

    public function test_deleting_a_protocol_applied_to_animals_is_blocked_with_409(): void
    {
        $protocol = ManagementProtocol::factory()->create();
        $this->apply($protocol, Animal::factory()->create());

        $this->asAdmin()->deleteJson("/api/protocols/{$protocol->id}")
            ->assertStatus(409)
            ->assertJsonPath('animals_count', 1)
            ->assertJsonPath('message', 'Não é possível excluir o protocolo: ele foi aplicado a 1 animal(is). Desative-o em vez de excluir.');

        $this->assertDatabaseHas('management_protocols', ['id' => $protocol->id]);
    }

    public function test_race_between_check_and_delete_still_returns_409_not_500(): void
    {
        $protocol = ManagementProtocol::factory()->create();

        ManagementProtocol::deleting(fn (ManagementProtocol $p) => $this->apply($p, Animal::factory()->create()));

        $this->asAdmin()->deleteJson("/api/protocols/{$protocol->id}")
            ->assertStatus(409)
            ->assertJsonPath('animals_count', 1);

        $this->assertDatabaseHas('management_protocols', ['id' => $protocol->id]);
    }

    public function test_deleting_a_missing_protocol_returns_404(): void
    {
        $this->asAdmin()->deleteJson('/api/protocols/9999')->assertNotFound();
    }
}
