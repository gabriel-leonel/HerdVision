<?php

namespace App\Enums;

/**
 * Fluxo de tratamento de alertas (RN01):
 *
 *   Pendente -> Em análise -> Resolvido
 *
 * Só se avança uma etapa por vez. Voltar, pular ou repetir é inválido. A
 * única volta permitida é a reabertura explícita (Resolvido -> Pendente),
 * que é uma ação separada (POST /api/alerts/{id}/reopen).
 */
enum AlertStatus: string
{
    case Pending = 'Pendente';
    case InReview = 'Em análise';
    case Resolved = 'Resolvido';

    /**
     * Próxima etapa do fluxo; null quando o alerta já está resolvido.
     */
    public function next(): ?self
    {
        return match ($this) {
            self::Pending => self::InReview,
            self::InReview => self::Resolved,
            self::Resolved => null,
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return $this->next() === $to;
    }

    public function canReopen(): bool
    {
        return $this === self::Resolved;
    }
}
