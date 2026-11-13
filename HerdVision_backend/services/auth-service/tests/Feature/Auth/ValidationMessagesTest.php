<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidationMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_validation_errors_in_portuguese(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'O campo nome é obrigatório. (e mais 2 erros)')
            ->assertJsonPath('errors.name.0', 'O campo nome é obrigatório.')
            ->assertJsonPath('errors.email.0', 'O campo e-mail é obrigatório.')
            ->assertJsonPath('errors.password.0', 'O campo senha é obrigatório.');
    }

    public function test_password_rules_are_translated(): void
    {
        $this->postJson('/api/auth/register', ['name' => 'Maria', 'email' => 'maria@fazenda.com', 'password' => 'abc'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'O campo senha deve ter pelo menos 8 caracteres.');

        $this->postJson('/api/auth/register', ['name' => 'Maria', 'email' => 'maria@fazenda.com', 'password' => 'abcdefgh'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'O campo senha deve conter pelo menos um número.');
    }

    public function test_duplicate_email_keeps_its_custom_portuguese_message(): void
    {
        User::factory()->create(['email' => 'maria@fazenda.com']);

        $this->postJson('/api/auth/register', ['name' => 'Maria', 'email' => 'maria@fazenda.com', 'password' => 'Segura123'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Este e-mail já está cadastrado.');
    }

    public function test_filter_errors_on_the_users_listing_are_translated(): void
    {
        $admin = User::factory()->admin()->create();
        $token = app(JwtService::class)->issue($admin)['token'];

        $this->withToken($token)->getJson('/api/users?per_page=1000')
            ->assertUnprocessable()
            ->assertJsonPath('errors.per_page.0', 'O campo itens por página não deve ser maior que 100.');
    }
}
