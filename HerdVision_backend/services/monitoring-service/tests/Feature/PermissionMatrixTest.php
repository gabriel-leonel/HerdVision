<?php

namespace Tests\Feature;

use App\Models\MonitoringReading;
use App\Services\AlertWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Matriz de permissões do monitoring-service (release-3-funcionalidades.md §5):
 * todos os endpoints exigem token e aceitam admin e user.
 */
class PermissionMatrixTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{string, string}>
     */
    public static function routes(): array
    {
        return [
            'listar leituras' => ['GET', '/api/readings'],
            'ver leitura' => ['GET', '/api/readings/{reading}'],
            'registrar leitura' => ['POST', '/api/readings'],
            'listar alertas' => ['GET', '/api/alerts'],
            'ver alerta' => ['GET', '/api/alerts/{alert}'],
            'alterar status' => ['PATCH', '/api/alerts/{alert}/status'],
            'reabrir alerta' => ['POST', '/api/alerts/{alert}/reopen'],
        ];
    }

    private function resolve(string $uri): string
    {
        $reading = MonitoringReading::factory()->create();
        $alert = app(AlertWorkflow::class)->open([
            'animal_id' => 1, 'type' => 'temperatura', 'description' => 'X', 'severity' => 'alta',
        ]);

        return strtr($uri, ['{reading}' => $reading->id, '{alert}' => $alert->id]);
    }

    #[DataProvider('routes')]
    public function test_request_without_token_gets_401(string $method, string $uri): void
    {
        $this->json($method, $this->resolve($uri))->assertUnauthorized();
    }

    #[DataProvider('routes')]
    public function test_admin_and_user_are_allowed(string $method, string $uri): void
    {
        Http::fake();

        foreach (['admin', 'user'] as $role) {
            $status = $this->withToken($this->tokenFor(['role' => $role]))->json($method, $this->resolve($uri))->status();

            $this->assertNotContains($status, [401, 403], "{$role} deveria acessar {$method} {$uri} (recebeu {$status})");
        }
    }

    #[DataProvider('routes')]
    public function test_unknown_role_is_forbidden(string $method, string $uri): void
    {
        $this->withToken($this->tokenFor(['role' => 'visitante']))->json($method, $this->resolve($uri))->assertForbidden();
    }
}
