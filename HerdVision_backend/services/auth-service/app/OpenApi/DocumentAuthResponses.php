<?php

namespace App\OpenApi;

use Dedoc\Scramble\Contracts\OperationTransformer;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types\ObjectType;
use Dedoc\Scramble\Support\Generator\Types\StringType;
use Dedoc\Scramble\Support\RouteInfo;

/**
 * O Scramble infere 404/409/422 dos controllers e Requests, mas não enxerga
 * os middlewares próprios `jwt` e `role`. Este transformer documenta o 401 e
 * o 403 que eles devolvem, a partir dos middlewares de cada rota.
 */
class DocumentAuthResponses implements OperationTransformer
{
    public function handle(Operation $operation, RouteInfo $routeInfo): void
    {
        $middleware = $routeInfo->route->gatherMiddleware();

        if (in_array('jwt', $middleware, true)) {
            $operation->addResponse($this->error(401, 'Token ausente, inválido ou expirado.', 'Token de autenticação não informado.'));
        } else {
            // Rota pública: não herda o Bearer global do documento.
            $operation->security = [];
        }

        $roles = collect($middleware)->first(fn ($m) => is_string($m) && str_starts_with($m, 'role:'));

        if ($roles) {
            $allowed = str_replace(',', ', ', substr($roles, 5));
            $operation->addResponse($this->error(403, "Perfil sem permissão. Permitido: {$allowed}.", 'Você não tem permissão para acessar este recurso.'));
            $operation->description(trim($operation->description."\n\n**Perfis:** {$allowed}."));
        }
    }

    private function error(int $code, string $description, string $example): Response
    {
        $type = (new ObjectType)
            ->addProperty('message', (new StringType)->example($example))
            ->setRequired(['message']);

        return Response::make($code)
            ->setDescription($description)
            ->setContent('application/json', Schema::fromType($type));
    }
}
