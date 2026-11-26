<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_one_user_per_role_with_hashed_password(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@herdvision.com')->firstOrFail();
        $user = User::where('email', 'user@herdvision.com')->firstOrFail();

        $this->assertSame(Role::Admin, $admin->role);
        $this->assertSame(Role::User, $user->role);
        $this->assertNotSame('Admin@1234', $admin->getRawOriginal('password'));
        $this->assertTrue(Hash::check('Admin@1234', $admin->password));
    }

    public function test_demo_users_can_log_in(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->postJson('/api/auth/login', ['email' => 'admin@herdvision.com', 'password' => 'Admin@1234'])
            ->assertOk()
            ->assertJsonPath('user.role', 'admin');

        $this->postJson('/api/auth/login', ['email' => 'user@herdvision.com', 'password' => 'User@1234'])
            ->assertOk()
            ->assertJsonPath('user.role', 'user');
    }

    public function test_is_idempotent_and_does_not_overwrite_existing_users(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@herdvision.com')->firstOrFail();
        $admin->forceFill(['password' => 'Changed@123'])->save();

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(2, User::count());
        $this->assertTrue(Hash::check('Changed@123', $admin->fresh()->password));
    }
}
