<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\AnimalManagementProtocol;
use App\Models\Lot;
use App\Models\ManagementProtocol;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Matriz de permissões do herd-service (release-3-funcionalidades.md §5),
 * verificada endpoint a endpoint chamando a API diretamente.
 */
class PermissionMatrixTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Rotas sem efeito colateral relevante para a checagem de perfil: o
     * middleware responde antes do controller, então o corpo pode ser vazio.
     *
     * @return array<string, array{string, string, list<string>}>
     */
    public static function routes(): array
    {
        return [
            'listar lotes' => ['GET', '/api/lots', ['admin', 'user']],
            'ver lote' => ['GET', '/api/lots/{lot}', ['admin', 'user']],
            'criar lote' => ['POST', '/api/lots', ['admin', 'user']],
            'editar lote' => ['PATCH', '/api/lots/{lot}', ['admin', 'user']],
            'excluir lote' => ['DELETE', '/api/lots/{lot}', ['admin']],
            'listar animais' => ['GET', '/api/animals', ['admin', 'user']],
            'ver animal' => ['GET', '/api/animals/{animal}', ['admin', 'user']],
            'criar animal' => ['POST', '/api/animals', ['admin', 'user']],
            'editar animal (PUT)' => ['PUT', '/api/animals/{animal}', ['admin', 'user']],
            'editar animal (PATCH)' => ['PATCH', '/api/animals/{animal}', ['admin', 'user']],
            'excluir animal' => ['DELETE', '/api/animals/{animal}', ['admin']],
            'listar protocolos' => ['GET', '/api/protocols', ['admin', 'user']],
            'ver protocolo' => ['GET', '/api/protocols/{protocol}', ['admin', 'user']],
            'criar protocolo' => ['POST', '/api/protocols', ['admin', 'user']],
            'editar protocolo (PUT)' => ['PUT', '/api/protocols/{protocol}', ['admin', 'user']],
            'editar protocolo (PATCH)' => ['PATCH', '/api/protocols/{protocol}', ['admin', 'user']],
            'excluir protocolo' => ['DELETE', '/api/protocols/{protocol}', ['admin']],
            'listar associações' => ['GET', '/api/animal-protocols', ['admin', 'user']],
            'aplicar protocolo' => ['POST', '/api/animal-protocols', ['admin', 'user']],
            'concluir aplicação' => ['PATCH', '/api/animal-protocols/{application}', ['admin', 'user']],
            'desvincular' => ['DELETE', '/api/animal-protocols/{application}', ['admin', 'user']],
        ];
    }

    private function resolve(string $uri): string
    {
        $lot = Lot::factory()->create();
        $animal = Animal::factory()->create();
        $protocol = ManagementProtocol::factory()->create();
        $application = AnimalManagementProtocol::create([
            'animal_id' => $animal->id, 'management_protocol_id' => $protocol->id,
            'start_date' => '2026-01-01', 'status' => 'em andamento',
        ]);

        return strtr($uri, [
            '{lot}' => $lot->id,
            '{animal}' => $animal->id,
            '{protocol}' => $protocol->id,
            '{application}' => $application->id,
        ]);
    }

    #[DataProvider('routes')]
    public function test_request_without_token_gets_401(string $method, string $uri): void
    {
        $this->json($method, $this->resolve($uri))->assertUnauthorized();
    }

    /**
     * @param  list<string>  $allowed
     */
    #[DataProvider('routes')]
    public function test_each_role_is_allowed_or_forbidden_as_in_the_matrix(string $method, string $uri, array $allowed): void
    {
        foreach (['admin', 'user'] as $role) {
            // Registros novos por perfil: um DELETE do admin não pode virar 404 para o user.
            $status = $this->withToken($this->tokenFor(['role' => $role]))->json($method, $this->resolve($uri))->status();

            in_array($role, $allowed, true)
                ? $this->assertNotContains($status, [401, 403], "{$role} deveria acessar {$method} {$uri} (recebeu {$status})")
                : $this->assertSame(403, $status, "{$role} não deveria acessar {$method} {$uri}");
        }
    }
}
