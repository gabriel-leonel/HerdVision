<?php

namespace App\Models;

use Database\Factories\ManagementProtocolFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    /**
     * Linhas da tabela associativa (cada aplicação do protocolo).
     *
     * @return HasMany<AnimalManagementProtocol, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(AnimalManagementProtocol::class);
    }

    /**
     * Adiciona `animals_count`: animais DISTINTOS com o protocolo aplicado
     * (o mesmo animal pode ter recebido o protocolo mais de uma vez).
     *
     * @param  Builder<ManagementProtocol>  $query
     */
    public function scopeWithAnimalsCount(Builder $query): void
    {
        $query->addSelect([
            'animals_count' => AnimalManagementProtocol::query()
                ->selectRaw('count(distinct animal_id)')
                ->whereColumn('management_protocol_id', 'management_protocols.id'),
        ]);
    }

    public function distinctAnimalsCount(): int
    {
        return $this->applications()->distinct()->count('animal_id');
    }
}
