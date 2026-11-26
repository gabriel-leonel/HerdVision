<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** @var array{private: string, public: string}|null */
    private static ?array $keys = null;

    protected function setUp(): void
    {
        parent::setUp();

        // Par RSA efêmero (gerado uma única vez por execução) injetado direto
        // na config: os testes não dependem de arquivos em storage/jwt.
        self::$keys ??= $this->generateKeyPair();

        config([
            'jwt.private_key' => self::$keys['private'],
            'jwt.public_key' => self::$keys['public'],
            'jwt.issuer' => 'http://localhost',
            'jwt.ttl' => 60,
        ]);
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
