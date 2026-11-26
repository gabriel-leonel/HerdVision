<?php

namespace App\Enums;

/**
 * Tipos de alerta. Espelha alertTypeLabel de
 * HerdVision_frontend/src/lib/semantics.ts.
 */
enum AlertType: string
{
    case Temperature = 'temperatura';
    case Activity = 'atividade';
    case Feeding = 'alimentação';
}
