<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class JwtAuthenticationTest extends TestCase
{
    private function b64(string $json): string
    {
        return rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
    }

    public function test_request_without_token_is_rejected(): void
    {
        $this->getJson('/api/_test/protected')
            ->assertUnauthorized()
            ->assertHeader('WWW-Authenticate', 'Bearer');
    }

    public function test_valid_token_authenticates_and_exposes_claims(): void
    {
        $this->withToken($this->tokenFor(['sub' => '42', 'role' => 'admin']))
            ->getJson('/api/_test/protected')
            ->assertOk()
            ->assertJson(['id' => '42', 'role' => 'admin']);
    }

    public function test_tampered_payload_is_rejected(): void
    {
        [$header, $payload, $signature] = explode('.', $this->tokenFor(['role' => 'user']));

        $forged = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        $forged['role'] = 'admin';

        $this->withToken("{$header}.{$this->b64(json_encode($forged))}.{$signature}")
            ->getJson('/api/_test/admin')
            ->assertUnauthorized();
    }

    public function test_token_signed_with_another_key_is_rejected(): void
    {
        $attacker = $this->generateKeyPair()['private'];

        $this->withToken($this->tokenFor(privateKey: $attacker))
            ->getJson('/api/_test/protected')
            ->assertUnauthorized();
    }

    public function test_algorithm_confusion_attack_is_rejected(): void
    {
        // Ataque clássico: assinar com HS256 usando a chave PÚBLICA como segredo.
        $token = $this->tokenFor(['role' => 'admin'], $this->publicKey(), 'HS256');

        $this->withToken($token)->getJson('/api/_test/admin')->assertUnauthorized();
    }

    public function test_unsigned_alg_none_token_is_rejected(): void
    {
        $token = $this->b64('{"alg":"none","typ":"JWT"}').'.'
            .$this->b64(json_encode(['iss' => 'http://auth.test', 'sub' => '1', 'role' => 'admin', 'exp' => time() + 3600])).'.';

        $this->withToken($token)->getJson('/api/_test/admin')->assertUnauthorized();
    }

    public function test_expired_token_is_rejected(): void
    {
        $this->withToken($this->tokenFor(['exp' => time() - 100]))
            ->getJson('/api/_test/protected')
            ->assertUnauthorized();
    }

    public function test_token_not_valid_yet_is_rejected(): void
    {
        $this->withToken($this->tokenFor(['nbf' => time() + 1000]))
            ->getJson('/api/_test/protected')
            ->assertUnauthorized();
    }

    public function test_token_from_another_issuer_is_rejected(): void
    {
        $this->withToken($this->tokenFor(['iss' => 'http://outro-emissor']))
            ->getJson('/api/_test/protected')
            ->assertUnauthorized();
    }

    public function test_token_without_subject_is_rejected(): void
    {
        $this->withToken($this->tokenFor(['sub' => null]))
            ->getJson('/api/_test/protected')
            ->assertUnauthorized();
    }

    public function test_garbage_token_is_rejected(): void
    {
        $this->withToken('isto.nao.eh-um-jwt')->getJson('/api/_test/protected')->assertUnauthorized();
    }

    public function test_missing_public_key_is_a_server_error_not_a_401(): void
    {
        config(['jwt.public_key' => null, 'jwt.public_key_path' => '/caminho/inexistente.pem']);

        $this->withToken($this->tokenFor())
            ->getJson('/api/_test/protected')
            ->assertStatus(500);
    }

    public function test_public_key_can_be_loaded_from_a_file_with_relative_path(): void
    {
        $relative = 'storage/framework/testing/public-test.pem';
        @mkdir(dirname(base_path($relative)), 0777, true);
        file_put_contents(base_path($relative), $this->publicKey());

        config(['jwt.public_key' => null, 'jwt.public_key_path' => $relative]);

        try {
            $this->withToken($this->tokenFor())->getJson('/api/_test/protected')->assertOk();
        } finally {
            @unlink(base_path($relative));
        }
    }

    public function test_public_key_can_be_given_inline_with_escaped_newlines(): void
    {
        config(['jwt.public_key' => str_replace("\n", '\n', trim($this->publicKey()))]);

        $this->withToken($this->tokenFor())->getJson('/api/_test/protected')->assertOk();
    }
}
