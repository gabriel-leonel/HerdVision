<?php

namespace Tests\Feature;

use App\Models\Animal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Mensagens de validação de animais, protocolos e associações em pt_BR,
 * com os nomes amigáveis dos campos.
 */
class HerdValidationMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_animal_errors_are_in_portuguese(): void
    {
        $this->asUser()->postJson('/api/animals', ['species' => 'Dragão', 'status' => 'doente', 'lot_id' => 9999, 'birth_date' => '2020-13-40'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.identification.0', 'O campo identificação é obrigatório.')
            ->assertJsonPath('errors.species.0', 'O valor selecionado para o campo espécie é inválido.')
            ->assertJsonPath('errors.status.0', 'O valor selecionado para o campo status é inválido.')
            ->assertJsonPath('errors.lot_id.0', 'O valor selecionado para o campo lote é inválido.')
            ->assertJsonPath('errors.birth_date.0', 'O campo data de nascimento deve ser uma data válida no formato AAAA-MM-DD.');
    }

    public function test_protocol_errors_are_in_portuguese(): void
    {
        $this->asUser()->postJson('/api/protocols', ['active' => 'sim'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.name.0', 'O campo nome é obrigatório.')
            ->assertJsonPath('errors.type.0', 'O campo tipo é obrigatório.')
            ->assertJsonPath('errors.active.0', 'O campo situação deve ser verdadeiro ou falso.');
    }

    public function test_association_errors_are_in_portuguese(): void
    {
        $animal = Animal::factory()->create();

        $this->asUser()->postJson('/api/animal-protocols', ['animal_id' => $animal->id, 'start_date' => 'ontem'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.management_protocol_id.0', 'O campo protocolo é obrigatório.')
            ->assertJsonPath('errors.start_date.0', 'O campo data de início deve ser uma data válida no formato AAAA-MM-DD.')
            ->assertJsonPath('errors.status.0', 'O campo status é obrigatório.');
    }
}
