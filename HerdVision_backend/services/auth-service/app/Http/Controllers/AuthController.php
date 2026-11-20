<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /** Hash descartável para igualar o tempo de resposta quando o e-mail não existe. */
    private static ?string $dummyHash = null;

    public function __construct(private readonly JwtService $jwt) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        // Apenas name/email/password são aceitos (ver #[Fillable] no model);
        // todo cadastro público nasce com o perfil "user".
        $user = new User($request->validated());
        $user->role = Role::User;
        $user->save();

        return $this->tokenResponse($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        $passwordMatches = Hash::check(
            $request->validated('password'),
            $user?->password ?? (self::$dummyHash ??= Hash::make(Str::random(32))),
        );

        if (! $user || ! $passwordMatches) {
            // Mesma resposta para e-mail inexistente e senha errada (evita enumeração).
            return response()->json(['message' => 'Credenciais inválidas.'], 401);
        }

        return $this->tokenResponse($user);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $this->jwt->revoke($request->attributes->get('jwt_claims'));

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        $issued = $this->jwt->issue($user);

        return response()->json([
            'user' => new UserResource($user),
            'access_token' => $issued['token'],
            'token_type' => 'Bearer',
            'expires_in' => $issued['expires_in'],
        ], $status);
    }
}
