<?php

namespace App\Services;

use App\Enums\AlertStatus;
use App\Models\Alert;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * RN01 — fluxo de tratamento de alertas. Único ponto que altera o status de
 * um alerta; cada mudança grava uma linha em alert_status_changes na mesma
 * transação.
 */
class AlertWorkflow
{
    /**
     * Cria um alerta "Pendente" e registra a criação no histórico (sem usuário).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function open(array $attributes): Alert
    {
        return DB::transaction(function () use ($attributes) {
            $alert = Alert::create($attributes);

            $alert->history()->create([
                'from_status' => null,
                'to_status' => AlertStatus::Pending,
            ]);

            return $alert;
        });
    }

    /**
     * Avança para a próxima etapa (Pendente -> Em análise -> Resolvido).
     *
     * @throws ValidationException transição fora da ordem (422)
     */
    public function transition(Alert $alert, AlertStatus $to, ?Authenticatable $user): Alert
    {
        return $this->change($alert, $to, $user, function (AlertStatus $from) use ($to) {
            if (! $from->canTransitionTo($to)) {
                throw ValidationException::withMessages([
                    'status' => "Transição de status inválida: de \"{$from->value}\" para \"{$to->value}\".",
                ]);
            }
        });
    }

    /**
     * Reabertura explícita (RN01, regra 4): só de Resolvido para Pendente.
     *
     * @throws ValidationException alerta não resolvido (422)
     */
    public function reopen(Alert $alert, ?Authenticatable $user): Alert
    {
        return $this->change($alert, AlertStatus::Pending, $user, function (AlertStatus $from) {
            if (! $from->canReopen()) {
                throw ValidationException::withMessages([
                    'status' => "Apenas alertas resolvidos podem ser reabertos (status atual: \"{$from->value}\").",
                ]);
            }
        });
    }

    /**
     * @param  callable(AlertStatus): void  $guard
     */
    private function change(Alert $alert, AlertStatus $to, ?Authenticatable $user, callable $guard): Alert
    {
        return DB::transaction(function () use ($alert, $to, $user, $guard) {
            // Relê o status dentro da transação: duas requisições simultâneas
            // não podem aplicar a mesma transição duas vezes.
            $current = Alert::query()->lockForUpdate()->findOrFail($alert->id);
            $from = $current->status;

            $guard($from);

            $current->status = $to;
            $current->save();

            $current->history()->create([
                'from_status' => $from,
                'to_status' => $to,
                'user_id' => is_numeric($user?->getAuthIdentifier()) ? (int) $user->getAuthIdentifier() : null,
                'user_name' => $user?->name,
            ]);

            return $current;
        });
    }
}
