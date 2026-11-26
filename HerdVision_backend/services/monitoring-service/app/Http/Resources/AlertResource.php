<?php

namespace App\Http\Resources;

use App\Models\Alert;
use App\Models\AlertStatusChange;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Alert
 */
class AlertResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'animal_id' => $this->animal_id,
            'monitoring_reading_id' => $this->monitoring_reading_id,
            'type' => $this->type,
            'description' => $this->description,
            'severity' => $this->severity,
            'status' => $this->status->value,
            // Formato esperado pelo frontend (AlertHistoryEntry).
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn (AlertStatusChange $change) => [
                'from' => $change->from_status?->value,
                'to' => $change->to_status->value,
                'user_name' => $change->user_name,
                'changed_at' => $change->created_at?->toIso8601String(),
            ])->all()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
