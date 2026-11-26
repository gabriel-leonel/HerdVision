<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnimalProtocolRequest;
use App\Http\Requests\UpdateAnimalProtocolRequest;
use App\Http\Resources\AnimalProtocolResource;
use App\Models\AnimalManagementProtocol;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Associação N:N animal <-> protocolo de manejo (tabela
 * animal_management_protocol, com id próprio).
 */
class AnimalProtocolController extends Controller
{
    private const RELATIONS = ['animal:id,identification,name', 'managementProtocol:id,name,type,active'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'animal_id' => ['nullable', 'integer'],
            'management_protocol_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $applications = AnimalManagementProtocol::query()
            ->with(self::RELATIONS)
            ->when($filters['animal_id'] ?? null, fn ($query, $id) => $query->where('animal_id', $id))
            ->when($filters['management_protocol_id'] ?? null, fn ($query, $id) => $query->where('management_protocol_id', $id))
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return AnimalProtocolResource::collection($applications);
    }

    public function store(StoreAnimalProtocolRequest $request): JsonResponse
    {
        $application = AnimalManagementProtocol::create($request->validated())->load(self::RELATIONS);

        return (new AnimalProtocolResource($application))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateAnimalProtocolRequest $request, AnimalManagementProtocol $animalProtocol): AnimalProtocolResource
    {
        $animalProtocol->update($request->validated());

        return new AnimalProtocolResource($animalProtocol->load(self::RELATIONS));
    }

    /**
     * Desvincula: apaga só a linha da associação (nem o animal nem o protocolo).
     */
    public function destroy(AnimalManagementProtocol $animalProtocol): Response
    {
        $animalProtocol->delete();

        return response()->noContent();
    }
}
