<?php

namespace App\Services;

use App\Exceptions\InvalidTokenException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;
use stdClass;
use Throwable;

/**
 * Valida JWTs emitidos pelo auth-service. Somente verificação (chave pública).
 *
 * Limitação conhecida: a lista de tokens revogados (logout) vive no
 * auth-service. Aqui só são checados assinatura, expiração e emissor, então um
 * token revogado continua aceito até expirar (o TTL do token é curto).
 */
class JwtVerifier
{
    /**
     * @throws InvalidTokenException token inválido, expirado ou de outro emissor
     * @throws RuntimeException chave pública ausente (erro de configuração)
     */
    public function verify(string $token): stdClass
    {
        // Fora do try: chave ausente é erro de CONFIGURAÇÃO (500), não "token
        // inválido" (401). Senão todo mundo levaria 401 em silêncio.
        $publicKey = $this->publicKey();

        $previousLeeway = JWT::$leeway;
        JWT::$leeway = (int) config('jwt.leeway');

        try {
            // Algoritmo fixado no Key: o "alg" do header NÃO é confiável
            // (evita alg=none e confusão RS256/HS256).
            $claims = JWT::decode($token, new Key($publicKey, config('jwt.algo')));
        } catch (Throwable $e) {
            throw new InvalidTokenException('Token inválido ou expirado.', previous: $e);
        } finally {
            JWT::$leeway = $previousLeeway;
        }

        if (($claims->iss ?? null) !== config('jwt.issuer')) {
            throw new InvalidTokenException('Emissor do token não reconhecido.');
        }

        if (empty($claims->sub)) {
            throw new InvalidTokenException('Token malformado.');
        }

        return $claims;
    }

    private function publicKey(): string
    {
        $inline = config('jwt.public_key');

        if (is_string($inline) && $inline !== '') {
            return str_replace('\n', "\n", $inline);
        }

        $path = config('jwt.public_key_path');

        // Caminho relativo é resolvido a partir da raiz do projeto.
        if (is_string($path) && ! str_starts_with($path, '/') && ! preg_match('#^[A-Za-z]:[\\\\/]#', $path)) {
            $path = base_path($path);
        }

        if (! is_string($path) || ! is_file($path)) {
            throw new RuntimeException(
                'Chave pública JWT não encontrada. Copie storage/jwt/public.pem do auth-service '
                .'ou defina JWT_PUBLIC_KEY (veja o README).'
            );
        }

        return (string) file_get_contents($path);
    }
}
