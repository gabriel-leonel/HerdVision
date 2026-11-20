<?php

namespace App\Models;

use Database\Factories\AnimalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['identification', 'name', 'species', 'breed', 'birth_date', 'status', 'lot_id'])]
class Animal extends Model
{
    /** @use HasFactory<AnimalFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Lot, $this>
     */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    /**
     * Protocolos aplicados ao animal (N:N). Um mesmo protocolo pode aparecer
     * mais de uma vez, com datas diferentes.
     *
     * @return BelongsToMany<ManagementProtocol, $this, AnimalManagementProtocol>
     */
    public function protocols(): BelongsToMany
    {
        return $this->belongsToMany(ManagementProtocol::class, 'animal_management_protocol')
            ->using(AnimalManagementProtocol::class)
            ->withPivot(['id', 'start_date', 'status'])
            ->withTimestamps();
    }

    /**
     * Linhas da tabela associativa (histórico de aplicações).
     *
     * @return HasMany<AnimalManagementProtocol, $this>
     */
    public function protocolApplications(): HasMany
    {
        return $this->hasMany(AnimalManagementProtocol::class);
    }
}
