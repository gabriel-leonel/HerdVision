<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    public function test_admin_can_access_admin_route(): void
    {
        $this->withToken($this->tokenFor(['role' => 'admin']))
            ->getJson('/api/_test/admin')
            ->assertOk();
    }

    public function test_regular_user_is_forbidden_on_admin_route(): void
    {
        $this->withToken($this->tokenFor(['role' => 'user']))
            ->getJson('/api/_test/admin')
            ->assertForbidden();
    }

    public function test_token_without_role_claim_is_forbidden(): void
    {
        $this->withToken($this->tokenFor(['role' => null]))
            ->getJson('/api/_test/admin')
            ->assertForbidden();
    }

    public function test_guest_gets_401_not_403(): void
    {
        $this->getJson('/api/_test/admin')->assertUnauthorized();
    }
}
