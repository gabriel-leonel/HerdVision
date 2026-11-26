<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProtocolRequest;
use App\Http\Requests\UpdateProtocolRequest;
use App\Http\Resources\ProtocolResource;
use App\Models\ManagementProtocol;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProtocolController extends Controller
{
    /**
     * Lista protocolos com busca (nome/descrição), filtros por tipo e
     * situação (active) e paginação.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'string', 'max:100'],
            // Query string chega como texto: aceita true/false além de 1/0.
            'active' => ['nullable', 'in:true,false,1,0'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $protocols = ManagementProtocol::query()
            ->withAnimalsCount()
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(fn ($q) => $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%"));
            })
            ->when($filters['type'] ?? null, fn ($query, string $type) => $query->where('type', $type))
            ->when(isset($filters['active']), fn ($query) => $query->where(
                'active',
                filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN),
            ))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return ProtocolResource::collection($protocols);
    }

    public function show(ManagementProtocol $protocol): ProtocolResource
    {
        return new ProtocolResource($this->findWithCount($protocol->id));
    }

    public function store(StoreProtocolRequest $request): JsonResponse
    {
        $protocol = ManagementProtocol::create($request->validated());

        return (new ProtocolResource($this->findWithCount($protocol->id)))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateProtocolRequest $request, ManagementProtocol $protocol): ProtocolResource
    {
        $protocol->update($request->validated());

        return new ProtocolResource($this->findWithCount($protocol->id));
    }

    /**
     * Exclui o protocolo. Protocolo já aplicado a algum animal NÃO pode ser
     * excluído (409): o histórico de manejo é preservado e a orientação é
     * desativá-lo.
     */
    public function destroy(ManagementProtocol $protocol): JsonResponse|Response
    {
        if (($animals = $protocol->distinctAnimalsCount()) > 0) {
            return $this->hasAnimals($animals);
        }

        try {
            $protocol->delete();
        } catch (QueryException $e) {
            // Corrida: o protocolo foi aplicado entre a checagem e o DELETE e
            // a chave estrangeira (RESTRICT) barrou. Responde 409 em vez de 500.
            if (($animals = $protocol->distinctAnimalsCount()) > 0) {
                return $this->hasAnimals($animals);
            }

            throw $e;
        }

        return response()->noContent();
    }

    private function findWithCount(int $id): ManagementProtocol
    {
        return ManagementProtocol::query()->withAnimalsCount()->findOrFail($id);
    }

    private function hasAnimals(int $count): JsonResponse
    {
        return response()->json([
            'message' => "Não é possível excluir o protocolo: ele foi aplicado a {$count} animal(is). Desative-o em vez de excluir.",
            'animals_count' => $count,
        ], Response::HTTP_CONFLICT);
    }
}
