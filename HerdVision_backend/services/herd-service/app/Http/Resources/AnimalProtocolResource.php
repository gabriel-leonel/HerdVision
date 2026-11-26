<?php

namespace App\Http\Resources;

use App\Models\AnimalManagementProtocol;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AnimalManagementProtocol
 */
class AnimalProtocolResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'animal_id' => $this->animal_id,
            'management_protocol_id' => $this->management_protocol_id,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'status' => $this->status,
            'animal' => $this->whenLoaded('animal', fn () => $this->animal ? [
                'id' => $this->animal->id,
                'identification' => $this->animal->identification,
                'name' => $this->animal->name,
            ] : null),
            'protocol' => $this->whenLoaded('managementProtocol', fn () => $this->managementProtocol ? [
                'id' => $this->managementProtocol->id,
                'name' => $this->managementProtocol->name,
                'type' => $this->managementProtocol->type,
                'active' => $this->managementProtocol->active,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
