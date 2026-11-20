<?php

namespace App\Models;

use Database\Factories\ManagementProtocolFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'description', 'type', 'active'])]
class ManagementProtocol extends Model
{
    /** @use HasFactory<ManagementProtocolFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    /**
     * @return BelongsToMany<Animal, $this, AnimalManagementProtocol>
     */
    public function animals(): BelongsToMany
    {
        return $this->belongsToMany(Animal::class, 'animal_management_protocol')
            ->using(AnimalManagementProtocol::class)
            ->withPivot(['id', 'start_date', 'status'])
            ->withTimestamps();
    }
}
