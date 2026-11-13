<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create(['email' => 'joao@fazenda.com', 'password' => 'Segura123']);

        $this->postJson('/api/auth/login', ['email' => 'JOAO@fazenda.com', 'password' => 'Segura123'])
            ->assertOk()
            ->assertJsonPath('user.email', 'joao@fazenda.com')
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in']);
    }

    public function test_wrong_password_and_unknown_email_get_the_same_generic_error(): void
    {
        User::factory()->create(['email' => 'joao@fazenda.com', 'password' => 'Segura123']);

        $wrongPassword = $this->postJson('/api/auth/login', ['email' => 'joao@fazenda.com', 'password' => 'errada']);
        $unknownEmail = $this->postJson('/api/auth/login', ['email' => 'ninguem@fazenda.com', 'password' => 'Segura123']);

        $wrongPassword->assertUnauthorized();
        $unknownEmail->assertUnauthorized();
        $this->assertSame($wrongPassword->json(), $unknownEmail->json());
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'x@y.com', 'password' => 'errada'])->assertUnauthorized();
        }

        $this->postJson('/api/auth/login', ['email' => 'x@y.com', 'password' => 'errada'])->assertStatus(429);
    }
}
