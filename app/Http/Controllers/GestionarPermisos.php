<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GestionarPermisos extends Controller
{
    public function cargarPermisos($id)
    {
        try {
            $permisos = DB::connection('mysql2')->table('permisos')
                ->where('empleado', $id)
                ->orderBy('id', 'desc')
                ->get();

                $permisosIds = $permisos->pluck('id');

            $soportes = DB::connection('mysql2')->table('soporte_permisos')
                ->whereIn('permiso', $permisosIds)
                ->get();

            

            $permisos = $permisos->map(function ($permiso) use ($soportes) {
                $permiso->soportes = $soportes->where('permiso', $permiso->id)->values();
                return $permiso;
            });

            return response()->json([
                'success' => true,
                'permisos' => $permisos,
                'count' => $permisos->count()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al cargar permisos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al cargar permisos: ' . $e->getMessage()
            ], 500);
        }
    }
    public function guardarPermiso(Request $request)
    {
        try {
            //dd($request->all());
            $permisosId = DB::connection('mysql2')->table('permisos')->insertGetId([
                'empleado' => $request->user_id,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin' => $request->fecha_fin,
                'hora_inicio' => $request->hora_inicio,
                'hora_fin' => $request->hora_fin,
                'fecha_solicitud' => now(),
                'motivo' => $request->motivo,
                'estado' => 'Pendiente'
                
            ]);

            // guardar archivos
            if($request->hasFile('archivos')){
            foreach ($request->archivos as $archivo) {
                $nombreOriginal = $archivo->getClientOriginalName();
                $nombreArchivo = time() . '_' . $nombreOriginal;
                $tipoArchivo = $archivo->getClientOriginalExtension();
                $sizeArchivo = $archivo->getSize();
                $archivo->move(public_path('storage/soportes'), $nombreArchivo);

                DB::connection('mysql2')->table('soporte_permisos')->insert([
                    'permiso' => $permisosId,
                    'soporte' => $nombreArchivo,
                    'nombre' => $nombreOriginal,
                    'tipo' => $tipoArchivo,
                    'peso' => $sizeArchivo
                ]);
            }
        }

            //consultar permisos
            $permisos = DB::connection('mysql2')->table('permisos')
                ->where('empleado', $request->user_id)
                ->get();

            return response()->json([
                'success' => true,
                'permisos' => $permisos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al guardar permiso: ' . $e->getMessage()
            ], 500);
        }
    }
}
