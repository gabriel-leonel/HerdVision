<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Lista usuários com busca, filtro por perfil e paginação (somente admin).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(Role::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $users = User::query()
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(fn ($q) => $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"));
            })
            ->when($filters['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return UserResource::collection($users);
    }
}
