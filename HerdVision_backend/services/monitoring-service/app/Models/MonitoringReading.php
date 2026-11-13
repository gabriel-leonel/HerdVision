<?php

namespace App\Models;

use Database\Factories\MonitoringReadingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['animal_id', 'temperature', 'activity_level', 'feeding_level', 'recorded_at'])]
class MonitoringReading extends Model
{
    /** @use HasFactory<MonitoringReadingFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:2',
            'recorded_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<Alert, $this>
     */
    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }
}
