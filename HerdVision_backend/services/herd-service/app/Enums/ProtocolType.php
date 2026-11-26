<?php

namespace App\Enums;

/**
 * Tipos de protocolo de manejo. Espelha PROTOCOL_TYPES de
 * HerdVision_frontend/src/lib/semantics.ts.
 */
enum ProtocolType: string
{
    case Sanitary = 'sanitário';
    case Nutritional = 'nutricional';
    case Reproductive = 'reprodutivo';
}
