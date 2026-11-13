<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLotRequest;
use App\Http\Requests\UpdateLotRequest;
use App\Http\Resources\LotResource;
use App\Models\Lot;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class LotController extends Controller
{
    /**
     * Lista lotes com busca (nome/descrição) e paginação.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $lots = Lot::query()
            ->withCount('animals')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(fn ($q) => $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%"));
            })
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return LotResource::collection($lots);
    }

    public function show(Lot $lot): LotResource
    {
        return new LotResource($lot->loadCount('animals'));
    }

    public function store(StoreLotRequest $request): JsonResponse
    {
        $lot = Lot::create($request->validated())->loadCount('animals');

        return (new LotResource($lot))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateLotRequest $request, Lot $lot): LotResource
    {
        $lot->update($request->validated());

        return new LotResource($lot->loadCount('animals'));
    }

    /**
     * Exclui o lote. Lote com animais NÃO pode ser excluído (409): primeiro é
     * preciso mover ou remover os animais.
     */
    public function destroy(Lot $lot): JsonResponse|Response
    {
        if (($animals = $lot->animals()->count()) > 0) {
            return $this->hasAnimals($animals);
        }

        try {
            $lot->delete();
        } catch (QueryException $e) {
            // Corrida: um animal foi vinculado entre a checagem e o DELETE e a
            // chave estrangeira (RESTRICT) barrou. Responde 409 em vez de 500.
            if (($animals = $lot->animals()->count()) > 0) {
                return $this->hasAnimals($animals);
            }

            throw $e;
        }

        return response()->noContent();
    }

    private function hasAnimals(int $count): JsonResponse
    {
        return response()->json([
            'message' => "Não é possível excluir o lote: ele possui {$count} animal(is) associado(s). Mova ou remova os animais antes.",
            'animals_count' => $count,
        ], Response::HTTP_CONFLICT);
    }
}
