<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsTest extends TestCase
{
    public function test_preflight_from_the_frontend_origin_is_allowed(): void
    {
        $this->call('OPTIONS', '/api/_test/protected', server: [
            'HTTP_ORIGIN' => 'http://localhost:5173',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type,authorization',
        ])
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_unknown_origin_is_never_allowed(): void
    {
        $evil = 'https://site-malicioso.example';

        $response = $this->call('OPTIONS', '/api/_test/protected', server: [
            'HTTP_ORIGIN' => $evil,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        // Com uma única origem permitida o servidor responde com ela própria; o
        // navegador bloqueia por divergir da origem da página. O que NÃO pode
        // acontecer é devolver a origem do atacante ou liberar tudo com "*".
        $allowedOrigin = $response->headers->get('Access-Control-Allow-Origin');

        $this->assertNotSame($evil, $allowedOrigin);
        $this->assertNotSame('*', $allowedOrigin);
    }

    public function test_actual_response_carries_the_cors_header(): void
    {
        $this->postJson('/api/_test/protected', ['email' => 'x@y.com', 'password' => 'errada'], [
            'Origin' => 'http://localhost:5173',
        ])->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_allowed_origins_come_from_configuration(): void
    {
        config(['cors.allowed_origins' => ['https://app.herdvision.example']]);

        $this->call('OPTIONS', '/api/_test/protected', server: [
            'HTTP_ORIGIN' => 'https://app.herdvision.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ])->assertHeader('Access-Control-Allow-Origin', 'https://app.herdvision.example');
    }

    public function test_vercel_preview_origins_are_allowed_by_pattern(): void
    {
        config(['cors.allowed_origins' => ['https://herdvision-frontend.vercel.app']]);
        config(['cors.allowed_origins_patterns' => ['#^https://herdvision-frontend-[a-z0-9-]+-catateras-projects\\.vercel\\.app$#']]);

        $preview = 'https://herdvision-frontend-diwxb0r59-catateras-projects.vercel.app';

        $this->call('OPTIONS', '/api/_test/protected', server: [
            'HTTP_ORIGIN' => $preview,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ])->assertHeader('Access-Control-Allow-Origin', $preview);
    }

    public function test_pattern_does_not_allow_lookalike_domains(): void
    {
        config(['cors.allowed_origins' => ['https://herdvision-frontend.vercel.app']]);
        config(['cors.allowed_origins_patterns' => ['#^https://herdvision-frontend-[a-z0-9-]+-catateras-projects\\.vercel\\.app$#']]);

        $evil = 'https://herdvision-frontend-x-catateras-projects.vercel.app.evil.example';

        $allowed = $this->call('OPTIONS', '/api/_test/protected', server: [
            'HTTP_ORIGIN' => $evil,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ])->headers->get('Access-Control-Allow-Origin');

        $this->assertNotSame($evil, $allowed);
    }
}
