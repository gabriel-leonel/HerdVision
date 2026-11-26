<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Tabela associativa animal <-> protocolo de manejo, com id próprio.
 */
class AnimalManagementProtocol extends Pivot
{
    protected $table = 'animal_management_protocol';

    public $incrementing = true;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Animal, $this>
     */
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    /**
     * @return BelongsTo<ManagementProtocol, $this>
     */
    public function managementProtocol(): BelongsTo
    {
        return $this->belongsTo(ManagementProtocol::class);
    }
}
