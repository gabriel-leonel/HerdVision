<?php

namespace Tests\Feature\Lots;

use App\Models\Lot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LotValidationMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_validation_errors_are_in_portuguese(): void
    {
        $this->asUser()->postJson('/api/lots', [])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'O campo nome é obrigatório.')
            ->assertJsonPath('errors.name.0', 'O campo nome é obrigatório.');

        $this->asUser()->postJson('/api/lots', ['name' => str_repeat('a', 256), 'description' => str_repeat('b', 5001)])
            ->assertUnprocessable()
            ->assertJsonPath('errors.name.0', 'O campo nome não deve ter mais de 255 caracteres.')
            ->assertJsonPath('errors.description.0', 'O campo descrição não deve ter mais de 5000 caracteres.');
    }

    public function test_update_validation_errors_are_in_portuguese(): void
    {
        $lot = Lot::factory()->create();

        $this->asUser()->patchJson("/api/lots/{$lot->id}", ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('errors.name.0', 'O campo nome é obrigatório.');
    }

    public function test_list_filter_errors_are_in_portuguese(): void
    {
        $this->asUser()->getJson('/api/lots?per_page=1000')
            ->assertUnprocessable()
            ->assertJsonPath('errors.per_page.0', 'O campo itens por página não deve ser maior que 100.');
    }
}
