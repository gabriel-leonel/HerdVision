<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Documentação OpenAPI (Scramble) pública em /docs/api, inclusive em produção.
 */
class ApiDocsTest extends TestCase
{
    public function test_openapi_document_is_public_and_documents_errors(): void
    {
        $this->app['env'] = 'production';
        // Como no container: sessão em banco (o phpunit usa 'array' e esconderia o erro).
        config(['session.driver' => 'database']);

        $spec = $this->getJson('/docs/api.json')->assertOk()->json();

        $this->assertSame('bearer', $spec['components']['securitySchemes']['bearerAuth']['scheme']);
        $store = $spec['paths']['/readings']['post']['responses'];
        foreach (['201', '401', '403', '422', '503'] as $code) {
            $this->assertArrayHasKey($code, $store, "POST /readings sem {$code}");
        }
        $this->assertArrayHasKey('422', $spec['paths']['/alerts/{alert}/status']['patch']['responses']);
        $this->assertArrayHasKey('/alerts/{alert}/reopen', $spec['paths']);
    }

    public function test_docs_ui_is_served(): void
    {
        $this->app['env'] = 'production';
        // Como no container: sessão em banco (o phpunit usa 'array' e esconderia o erro).
        config(['session.driver' => 'database']);

        $this->get('/docs/api')->assertOk()->assertSee('HerdVision · Monitoring Service API', false);
    }
}
