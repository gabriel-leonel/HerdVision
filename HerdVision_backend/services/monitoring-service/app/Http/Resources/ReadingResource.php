<?php

namespace App\Http\Resources;

use App\Models\MonitoringReading;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MonitoringReading
 */
class ReadingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'animal_id' => $this->animal_id,
            'temperature' => $this->temperature,
            'activity_level' => $this->activity_level,
            'feeding_level' => $this->feeding_level,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
