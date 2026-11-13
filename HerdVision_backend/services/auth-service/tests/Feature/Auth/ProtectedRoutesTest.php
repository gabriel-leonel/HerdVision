<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\JwtService;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProtectedRoutesTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        return app(JwtService::class)->issue($user)['token'];
    }

    public function test_me_requires_a_token(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_me_returns_the_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->withToken($this->tokenFor($user))
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_tampered_token_is_rejected(): void
    {
        $token = $this->tokenFor(User::factory()->create());
        [$header, $payload, $signature] = explode('.', $token);

        // Troca o payload mantendo a assinatura original.
        $forged = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        $forged['role'] = 'admin';
        $forgedPayload = rtrim(strtr(base64_encode(json_encode($forged)), '+/', '-_'), '=');

        $this->withToken("{$header}.{$forgedPayload}.{$signature}")
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_token_signed_with_another_key_is_rejected(): void
    {
        $user = User::factory()->create();
        $attackerKey = $this->generateKeyPair()['private'];

        $token = JWT::encode([
            'iss' => 'http://localhost', 'sub' => (string) $user->id, 'jti' => 'x',
            'iat' => time(), 'exp' => time() + 600,
        ], $attackerKey, 'RS256');

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_expired_token_is_rejected(): void
    {
        $user = User::factory()->create();
        config(['jwt.ttl' => -10]); // já nasce vencido (além do leeway de 10s)

        $this->withToken($this->tokenFor($user))
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_token_of_a_deleted_user_is_rejected(): void
    {
        $user = User::factory()->create();
        $token = $this->tokenFor($user);
        $user->delete();

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_revokes_the_token(): void
    {
        $token = $this->tokenFor(User::factory()->create());

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
    }
}
