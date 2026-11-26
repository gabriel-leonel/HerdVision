<?php

namespace App\Http\Middleware;

use App\Exceptions\InvalidTokenException;
use App\Services\JwtVerifier;
use Closure;
use Illuminate\Auth\GenericUser;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function __construct(private readonly JwtVerifier $verifier) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->unauthenticated('Token de autenticação não informado.');
        }

        try {
            $claims = $this->verifier->verify($token);
        } catch (InvalidTokenException $e) {
            return $this->unauthenticated($e->getMessage());
        }

        // Este serviço não tem tabela de usuários: a identidade é montada a
        // partir dos claims. Atenção: o perfil (role) vem do token e vale até
        // ele expirar; o auth-service, que consulta o banco, é a fonte da verdade.
        $user = new GenericUser([
            'id' => $claims->sub,
            'name' => $claims->name ?? null,
            'email' => $claims->email ?? null,
            'role' => $claims->role ?? null,
        ]);

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
