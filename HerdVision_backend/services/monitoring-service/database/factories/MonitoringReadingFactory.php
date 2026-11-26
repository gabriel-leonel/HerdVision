<?php

namespace Database\Factories;

use App\Models\MonitoringReading;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MonitoringReading>
 */
class MonitoringReadingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'animal_id' => fake()->numberBetween(1, 500),
            'temperature' => fake()->randomFloat(2, 37.5, 40.5),
            'activity_level' => fake()->numberBetween(20, 100),
            'feeding_level' => fake()->numberBetween(20, 100),
            'recorded_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ];
    }
}
