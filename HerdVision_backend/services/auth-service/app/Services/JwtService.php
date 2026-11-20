<?php

namespace App\Services;

use App\Exceptions\InvalidTokenException;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;
use stdClass;
use Throwable;

class JwtService
{
    /**
     * Emite um JWT assinado (RS256) para o usuário.
     *
     * @return array{token: string, expires_in: int, expires_at: int}
     */
    public function issue(User $user): array
    {
        $now = time();
        $ttl = (int) config('jwt.ttl') * 60;

        $payload = [
            'iss' => config('jwt.issuer'),
            'sub' => (string) $user->getKey(),
            'role' => $user->role->value,
            'name' => $user->name,
            'email' => $user->email,
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttl,
            'jti' => (string) Str::uuid(),
        ];

        return [
            'token' => JWT::encode($payload, $this->key('private'), config('jwt.algo')),
            'expires_in' => $ttl,
            'expires_at' => $payload['exp'],
        ];
    }

    /**
     * Valida assinatura, expiração, emissor e revogação; devolve os claims.
     *
     * @throws InvalidTokenException
     */
    public function decode(string $token): stdClass
    {
        // Lida fora do try: chave ausente é erro de CONFIGURAÇÃO (500 com log),
        // não "token inválido" (401). Senão todo login falharia em silêncio.
        $publicKey = $this->key('public');

        $previousLeeway = JWT::$leeway;
        JWT::$leeway = (int) config('jwt.leeway');

        try {
            // O algoritmo é fixado no Key: o "alg" do header do token NÃO é
            // confiável (evita ataques de confusão de algoritmo / alg=none).
            $claims = JWT::decode($token, new Key($publicKey, config('jwt.algo')));
        } catch (Throwable $e) {
            throw new InvalidTokenException('Token inválido ou expirado.', previous: $e);
        } finally {
            JWT::$leeway = $previousLeeway;
        }

        if (($claims->iss ?? null) !== config('jwt.issuer')) {
            throw new InvalidTokenException('Emissor do token não reconhecido.');
        }

        if (empty($claims->sub) || empty($claims->jti)) {
            throw new InvalidTokenException('Token malformado.');
        }

        if ($this->isRevoked($claims->jti)) {
            throw new InvalidTokenException('Token revogado.');
        }

        return $claims;
    }

    /**
     * Revoga um token até o seu vencimento natural (logout).
     *
     * Obs.: a lista de revogação vive no cache do auth-service. Os demais
     * microsserviços validam só a assinatura/expiração, então um token
     * revogado continua aceito por eles até expirar; por isso o TTL é curto.
     */
    public function revoke(stdClass $claims): void
    {
        $secondsLeft = max(((int) $claims->exp) - time(), 1);

        Cache::put($this->revokedKey($claims->jti), true, $secondsLeft);
    }

    public function isRevoked(string $jti): bool
    {
        return Cache::has($this->revokedKey($jti));
    }

    private function revokedKey(string $jti): string
    {
        return "jwt:revoked:{$jti}";
    }

    /**
     * Resolve a chave PEM: conteúdo direto na env tem precedência sobre arquivo.
     */
    private function key(string $type): string
    {
        $inline = config("jwt.{$type}_key");

        if (is_string($inline) && $inline !== '') {
            return str_replace('\n', "\n", $inline);
        }

        $path = config("jwt.{$type}_key_path");

        // Caminho relativo (ex.: storage/jwt/private.pem) é resolvido a partir
        // da raiz do projeto, e não do diretório de execução do processo.
        if (is_string($path) && ! str_starts_with($path, '/') && ! preg_match('#^[A-Za-z]:[\\\\/]#', $path)) {
            $path = base_path($path);
        }

        if (! is_string($path) || ! is_file($path)) {
            throw new RuntimeException(
                "Chave JWT {$type} não encontrada. Execute: php artisan jwt:generate-keys"
            );
        }

        return (string) file_get_contents($path);
    }
}
