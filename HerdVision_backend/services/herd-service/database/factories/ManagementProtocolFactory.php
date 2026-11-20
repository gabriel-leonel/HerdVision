<?php

namespace Database\Factories;

use App\Models\ManagementProtocol;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ManagementProtocol>
 */
class ManagementProtocolFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Vacinação contra aftosa', 'Vermifugação', 'Suplementação mineral', 'Quarentena']).' '.fake()->unique()->numerify('##'),
            'description' => fake()->optional()->sentence(),
            'type' => fake()->randomElement(['sanitário', 'nutricional', 'reprodutivo']),
            'active' => true,
        ];
    }
}
