<?php

namespace App\Models;

use App\Enums\AlertStatus;
use Database\Factories\AlertFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// `status` fora do $fillable: o status só muda pelo fluxo de tratamento
// (transições validadas no backend, previstas para as próximas etapas).
#[Fillable(['animal_id', 'monitoring_reading_id', 'type', 'description', 'severity'])]
class Alert extends Model
{
    /** @use HasFactory<AlertFactory> */
    use HasFactory;

    /**
     * Todo alerta nasce "Pendente".
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'Pendente',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AlertStatus::class,
        ];
    }

    /**
     * @return BelongsTo<MonitoringReading, $this>
     */
    public function reading(): BelongsTo
    {
        return $this->belongsTo(MonitoringReading::class, 'monitoring_reading_id');
    }
}
