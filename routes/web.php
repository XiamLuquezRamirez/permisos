<?php

use App\Http\Controllers\GestionarPermisos;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;

Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Ruta de prueba
Route::get('/test', function () {
    return response()->json(['message' => 'API funcionando']);
});

// Rutas de autenticación
Route::post('/login', [LoginController::class, 'login'])
    ->name('login');



// Rutas de permisos (sin middleware por ahora)
Route::prefix('api')->group(function () {
    Route::get('/permisos/{id}', [GestionarPermisos::class, 'cargarPermisos']);
    Route::post('/logout', [LoginController::class, 'logout'])
    ->name('logout');
    Route::post('/guardarPermiso', [GestionarPermisos::class, 'guardarPermiso']);
});

// Ruta catch-all para el SPA
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
