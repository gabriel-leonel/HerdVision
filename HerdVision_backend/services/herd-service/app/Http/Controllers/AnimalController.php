<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnimalRequest;
use App\Http\Requests\UpdateAnimalRequest;
use App\Http\Resources\AnimalResource;
use App\Models\Animal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AnimalController extends Controller
{
    /**
     * Lista animais com busca (identificação/nome/raça), filtros por lote e
     * status e paginação.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'lot_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $animals = Animal::query()
            ->with('lot:id,name')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(fn ($q) => $q
                    ->where('identification', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('breed', 'like', "%{$search}%"));
            })
            ->when($filters['lot_id'] ?? null, fn ($query, $lotId) => $query->where('lot_id', $lotId))
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->orderBy('identification')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return AnimalResource::collection($animals);
    }

    public function show(Animal $animal): AnimalResource
    {
        return new AnimalResource($animal->load('lot:id,name'));
    }

    public function store(StoreAnimalRequest $request): JsonResponse
    {
        $animal = Animal::create($request->validated())->load('lot:id,name');

        return (new AnimalResource($animal))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateAnimalRequest $request, Animal $animal): AnimalResource
    {
        $animal->update($request->validated());

        return new AnimalResource($animal->load('lot:id,name'));
    }

    /**
     * Exclui o animal. As aplicações de protocolo saem junto (FK CASCADE);
     * leituras e alertas do monitoring-service guardam só o animal_id lógico
     * e ficam preservados.
     */
    public function destroy(Animal $animal): Response
    {
        $animal->delete();

        return response()->noContent();
    }
}
