<?php

namespace Tests\Unit;

use App\Exceptions\InvalidTokenException;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JwtServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_issued_token_carries_the_expected_claims(): void
    {
        $user = User::factory()->admin()->create();
        $service = app(JwtService::class);

        $issued = $service->issue($user);
        $claims = $service->decode($issued['token']);

        $this->assertSame((string) $user->id, $claims->sub);
        $this->assertSame('admin', $claims->role);
        $this->assertSame('http://localhost', $claims->iss);
        $this->assertSame(3600, $issued['expires_in']);
        $this->assertNotEmpty($claims->jti);
    }

    public function test_garbage_token_throws_a_domain_exception(): void
    {
        $this->expectException(InvalidTokenException::class);

        app(JwtService::class)->decode('isto.nao.eh-um-jwt');
    }

    public function test_token_from_a_different_issuer_is_rejected(): void
    {
        $token = app(JwtService::class)->issue(User::factory()->create())['token'];

        config(['jwt.issuer' => 'http://outro-servico']);

        $this->expectException(InvalidTokenException::class);
        app(JwtService::class)->decode($token);
    }

    public function test_missing_public_key_is_a_configuration_error_not_an_invalid_token(): void
    {
        $token = app(JwtService::class)->issue(User::factory()->create())['token'];

        config(['jwt.public_key' => null, 'jwt.public_key_path' => '/caminho/inexistente.pem']);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/jwt:generate-keys/');

        app(JwtService::class)->decode($token);
    }
}
