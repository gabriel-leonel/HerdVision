<?php

namespace App\Http\Middleware;

use App\Exceptions\InvalidTokenException;
use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function __construct(private readonly JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->unauthenticated('Token de autenticação não informado.');
        }

        try {
            $claims = $this->jwt->decode($token);
        } catch (InvalidTokenException $e) {
            return $this->unauthenticated($e->getMessage());
        }

        // O perfil é sempre lido do banco (e não do claim "role"), assim uma
        // mudança de perfil ou exclusão do usuário vale imediatamente.
        $user = User::find($claims->sub);

        if (! $user) {
            return $this->unauthenticated('Usuário do token não existe mais.');
        }

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('jwt_claims', $claims);

        return $next($request);
    }

    private function unauthenticated(string $message): Response
    {
        return response()
            ->json(['message' => $message], 401)
            ->header('WWW-Authenticate', 'Bearer');
    }
}
