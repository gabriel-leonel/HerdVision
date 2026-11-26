<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Usuários de demonstração (um por perfil), listados no README.
     * ATENÇÃO: senhas públicas, apenas para ambiente local/avaliação.
     */
    private const DEMO_USERS = [
        ['name' => 'Administrador Demo', 'email' => 'admin@herdvision.com', 'password' => 'Admin@1234', 'role' => Role::Admin],
        ['name' => 'Usuário Demo', 'email' => 'user@herdvision.com', 'password' => 'User@1234', 'role' => Role::User],
    ];

    /**
     * Idempotente: pode rodar a cada inicialização do container sem duplicar
     * registros nem sobrescrever usuários que já existam.
     */
    public function run(): void
    {
        foreach (self::DEMO_USERS as $data) {
            $user = User::firstOrNew(['email' => $data['email']]);

            if ($user->exists) {
                continue;
            }

            // `role` não é mass-assignable (ver User), por isso forceFill.
            $user->forceFill([
                'name' => $data['name'],
                'password' => $data['password'],
                'role' => $data['role'],
            ])->save();
        }
    }
}
