<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function asUser(User $user): static
    {
        return $this->withToken(app(JwtService::class)->issue($user)['token']);
    }

    public function test_regular_user_cannot_list_users(): void
    {
        $this->asUser(User::factory()->create())
            ->getJson('/api/users')
            ->assertForbidden();
    }

    public function test_guest_cannot_list_users(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_admin_can_list_users_with_pagination(): void
    {
        User::factory()->count(5)->create();

        $this->asUser(User::factory()->admin()->create())
            ->getJson('/api/users?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 6)
            ->assertJsonPath('meta.per_page', 2);
    }

    public function test_admin_can_search_and_filter_by_role(): void
    {
        User::factory()->create(['name' => 'Carlos Vaqueiro', 'email' => 'carlos@fazenda.com']);
        User::factory()->create(['name' => 'Ana Veterinária', 'email' => 'ana@fazenda.com']);
        $admin = User::factory()->admin()->create(['name' => 'Chefe', 'email' => 'chefe@fazenda.com']);

        $this->asUser($admin)->getJson('/api/users?search=carlos')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.email', 'carlos@fazenda.com');

        $this->asUser($admin)->getJson('/api/users?role=admin')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.role', 'admin');
    }

    public function test_role_is_read_from_the_database_not_from_the_token(): void
    {
        $user = User::factory()->admin()->create();
        $token = app(JwtService::class)->issue($user)['token']; // claim role=admin

        $user->forceFill(['role' => 'user'])->save(); // rebaixado depois da emissão

        $this->withToken($token)->getJson('/api/users')->assertForbidden();
    }
}
