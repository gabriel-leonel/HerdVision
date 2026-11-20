<?php

use App\Http\Controllers\LotController;
use Illuminate\Support\Facades\Route;

Route::middleware('jwt')->group(function () {

    // Lotes
    //   consultar: qualquer usuário autenticado
    //   criar/editar: admin e user
    //   excluir: somente admin
    Route::get('lots', [LotController::class, 'index']);
    Route::get('lots/{lot}', [LotController::class, 'show']);

    Route::middleware('role:admin,user')->group(function () {
        Route::post('lots', [LotController::class, 'store']);
        Route::match(['put', 'patch'], 'lots/{lot}', [LotController::class, 'update']);
    });

    Route::delete('lots/{lot}', [LotController::class, 'destroy'])->middleware('role:admin');
});
