<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * O Herd Service não respondeu (rede, timeout ou erro inesperado). A leitura
 * não é gravada e a API responde 503.
 */
class HerdUnavailableException extends RuntimeException
{
    //
}
