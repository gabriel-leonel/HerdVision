<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReadingRequest;
use App\Http\Resources\ReadingResource;
use App\Models\MonitoringReading;
use App\Services\AlertGenerator;
use App\Services\HerdClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReadingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'animal_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $readings = MonitoringReading::query()
            ->when($filters['animal_id'] ?? null, fn ($query, $id) => $query->where('animal_id', $id))
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return ReadingResource::collection($readings);
    }

    public function show(MonitoringReading $reading): ReadingResource
    {
        return new ReadingResource($reading);
    }

    /**
     * Registra a leitura e, na mesma transação, gera os alertas das
     * condições fora da referência.
     */
    public function store(StoreReadingRequest $request, HerdClient $herd, AlertGenerator $generator): JsonResponse
    {
        $data = $request->validated();

        // HerdUnavailableException (herd fora do ar) vira 503 em bootstrap/app.php.
        if (! $herd->animalExists((int) $data['animal_id'], (string) $request->bearerToken())) {
            throw ValidationException::withMessages(['animal_id' => 'O animal informado não existe no rebanho.']);
        }

        $data['recorded_at'] = Carbon::parse($data['recorded_at'])->setTimezone(config('app.timezone'));

        [$reading, $alerts] = DB::transaction(function () use ($data, $generator) {
            $reading = MonitoringReading::create($data);

            return [$reading, $generator->fromReading($reading)];
        });

        return (new ReadingResource($reading->refresh()))
            ->additional(['alerts_created' => count($alerts)])
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
