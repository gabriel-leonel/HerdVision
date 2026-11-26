<?php

namespace App\Enums;

/**
 * Fluxo previsto: Pendente -> Em análise -> Resolvido.
 * As regras de transição serão implementadas nas próximas etapas.
 */
enum AlertStatus: string
{
    case Pending = 'Pendente';
    case InReview = 'Em análise';
    case Resolved = 'Resolvido';
}
