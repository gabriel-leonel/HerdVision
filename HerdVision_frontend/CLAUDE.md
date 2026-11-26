# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

HerdVision is an academic MVP for precision livestock management (herd, lots, management protocols, monitoring readings, alerts). Planning and scope documents live at the repo root and are written in Portuguese:

- `herdvision_planning.md` — functional/non-functional requirements (RF01–RF17, RNF01–RNF22), entity model, architecture.
- `release-2-fundacao.md` — current release scope (R2-01…R2-13): full schema for every entity, auth flow, Lots as the first end-to-end CRUD, deploy checklist, `v0.2` tag.
- `HerdVision_frontend/DESIGN.md` — UI/brand spec (colors, typography, components, every MVP screen, API error-state handling). The frontend has no code yet; it is expected to run on `http://localhost:5173` (the CORS default).

User-facing text (API messages, validation errors, comments) is in **Brazilian Portuguese**; keep new messages in pt_BR.

## Repository layout

- `HerdVision_backend/` — the root of this folder is an **untouched Laravel skeleton**, not one of the services. The real code is in `HerdVision_backend/services/`.
- `HerdVision_backend/services/auth-service` (MS1, Identity) — users, register/login/logout, JWT issuance, roles `admin`/`user`.
- `HerdVision_backend/services/herd-service` (MS2) — lots, animals, management protocols, animal↔protocol pivot. Only `/api/lots` CRUD is exposed so far.
- `HerdVision_backend/services/monitoring-service` (MS3) — models/migrations for `monitoring_readings` and `alerts` plus the `AlertStatus` enum; no API routes or JWT middleware yet.

Each service is an independent Laravel 13 app (PHP ^8.3) with its own `composer.json`, `.env`, `vendor/`, and SQLite database. Commands must be run from inside the service directory.

## Commands (run inside a service directory)

```bash
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate            # auth-service: `migrate --seed` creates demo users (see its README)
php artisan serve              # auth: 8000, herd: --port=8001

php artisan test                                   # all tests (uses in-memory SQLite, see phpunit.xml)
php artisan test --filter=LotCrudTest              # one class
php artisan test --filter=test_method_name         # one method
php artisan test tests/Feature/Lots/LotCrudTest.php
vendor/bin/pint --test                             # style check (vendor/bin/pint to fix)
```

auth-service only: `php artisan jwt:generate-keys` creates `storage/jwt/private.pem` and `public.pem`.

## Cross-service architecture

**JWT (RS256), asymmetric:** only auth-service holds the private key and issues tokens (`app/Services/JwtService.php`). Other services verify with the **public key** only (herd-service: `app/Services/JwtVerifier.php`). To run herd-service locally, copy `auth-service/storage/jwt/public.pem` into `herd-service/storage/jwt/` (or set `JWT_PUBLIC_KEY` inline with `\n` escapes). A missing key returns **500** (configuration error), deliberately not 401. `storage/jwt/` is gitignored; never commit keys.

- `JWT_ISSUER` must be identical across services (defaults to auth-service's `APP_URL`, `http://localhost:8000`); herd-service must not use its own `APP_URL`.
- The algorithm is pinned server-side via `Key(...)`; the token header's `alg` is never trusted.
- Logout revokes the `jti` in auth-service's cache only. Other services cannot see revocations and accept the token until it expires (short `JWT_TTL`, 60 min default). This is a known, documented limitation.
- In auth-service the role is read from the DB; in herd-service there is no user table, so `AuthenticateJwt` builds a `GenericUser` from claims and the role comes from the token.

**Middleware:** each service registers aliases `jwt` (AuthenticateJwt) and `role` (EnsureRole, e.g. `role:admin` or `role:admin,user`) in `bootstrap/app.php`. The files are per-service copies, not shared code, and they differ slightly: auth-service's `EnsureRole` reads the `Role` enum (`->role->value`), while herd-service's reads a plain string. When adding JWT to monitoring-service, copy the herd-service (verify-only) variant.

**Database boundaries:** one SQLite file per service. Never create foreign keys across services. Cross-service references (for example `monitoring_readings.animal_id` and `alerts.animal_id`, which point to herd-service animals) are plain IDs, validated through API calls when needed.

## Conventions established in the code

- API errors are JSON `{"message": "..."}` (plus `errors` on 422). `bootstrap/app.php` forces JSON rendering for `api/*`; herd-service also replaces model-not-found 404s with a generic message so internal model names don't leak.
- List endpoints accept `search` and `per_page` (1–100, default 15) and return Laravel paginated resources (`LotController@index` is the reference).
- Updates are partial (only sent fields change; explicit `null` clears nullable fields).
- Deleting a lot that has animals returns **409** with `animals_count`; `animals.lot_id` is required with RESTRICT FK, and the controller also handles the race via `QueryException`.
- `animal_management_protocol` has its own `id` (the same protocol can be applied to an animal repeatedly).
- Alerts must be created as `Pendente`; the flow is `Pendente → Em análise → Resolvido` (transition validation not implemented yet).
- Validation messages are translated in `lang/pt_BR/validation.php` with friendly attribute names. `LangParityTest` fails if any framework validation key is missing, placeholders differ, or English text remains, so update that file when upgrading Laravel or adding attributes.
- Tests: herd-service's `tests/TestCase.php` generates an ephemeral RSA key pair and provides `tokenFor([...claims])`, `asAdmin()`, `asUser()` to act as auth-service, so tests never need real keys.
- CORS allows origins from `CORS_ALLOWED_ORIGINS` (comma-separated); Bearer-token auth only, `supports_credentials` is false.
