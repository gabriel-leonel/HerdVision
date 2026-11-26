<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Documentação OpenAPI (Scramble) pública em /docs/api, inclusive em produção.
 */
class ApiDocsTest extends TestCase
{
    public function test_openapi_document_is_public_and_documents_bearer_auth(): void
    {
        $this->app['env'] = 'production';
        // Como no container: sessão em banco (o phpunit usa 'array' e esconderia o erro).
        config(['session.driver' => 'database']);

        $spec = $this->getJson('/docs/api.json')->assertOk()->json();

        $this->assertStringStartsWith('3.', $spec['openapi']);
        $this->assertSame('bearer', $spec['components']['securitySchemes']['bearerAuth']['scheme']);
        $this->assertSame([['bearerAuth' => []]], $spec['security']);
        $this->assertArrayHasKey('/animals', $spec['paths']);
        $this->assertArrayHasKey('/protocols/{protocol}', $spec['paths']);
        $this->assertArrayHasKey('/animal-protocols', $spec['paths']);
    }

    public function test_auth_and_role_errors_are_documented(): void
    {
        $spec = $this->getJson('/docs/api.json')->json();

        $delete = $spec['paths']['/animals/{animal}']['delete']['responses'];
        $this->assertArrayHasKey('401', $delete);
        $this->assertArrayHasKey('403', $delete);
        $this->assertArrayHasKey('409', $spec['paths']['/protocols/{protocol}']['delete']['responses']);
        $this->assertArrayNotHasKey('403', $spec['paths']['/animals']['get']['responses']);
    }

    public function test_docs_ui_is_served(): void
    {
        $this->app['env'] = 'production';
        // Como no container: sessão em banco (o phpunit usa 'array' e esconderia o erro).
        config(['session.driver' => 'database']);

        $this->get('/docs/api')->assertOk()->assertSee('HerdVision · Herd Service API', false);
    }
}
