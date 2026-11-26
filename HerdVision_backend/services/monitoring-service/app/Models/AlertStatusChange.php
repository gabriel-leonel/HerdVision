<?php

namespace App\Models;

use App\Enums\AlertStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Uma linha por mudança de status do alerta (inclusive a criação: null -> Pendente).
 */
#[Fillable(['alert_id', 'from_status', 'to_status', 'user_id', 'user_name'])]
class AlertStatusChange extends Model
{
    // Registro imutável: só tem created_at.
    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'from_status' => AlertStatus::class,
            'to_status' => AlertStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Alert, $this>
     */
    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }
}
