<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\LogoutController;
use App\Http\Controllers\PermisosController;
use App\Http\Controllers\GestionarPermisos;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LogoutController::class, 'logout'])->middleware('auth:sanctum');

// Rutas para estadísticas de permisos
Route::get('/estadisticas-generales', [GestionarPermisos::class, 'estadisticasGenerales']);
Route::post('/estadisticas-por-rango', [GestionarPermisos::class, 'estadisticasPorRango']);
Route::get('/informes-empleados', [GestionarPermisos::class, 'informesEmpleados']);
