<?php

namespace Tests\Feature\Lots;

use App\Models\Animal;
use App\Models\Lot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LotCrudTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------- acesso

    public function test_every_endpoint_requires_authentication(): void
    {
        $lot = Lot::factory()->create();

        $this->getJson('/api/lots')->assertUnauthorized();
        $this->getJson("/api/lots/{$lot->id}")->assertUnauthorized();
        $this->postJson('/api/lots', ['name' => 'X'])->assertUnauthorized();
        $this->putJson("/api/lots/{$lot->id}", ['name' => 'X'])->assertUnauthorized();
        $this->patchJson("/api/lots/{$lot->id}", ['name' => 'X'])->assertUnauthorized();
        $this->deleteJson("/api/lots/{$lot->id}")->assertUnauthorized();
    }

    public function test_token_with_an_unknown_role_can_read_but_not_write(): void
    {
        $lot = Lot::factory()->create();
        $token = $this->tokenFor(['role' => 'visitante']);

        $this->withToken($token)->getJson('/api/lots')->assertOk();
        $this->withToken($token)->postJson('/api/lots', ['name' => 'X'])->assertForbidden();
        $this->withToken($token)->patchJson("/api/lots/{$lot->id}", ['name' => 'X'])->assertForbidden();
        $this->withToken($token)->deleteJson("/api/lots/{$lot->id}")->assertForbidden();
    }

    // ----------------------------------------------------------------- listar

    public function test_user_can_list_lots_with_pagination_and_animal_count(): void
    {
        $busy = Lot::factory()->create(['name' => 'A Lote cheio']);
        Animal::factory()->count(3)->create(['lot_id' => $busy->id]);
        Lot::factory()->count(4)->create();

        $this->asUser()->getJson('/api/lots?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('data.0.name', 'A Lote cheio')
            ->assertJsonPath('data.0.animals_count', 3);
    }

    public function test_list_can_be_searched_by_name_or_description(): void
    {
        Lot::factory()->create(['name' => 'Engorda Norte', 'description' => null]);
        Lot::factory()->create(['name' => 'Cria Sul', 'description' => 'Bezerros desmamados']);
        Lot::factory()->create(['name' => 'Leite', 'description' => null]);

        $this->asUser()->getJson('/api/lots?search=norte')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Engorda Norte');
        $this->asUser()->getJson('/api/lots?search=bezerros')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Cria Sul');
        $this->asUser()->getJson('/api/lots?search=inexistente')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_list_validates_query_parameters(): void
    {
        $this->asUser()->getJson('/api/lots?per_page=1000')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->asUser()->getJson('/api/lots?per_page=0')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    // --------------------------------------------------------------- consultar

    public function test_user_can_show_a_lot(): void
    {
        $lot = Lot::factory()->create(['name' => 'Lote 1']);
        Animal::factory()->count(2)->create(['lot_id' => $lot->id]);

        $this->asUser()->getJson("/api/lots/{$lot->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $lot->id)
            ->assertJsonPath('data.name', 'Lote 1')
            ->assertJsonPath('data.animals_count', 2);
    }

    public function test_showing_a_missing_lot_returns_a_clean_404(): void
    {
        $response = $this->asUser()->getJson('/api/lots/9999')->assertNotFound();

        $this->assertSame('Recurso não encontrado.', $response->json('message'));
        $this->assertStringNotContainsString('App\\Models', $response->getContent());
    }

    // ------------------------------------------------------------------- criar

    public function test_admin_and_user_can_create_a_lot(): void
    {
        $this->asAdmin()->postJson('/api/lots', ['name' => 'Lote do admin', 'description' => 'Primeiro'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Lote do admin')
            ->assertJsonPath('data.description', 'Primeiro')
            ->assertJsonPath('data.animals_count', 0);

        $this->asUser()->postJson('/api/lots', ['name' => 'Lote do user'])->assertCreated();

        $this->assertDatabaseHas('lots', ['name' => 'Lote do admin', 'description' => 'Primeiro']);
        $this->assertDatabaseHas('lots', ['name' => 'Lote do user', 'description' => null]);
    }

    public function test_create_validates_the_payload(): void
    {
        $this->asUser()->postJson('/api/lots', [])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->asUser()->postJson('/api/lots', ['name' => ''])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->asUser()->postJson('/api/lots', ['name' => str_repeat('a', 256)])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->asUser()->postJson('/api/lots', ['name' => ['array']])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseCount('lots', 0);
    }

    public function test_create_ignores_fields_that_are_not_fillable(): void
    {
        $this->asUser()->postJson('/api/lots', ['name' => 'Seguro', 'id' => 777, 'created_at' => '2000-01-01'])
            ->assertCreated();

        $lot = Lot::firstOrFail();
        $this->assertNotSame(777, $lot->id);
        $this->assertNotSame('2000', $lot->created_at->format('Y'));
    }

    // ---------------------------------------------------------------- atualizar

    public function test_admin_and_user_can_update_with_put_and_patch(): void
    {
        $lot = Lot::factory()->create(['name' => 'Antigo', 'description' => 'desc']);

        $this->asAdmin()->putJson("/api/lots/{$lot->id}", ['name' => 'Via PUT'])->assertOk()->assertJsonPath('data.name', 'Via PUT');
        $this->asUser()->patchJson("/api/lots/{$lot->id}", ['name' => 'Via PATCH'])->assertOk()->assertJsonPath('data.name', 'Via PATCH');

        $this->assertDatabaseHas('lots', ['id' => $lot->id, 'name' => 'Via PATCH']);
    }

    public function test_update_is_partial_and_description_can_be_cleared(): void
    {
        $lot = Lot::factory()->create(['name' => 'Nome', 'description' => 'Descrição']);

        $this->asUser()->patchJson("/api/lots/{$lot->id}", ['description' => 'Nova'])->assertOk();
        $this->assertDatabaseHas('lots', ['id' => $lot->id, 'name' => 'Nome', 'description' => 'Nova']);

        $this->asUser()->patchJson("/api/lots/{$lot->id}", ['description' => null])->assertOk();
        $this->assertDatabaseHas('lots', ['id' => $lot->id, 'name' => 'Nome', 'description' => null]);
    }

    public function test_update_validates_the_payload(): void
    {
        $lot = Lot::factory()->create(['name' => 'Intacto']);

        $this->asUser()->patchJson("/api/lots/{$lot->id}", ['name' => ''])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseHas('lots', ['id' => $lot->id, 'name' => 'Intacto']);
    }

    public function test_updating_a_missing_lot_returns_404(): void
    {
        $this->asUser()->patchJson('/api/lots/9999', ['name' => 'X'])->assertNotFound();
    }

    // ------------------------------------------------------------------ excluir

    public function test_admin_can_delete_an_empty_lot(): void
    {
        $lot = Lot::factory()->create();

        $this->asAdmin()->deleteJson("/api/lots/{$lot->id}")->assertNoContent();

        $this->assertDatabaseMissing('lots', ['id' => $lot->id]);
    }

    public function test_regular_user_cannot_delete_a_lot(): void
    {
        $lot = Lot::factory()->create();

        $this->asUser()->deleteJson("/api/lots/{$lot->id}")->assertForbidden();

        $this->assertDatabaseHas('lots', ['id' => $lot->id]);
    }

    public function test_deleting_a_lot_with_animals_is_blocked_with_409(): void
    {
        $lot = Lot::factory()->create();
        Animal::factory()->count(2)->create(['lot_id' => $lot->id]);

        $this->asAdmin()->deleteJson("/api/lots/{$lot->id}")
            ->assertStatus(409)
            ->assertJsonPath('animals_count', 2)
            ->assertJsonFragment(['message' => 'Não é possível excluir o lote: ele possui 2 animal(is) associado(s). Mova ou remova os animais antes.']);

        $this->assertDatabaseHas('lots', ['id' => $lot->id]);
        $this->assertDatabaseCount('animals', 2);
    }

    public function test_lot_can_be_deleted_once_its_animals_are_gone(): void
    {
        $lot = Lot::factory()->create();
        $animal = Animal::factory()->create(['lot_id' => $lot->id]);

        $this->asAdmin()->deleteJson("/api/lots/{$lot->id}")->assertStatus(409);

        $animal->delete();

        $this->asAdmin()->deleteJson("/api/lots/{$lot->id}")->assertNoContent();
    }

    public function test_race_between_check_and_delete_still_returns_409_not_500(): void
    {
        $lot = Lot::factory()->create();

        // Simula outro request vinculando um animal DEPOIS da checagem do
        // controller e ANTES do DELETE: a FK (RESTRICT) barra e vira 409.
        Lot::deleting(fn (Lot $l) => Animal::factory()->create(['lot_id' => $l->id]));

        $this->asAdmin()->deleteJson("/api/lots/{$lot->id}")
            ->assertStatus(409)
            ->assertJsonPath('animals_count', 1);

        $this->assertDatabaseHas('lots', ['id' => $lot->id]);
    }

    public function test_deleting_a_missing_lot_returns_404(): void
    {
        $this->asAdmin()->deleteJson('/api/lots/9999')->assertNotFound();
    }
}
