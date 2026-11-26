<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Uso: ->middleware('role:admin') ou ->middleware('role:admin,user')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = $request->user()?->role;

        if (! is_string($role) || ! in_array($role, $roles, true)) {
            return response()->json(
                ['message' => 'Você não tem permissão para acessar este recurso.'],
                403,
            );
        }

        return $next($request);
    }
}
