<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Documentação OpenAPI (Scramble) pública em /docs/api, inclusive em produção.
 */
class ApiDocsTest extends TestCase
{
    public function test_openapi_document_is_public_and_marks_login_as_public(): void
    {
        $this->app['env'] = 'production';
        // Como no container: sessão em banco (o phpunit usa 'array' e esconderia o erro).
        config(['session.driver' => 'database']);

        $spec = $this->getJson('/docs/api.json')->assertOk()->json();

        $this->assertSame('bearer', $spec['components']['securitySchemes']['bearerAuth']['scheme']);
        $this->assertSame([], $spec['paths']['/auth/login']['post']['security']);
        $this->assertSame([], $spec['paths']['/auth/register']['post']['security']);
        $this->assertArrayNotHasKey('security', $spec['paths']['/auth/me']['get']);
        $this->assertArrayHasKey('403', $spec['paths']['/users']['get']['responses']);
    }

    public function test_docs_ui_is_served(): void
    {
        $this->app['env'] = 'production';
        // Como no container: sessão em banco (o phpunit usa 'array' e esconderia o erro).
        config(['session.driver' => 'database']);

        $this->get('/docs/api')->assertOk()->assertSee('HerdVision · Auth Service API', false);
    }
}
