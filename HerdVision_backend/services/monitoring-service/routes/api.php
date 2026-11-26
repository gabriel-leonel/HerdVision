<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\ReadingController;
use Illuminate\Support\Facades\Route;

// Matriz de permissões (release-3-funcionalidades.md §5): consultar e
// registrar leituras, consultar alertas e alterar/reabrir status são
// permitidos a admin e user. Sem token: 401.
Route::middleware(['jwt', 'role:admin,user'])->group(function () {

    // Leituras de monitoramento
    Route::get('readings', [ReadingController::class, 'index']);
    Route::get('readings/{reading}', [ReadingController::class, 'show']);
    Route::post('readings', [ReadingController::class, 'store']);

    // Alertas (RN01)
    Route::get('alerts', [AlertController::class, 'index']);
    Route::get('alerts/{alert}', [AlertController::class, 'show']);
    Route::patch('alerts/{alert}/status', [AlertController::class, 'updateStatus']);
    Route::post('alerts/{alert}/reopen', [AlertController::class, 'reopen']);
});
