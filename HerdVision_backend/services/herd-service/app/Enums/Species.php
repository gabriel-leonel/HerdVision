<?php

namespace App\Enums;

/**
 * Espécies aceitas. Espelha SPECIES de HerdVision_frontend/src/lib/semantics.ts.
 */
enum Species: string
{
    case Bovine = 'Bovino';
    case Buffalo = 'Bubalino';
    case Sheep = 'Ovino';
    case Goat = 'Caprino';
    case Equine = 'Equino';
}
