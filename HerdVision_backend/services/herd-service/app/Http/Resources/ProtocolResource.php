<?php

namespace App\Http\Resources;

use App\Models\ManagementProtocol;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ManagementProtocol
 */
class ProtocolResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'active' => $this->active,
            // Animais distintos com o protocolo aplicado (ManagementProtocol::scopeWithAnimalsCount).
            'animals_count' => $this->whenHas('animals_count', fn () => (int) $this->animals_count),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
