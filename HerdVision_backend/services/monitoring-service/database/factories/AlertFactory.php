<?php

namespace Database\Factories;

use App\Models\Alert;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Alert>
 */
class AlertFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'animal_id' => fake()->numberBetween(1, 500),
            'monitoring_reading_id' => null,
            'type' => fake()->randomElement(['temperatura', 'atividade', 'alimentação']),
            'description' => fake()->sentence(),
            'severity' => fake()->randomElement(['baixa', 'média', 'alta']),
        ];
    }
}
