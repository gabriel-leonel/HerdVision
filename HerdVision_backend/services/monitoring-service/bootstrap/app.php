<?php

use App\Exceptions\HerdUnavailableException;
use App\Http\Middleware\AuthenticateJwt;
use App\Http\Middleware\EnsureRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt' => AuthenticateJwt::class,
            'role' => EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // 404 em JSON sem vazar o nome interno do model (ex.: "No query results for model [App\Models\Lot]").
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Recurso não encontrado.'], 404);
            }
        });

        // Herd Service fora do ar: a leitura não é gravada e o usuário pode tentar de novo.
        $exceptions->render(fn (HerdUnavailableException $e) => response()->json([
            'message' => 'Não foi possível confirmar o animal no serviço de rebanho agora. Tente novamente em instantes.',
        ], 503));

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
