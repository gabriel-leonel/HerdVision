<?php

namespace App\Providers;

use App\OpenApi\DocumentAuthResponses;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Documentação OpenAPI em /docs/api (UI) e /docs/api.json, pública
        // também em produção: é entregável da Release 3 (ponto de complexidade).
        Gate::define('viewApiDocs', fn ($user = null) => true);

        Scramble::configure()
            ->withDocumentTransformers(function (OpenApi $openApi) {
                $openApi->secure(
                    SecurityScheme::http('bearer', 'JWT')
                        ->setDescription('Token RS256 emitido pelo auth-service (POST /api/auth/login).')
                        ->as('bearerAuth'),
                );
            })
            ->withOperationTransformers(DocumentAuthResponses::class);
    }
}
