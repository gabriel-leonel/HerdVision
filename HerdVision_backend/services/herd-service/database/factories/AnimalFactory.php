<?php

namespace Database\Factories;

use App\Models\Animal;
use App\Models\Lot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Animal>
 */
class AnimalFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'identification' => fake()->unique()->numerify('BR########'),
            'name' => fake()->optional()->firstName(),
            'species' => 'Bovino',
            'breed' => fake()->optional()->randomElement(['Nelore', 'Angus', 'Holandês', 'Girolando']),
            'birth_date' => fake()->optional()->dateTimeBetween('-8 years', '-6 months'),
            'status' => 'ativo',
            'lot_id' => Lot::factory(),
        ];
    }
}
