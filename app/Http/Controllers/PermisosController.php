<?php

namespace App\Http\Controllers;

use App\Models\Permiso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PermisosController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index($user_id)
    {
        // Verificar que el usuario autenticado solo pueda ver sus propios permisos
        if (Auth::id() != $user_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            $permisos = Permiso::where('user_id', $user_id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($permisos);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener los permisos'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'fecha_inicio' => 'required|date',
                'hora_inicio' => 'required',
                'fecha_fin' => 'required|date',
                'hora_fin' => 'required',
                'motivo' => 'required|string',
                'archivos.*' => 'nullable|file|max:10240'
            ]);

            $permiso = new Permiso();
            $permiso->user_id = Auth::id();
            $permiso->fecha_inicio = $request->fecha_inicio . ' ' . $request->hora_inicio;
            $permiso->fecha_fin = $request->fecha_fin . ' ' . $request->hora_fin;
            $permiso->motivo = $request->motivo;
            $permiso->estado = 'pendiente';

            $archivos = [];
            if ($request->hasFile('archivos')) {
                foreach ($request->file('archivos') as $archivo) {
                    $path = $archivo->store('permisos', 'public');
                    $archivos[] = $path;
                }
            }
            
            $permiso->archivos = $archivos;
            $permiso->save();

            return response()->json($permiso, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear el permiso'], 500);
        }
    }

    public function show($id)
    {
        try {
            $permiso = Permiso::where('id', $id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            return response()->json($permiso);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Permiso no encontrado'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $permiso = Permiso::where('id', $id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $request->validate([
                'fecha' => 'required|date',
                'duracion' => 'required|integer|min:1',
                'motivo' => 'required|string',
                'archivos.*' => 'nullable|file|max:10240'
            ]);

            $permiso->fecha = $request->fecha;
            $permiso->duracion = $request->duracion;
            $permiso->motivo = $request->motivo;

            if ($request->hasFile('archivos')) {
                // Eliminar archivos antiguos
                foreach ($permiso->archivos as $archivo) {
                    Storage::disk('public')->delete($archivo);
                }

                // Guardar nuevos archivos
                $archivos = [];
                foreach ($request->file('archivos') as $archivo) {
                    $path = $archivo->store('permisos', 'public');
                    $archivos[] = $path;
                }
                $permiso->archivos = $archivos;
            }

            $permiso->save();

            return response()->json($permiso);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al actualizar el permiso'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $permiso = Permiso::where('id', $id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            // Eliminar archivos asociados
            foreach ($permiso->archivos as $archivo) {
                Storage::disk('public')->delete($archivo);
            }

            $permiso->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar el permiso'], 500);
        }
    }
} 