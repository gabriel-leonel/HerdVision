<?php

namespace Tests\Feature\Database;

use App\Models\Animal;
use App\Models\AnimalManagementProtocol;
use App\Models\Lot;
use App\Models\ManagementProtocol;
use Database\Seeders\DemoHerdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoHerdSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_the_demo_herd_with_fixed_ids(): void
    {
        $this->seed(DemoHerdSeeder::class);

        $this->assertSame(3, Lot::count());
        // O seed do monitoring-service depende dos animais 1 a 12.
        $this->assertSame(range(1, 12), Animal::orderBy('id')->pluck('id')->all());
        $this->assertSame(5, ManagementProtocol::count());
        $this->assertSame(1, ManagementProtocol::where('active', false)->count());
        $this->assertSame(10, AnimalManagementProtocol::count());
    }

    public function test_is_idempotent(): void
    {
        $this->seed(DemoHerdSeeder::class);
        $this->seed(DemoHerdSeeder::class);

        $this->assertSame(12, Animal::count());
    }

    public function test_seeded_data_is_valid_through_the_api(): void
    {
        $this->seed(DemoHerdSeeder::class);

        $this->asUser()->getJson('/api/animals?per_page=100')->assertOk()->assertJsonPath('meta.total', 12);
        $this->asUser()->getJson('/api/protocols/1')->assertOk()->assertJsonPath('data.animals_count', 3);
        $this->asAdmin()->deleteJson('/api/protocols/1')->assertStatus(409);
    }
}
