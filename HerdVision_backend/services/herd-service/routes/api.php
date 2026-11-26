<?php

use App\Http\Controllers\AnimalController;
use App\Http\Controllers\AnimalProtocolController;
use App\Http\Controllers\LotController;
use App\Http\Controllers\ProtocolController;
use Illuminate\Support\Facades\Route;

// Matriz de permissões (release-3-funcionalidades.md §5):
//   consultar: qualquer usuário autenticado
//   criar/editar (e aplicar/concluir/desvincular protocolo): admin e user
//   excluir lote, animal e protocolo: somente admin
Route::middleware('jwt')->group(function () {

    // Lotes
    Route::get('lots', [LotController::class, 'index']);
    Route::get('lots/{lot}', [LotController::class, 'show']);

    // Animais
    Route::get('animals', [AnimalController::class, 'index']);
    Route::get('animals/{animal}', [AnimalController::class, 'show']);

    // Protocolos de manejo
    Route::get('protocols', [ProtocolController::class, 'index']);
    Route::get('protocols/{protocol}', [ProtocolController::class, 'show']);

    // Associação animal <-> protocolo
    Route::get('animal-protocols', [AnimalProtocolController::class, 'index']);

    Route::middleware('role:admin,user')->group(function () {
        Route::post('lots', [LotController::class, 'store']);
        Route::match(['put', 'patch'], 'lots/{lot}', [LotController::class, 'update']);

        Route::post('animals', [AnimalController::class, 'store']);
        Route::match(['put', 'patch'], 'animals/{animal}', [AnimalController::class, 'update']);

        Route::post('protocols', [ProtocolController::class, 'store']);
        Route::match(['put', 'patch'], 'protocols/{protocol}', [ProtocolController::class, 'update']);

        Route::post('animal-protocols', [AnimalProtocolController::class, 'store']);
        Route::patch('animal-protocols/{animalProtocol}', [AnimalProtocolController::class, 'update']);
        Route::delete('animal-protocols/{animalProtocol}', [AnimalProtocolController::class, 'destroy']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::delete('lots/{lot}', [LotController::class, 'destroy']);
        Route::delete('animals/{animal}', [AnimalController::class, 'destroy']);
        Route::delete('protocols/{protocol}', [ProtocolController::class, 'destroy']);
    });
});
