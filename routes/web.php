<?php

use App\Http\Controllers\GestionarPermisos;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;

Route::get('/api/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});


// Rutas de autenticación
Route::post('/login', [LoginController::class, 'login'])
    ->name('login');

// Rutas de permisos (sin middleware por ahora)
Route::middleware(['auth:sanctum'])->group(function () {
Route::prefix('api')->group(function () {
    Route::get('/permisos/{id}', [GestionarPermisos::class, 'cargarPermisos']);
    Route::post('/logout', [LoginController::class, 'logout'])
    ->name('logout');
    Route::post('/guardarPermiso', [GestionarPermisos::class, 'guardarPermiso']);
    Route::post('/eliminarArchivo', [GestionarPermisos::class, 'eliminarArchivo']);
    Route::post('/eliminarPermiso', [GestionarPermisos::class, 'eliminarPermiso']);
    Route::get('/permisosTodos', [GestionarPermisos::class, 'cargarPermisosTodos']);
    Route::post('/aprobarPermiso', [GestionarPermisos::class, 'aprobarPermiso']);
    Route::post('/rechazarPermiso', [GestionarPermisos::class, 'rechazarPermiso']);
    Route::get('/informesEmpleados', [GestionarPermisos::class, 'informesEmpleados']);
    Route::get('/obtenerPermiso/{id}', [GestionarPermisos::class, 'obtenerPermiso']);
    Route::get('/obtenerPermisoUser/{id}', [GestionarPermisos::class, 'obtenerPermisoUser']);
    Route::post('/cancelarPermiso', [GestionarPermisos::class, 'cancelarPermiso']);
    // Rutas de estadísticas
    Route::get('/estadisticas-generales', [GestionarPermisos::class, 'estadisticasGenerales']);
    Route::post('/estadisticas-por-rango', [GestionarPermisos::class, 'estadisticasPorRango']);
    Route::post('/agregarSoportes', [GestionarPermisos::class, 'agregarSoportes']);
});
});

// Ruta catch-all para el SPA
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
