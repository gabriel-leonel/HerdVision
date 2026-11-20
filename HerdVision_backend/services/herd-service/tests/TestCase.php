<?php

namespace Tests;

use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

abstract class TestCase extends BaseTestCase
{
    /** @var array{private: string, public: string}|null */
    private static ?array $keys = null;

    protected function setUp(): void
    {
        parent::setUp();

        // Par RSA efêmero: faz o papel do auth-service (assina) e do herd (valida).
        self::$keys ??= $this->generateKeyPair();

        config([
            'jwt.public_key' => self::$keys['public'],
            'jwt.issuer' => 'http://auth.test',
        ]);

        // Rotas de teste para exercitar os middlewares sem depender de endpoints reais.
        Route::middleware('jwt')->get('/api/_test/protected', fn (Request $r) => [
            'id' => $r->user()->id,
            'role' => $r->user()->role,
        ]);
        Route::middleware(['jwt', 'role:admin'])->get('/api/_test/admin', fn () => ['ok' => true]);
    }

    /**
     * Gera um token como o auth-service faria.
     *
     * @param  array<string, mixed>  $overrides  claims que substituem (ou, com null, removem) os padrão
     */
    protected function tokenFor(array $overrides = [], ?string $privateKey = null, string $algo = 'RS256'): string
    {
        $claims = array_merge([
            'iss' => 'http://auth.test',
            'sub' => '42',
            'role' => 'user',
            'name' => 'Maria',
            'email' => 'maria@fazenda.com',
            'iat' => time(),
            'nbf' => time(),
            'exp' => time() + 3600,
            'jti' => 'abc-123',
        ], $overrides);

        $claims = array_filter($claims, fn ($v) => $v !== null);

        return JWT::encode($claims, $privateKey ?? self::$keys['private'], $algo);
    }

    protected function asAdmin(): static
    {
        return $this->withToken($this->tokenFor(['role' => 'admin']));
    }

    protected function asUser(): static
    {
        return $this->withToken($this->tokenFor(['role' => 'user']));
    }

    protected function publicKey(): string
    {
        return self::$keys['public'];
    }

    /**
     * @return array{private: string, public: string}
     */
    protected function generateKeyPair(): array
    {
        $resource = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($resource, $private);

        return ['private' => $private, 'public' => openssl_pkey_get_details($resource)['key']];
    }
}
