<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAlertStatusRequest;
use App\Http\Resources\AlertResource;
use App\Models\Alert;
use App\Services\AlertWorkflow;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Alertas nascem das leituras: não há criação, edição ou exclusão manual.
 * O status só muda pelo fluxo da RN01.
 */
class AlertController extends Controller
{
    public function __construct(private readonly AlertWorkflow $workflow) {}

    /**
     * Lista alertas com busca (descrição/tipo), filtros por status, gravidade
     * e animal e paginação. O frontend usa meta.total nos contadores.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:100'],
            'severity' => ['nullable', 'string', 'max:100'],
            'animal_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $alerts = Alert::query()
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(fn ($q) => $q
                    ->where('description', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%"));
            })
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['severity'] ?? null, fn ($query, string $severity) => $query->where('severity', $severity))
            ->when($filters['animal_id'] ?? null, fn ($query, $id) => $query->where('animal_id', $id))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return AlertResource::collection($alerts);
    }

    public function show(Alert $alert): AlertResource
    {
        return new AlertResource($alert->load('history'));
    }

    /**
     * RN01: só aceita a próxima etapa (Pendente -> Em análise -> Resolvido).
     */
    public function updateStatus(UpdateAlertStatusRequest $request, Alert $alert): AlertResource
    {
        $alert = $this->workflow->transition($alert, $request->targetStatus(), $request->user());

        return new AlertResource($alert->load('history'));
    }

    /**
     * RN01, regra 4: reabertura explícita, só a partir de "Resolvido".
     */
    public function reopen(Request $request, Alert $alert): AlertResource
    {
        $alert = $this->workflow->reopen($alert, $request->user());

        return new AlertResource($alert->load('history'));
    }
}
