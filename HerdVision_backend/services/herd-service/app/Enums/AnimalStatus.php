<?php

namespace App\Enums;

/**
 * Situação cadastral do animal. Espelha ANIMAL_STATUSES de
 * HerdVision_frontend/src/lib/semantics.ts.
 */
enum AnimalStatus: string
{
    case Active = 'ativo';
    case UnderTreatment = 'em tratamento';
    case Inactive = 'inativo';
}
