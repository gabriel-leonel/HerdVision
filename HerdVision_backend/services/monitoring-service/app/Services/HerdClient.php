<?php

namespace App\Services;

use App\Exceptions\HerdUnavailableException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Cliente HTTP do Herd Service. Os bancos são independentes (sem FK entre
 * serviços), então a existência do animal é confirmada pela API do herd,
 * repassando o Bearer do usuário da requisição original.
 */
class HerdClient
{
    /**
     * @throws HerdUnavailableException herd fora do ar, lento ou com resposta inesperada
     */
    public function animalExists(int $animalId, string $bearerToken): bool
    {
        try {
            $response = Http::baseUrl(config('monitoring.herd.url'))
                ->withToken($bearerToken)
                ->acceptJson()
                ->timeout(config('monitoring.herd.timeout'))
                ->get("/api/animals/{$animalId}");
        } catch (ConnectionException $e) {
            throw new HerdUnavailableException(previous: $e);
        }

        return match ($response->status()) {
            200 => true,
            404 => false,
            // 401/403/5xx: configuração divergente entre serviços ou herd com
            // erro. Não dá para afirmar que o animal não existe.
            default => throw new HerdUnavailableException("Herd Service respondeu {$response->status()}."),
        };
    }
}
