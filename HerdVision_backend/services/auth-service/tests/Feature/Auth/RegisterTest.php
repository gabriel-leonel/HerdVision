<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    private array $valid = [
        'name' => 'Maria Produtora',
        'email' => 'maria@fazenda.com',
        'password' => 'Segura123',
    ];

    public function test_a_user_can_register_and_receives_a_jwt(): void
    {
        $response = $this->postJson('/api/auth/register', $this->valid);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'maria@fazenda.com')
            ->assertJsonPath('user.role', 'user')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonMissingPath('user.password');

        // JWT = 3 segmentos separados por ponto.
        $this->assertCount(3, explode('.', $response->json('access_token')));
        $this->assertDatabaseHas('users', ['email' => 'maria@fazenda.com']);
    }

    public function test_password_is_stored_hashed(): void
    {
        $this->postJson('/api/auth/register', $this->valid)->assertCreated();

        $stored = User::where('email', 'maria@fazenda.com')->value('password');

        $this->assertNotSame('Segura123', $stored);
        $this->assertTrue(password_verify('Segura123', $stored));
    }

    public function test_registration_cannot_escalate_privileges_via_role(): void
    {
        $this->postJson('/api/auth/register', $this->valid + ['role' => 'admin'])
            ->assertCreated()
            ->assertJsonPath('user.role', 'user');

        $this->assertSame(Role::User, User::first()->role);
    }

    public function test_duplicate_email_is_rejected_case_insensitively(): void
    {
        User::factory()->create(['email' => 'maria@fazenda.com']);

        $this->postJson('/api/auth/register', ['email' => 'MARIA@fazenda.com'] + $this->valid)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_invalid_payload_is_rejected(): void
    {
        $this->postJson('/api/auth/register', ['name' => '', 'email' => 'nao-e-email', 'password' => '123'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }
}
