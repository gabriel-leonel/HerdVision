<?php

namespace App\Enums;

/**
 * Status da aplicação de um protocolo a um animal. Espelha
 * ASSOCIATION_STATUSES de HerdVision_frontend/src/lib/semantics.ts.
 */
enum AssociationStatus: string
{
    case InProgress = 'em andamento';
    case Completed = 'concluído';
}
