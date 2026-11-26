<?php

namespace App\Enums;

/**
 * Gravidade do alerta. Espelha SEVERITY de HerdVision_frontend/src/lib/semantics.ts.
 */
enum AlertSeverity: string
{
    case High = 'alta';
    case Medium = 'média';
    case Low = 'baixa';
}
