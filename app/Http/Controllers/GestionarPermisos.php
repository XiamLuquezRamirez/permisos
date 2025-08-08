<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Mail\NotificacionMailable;
use Illuminate\Support\Facades\Mail;

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

    public function agregarSoportes(Request $request)
    {

        $id_permiso = $request->id_permiso;

        if ($request->hasFile('archivos')) {
            foreach ($request->archivos as $archivo) {
                if ($archivo instanceof \Illuminate\Http\UploadedFile) {
                    $nombreOriginal = $archivo->getClientOriginalName();
                    $nombreArchivo = time() . '_' . $nombreOriginal;
                    $tipoArchivo = $archivo->getClientMimeType();
                    $sizeArchivo = $archivo->getSize();
                    $archivo->move(public_path('storage/soportes'), $nombreArchivo);

                    DB::connection('mysql2')->table('soporte_permisos')->insert([
                        'permiso' => $id_permiso,
                        'soporte' => $nombreArchivo,
                        'nombre' => $nombreOriginal,
                        'tipo' => $tipoArchivo,
                        'peso' => $sizeArchivo
                    ]);
                }
            }
        }
        
    }

    public function obtenerPermiso($id)
    {
        $permiso = DB::connection('mysql2')->table('permisos')->where('id', $id)->first();
        $usuario = DB::connection('mysql')->table('users')->where('id_usuario_tarea', $permiso->empleado)->first();

        return response()->json([
            'idReceptor' => $usuario->id
        ]);
    }

    public function obtenerPermisoUser($id)
    {
        $permiso = DB::connection('mysql2')->table('permisos')->where('id', $id)->first();
        $usuario = DB::connection('mysql')->table('users')->where('id', $permiso->usuario)->first();

        return response()->json([
            'idReceptor' => $usuario->id
        ]);
    }

    public function informesEmpleados(Request $request)
    {
        try {
            // Obtener parámetros de fecha del request
            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;
            
            // Consulta base para obtener empleados con información de permisos
            $informes = DB::connection('mysql2')->table('empleados')
                ->join('users', 'empleados.id', 'users.empleado')
                ->select(
                    'empleados.*',
                    'users.foto as foto_usuario',
                    'users.id as id_usuario'
                )
                ->get();

            // Calcular estadísticas para cada empleado
            $informesConEstadisticas = $informes->map(function ($empleado) use ($fechaInicio, $fechaFin) {
                // Construir consulta base con filtro de fechas si se proporciona
                $queryBase = DB::connection('mysql2')->table('permisos')
                    ->where('empleado', $empleado->id_usuario)
                    ->where('estado_reg', 'ACTIVO');
                
                if ($fechaInicio && $fechaFin) {
                    $queryBase->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin]);
                }
                
                // Permisos otorgados (aprobados)
                $permisosOtorgados = (clone $queryBase)
                    ->where('estado', 'Aprobado')
                    ->count();

                // Permisos rechazados
                $permisosRechazados = (clone $queryBase)
                    ->where('estado', 'Rechazado')
                    ->count();

                // Permisos pendientes
                $permisosPendientes = (clone $queryBase)
                    ->where('estado', 'Pendiente')
                    ->count();

                // Permisos cancelados
                $permisosCancelados = (clone $queryBase)
                    ->where('estado', 'Cancelado')
                    ->count();

                // Total de permisos
                $totalPermisos = (clone $queryBase)->count();

                // Calcular horas totales de permisos otorgados
                $queryHoras = (clone $queryBase)
                    ->where('estado', 'Aprobado')
                    ->whereNotNull('hora_inicio')
                    ->whereNotNull('hora_fin');
                
                $horasPermisos = $queryHoras->get()
                    ->sum(function ($permiso) {
                        $inicio = \Carbon\Carbon::parse($permiso->hora_inicio);
                        $fin = \Carbon\Carbon::parse($permiso->hora_fin);
                        $minutos = $inicio->diffInMinutes($fin, false);

                        // Obtener horas y minutos
                        $horas = floor($minutos / 60);
                        $restoMinutos = $minutos % 60;

                        return floatval("{$horas}." . str_pad(intval($restoMinutos), 2, '0', STR_PAD_RIGHT));
                    });

                $jornadaHoras = 8;

                $permisos = (clone $queryBase)
                    ->where('estado', 'Aprobado')
                    ->get();

                $totalDias = 0;
                $totalHoras = 0;

                foreach ($permisos as $permiso) {
                    if (!is_null($permiso->fecha_inicio) && !is_null($permiso->fecha_fin)) {
                        $fechaInicio = \Carbon\Carbon::parse($permiso->fecha_inicio);
                        $fechaFin = \Carbon\Carbon::parse($permiso->fecha_fin);
                        $dias = $fechaInicio->diffInDays($fechaFin, false) + 1;
                        $totalDias += $dias;
                    }

                    if (!is_null($permiso->hora_inicio) && !is_null($permiso->hora_fin)) {
                        $horaInicio = \Carbon\Carbon::parse($permiso->hora_inicio);
                        $horaFin = \Carbon\Carbon::parse($permiso->hora_fin);
                        $minutos = $horaInicio->diffInMinutes($horaFin, false);
                        $horas = $minutos / 60;
                        $totalHoras += $horas;
                    }
                }

                // Convertir horas a días
                $diasDesdeHoras = $totalHoras / $jornadaHoras;
                $totalPermisosDias = $totalDias + $diasDesdeHoras;

                // Agregar estadísticas al empleado
                $empleado->estadisticas = [
                    'permisos_otorgados' => $permisosOtorgados,
                    'permisos_rechazados' => $permisosRechazados,
                    'permisos_pendientes' => $permisosPendientes,
                    'permisos_cancelados' => $permisosCancelados,
                    'total_permisos' => $totalPermisos,
                    'horas_permisos' => $horasPermisos,
                    'dias_permisos' => $diasDesdeHoras > 0 ? round($diasDesdeHoras, 2) : 0,
                    'porcentaje_aprobacion' => $totalPermisos > 0 ? round(($permisosOtorgados / $totalPermisos) * 100, 2) : 0
                ];

                return $empleado;
            });

            // Ordenar por cantidad total de permisos (de mayor a menor)
            $informesConEstadisticas = $informesConEstadisticas->sortByDesc(function ($empleado) {
                return $empleado->estadisticas['total_permisos'];
            })->values();

            return response()->json([
                'success' => true,
                'informes' => $informesConEstadisticas
            ]);
        } catch (\Exception $e) {
            Log::error('Error al generar informes de empleados: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al generar informes: ' . $e->getMessage()
            ], 500);
        }
    }

    public function estadisticasGenerales(Request $request)
    {
        try {
            // Obtener parámetros de fecha del request
            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;
            
            // Construir consulta base con filtro de fechas si se proporciona
            $queryBase = DB::connection('mysql2')->table('permisos')
                ->where('estado_reg', 'ACTIVO');
            
            if ($fechaInicio && $fechaFin) {
                $queryBase->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin]);
            }
            
            // Estadísticas generales del sistema
            $estadisticas = [
                // Total de empleados
                'total_empleados' => DB::connection('mysql2')->table('empleados')->count(),

                // Total de permisos por estado
                'total_permisos' => (clone $queryBase)->count(),

                'permisos_otorgados' => (clone $queryBase)
                    ->where('estado', 'Aprobado')
                    ->count(),

                'permisos_rechazados' => (clone $queryBase)
                    ->where('estado', 'Rechazado')
                    ->count(),

                'permisos_pendientes' => (clone $queryBase)
                    ->where('estado', 'Pendiente')
                    ->count(),

                'permisos_cancelados' => (clone $queryBase)
                    ->where('estado', 'Cancelado')
                    ->count(),

                // Horas totales de permisos otorgados
                'horas_totales_permisos' => (clone $queryBase)
                    ->where('estado', 'Aprobado')
                    ->whereNotNull('hora_inicio')
                    ->whereNotNull('hora_fin')
                    ->get()
                    ->sum(function ($permiso) {
                        $horaInicio = \Carbon\Carbon::parse($permiso->hora_inicio);
                        $horaFin = \Carbon\Carbon::parse($permiso->hora_fin);
                        return $horaInicio->diffInHours($horaFin, false);
                    }),

                // Días totales de permisos otorgados
                'dias_totales_permisos' => (clone $queryBase)
                    ->where('estado', 'Aprobado')
                    ->whereNotNull('fecha_inicio')
                    ->whereNotNull('fecha_fin')
                    ->get()
                    ->sum(function ($permiso) {
                        $fechaInicio = \Carbon\Carbon::parse($permiso->fecha_inicio);
                        $fechaFin = \Carbon\Carbon::parse($permiso->fecha_fin);
                        return $fechaInicio->diffInDays($fechaFin, false) + 1;
                    }),

                // Permisos por mes (últimos 12 meses)
                'permisos_por_mes' => $this->generarDatosMensuales($fechaInicio, $fechaFin),

                // Top 5 empleados con más permisos
                'top_empleados_permisos' => (clone $queryBase)
                    ->leftJoin('users', 'permisos.empleado', 'users.id')
                    ->leftJoin('empleados', 'empleados.id', 'users.empleado')
                    ->selectRaw('empleados.nombres, empleados.apellidos, COUNT(*) as total_permisos, users.foto as foto_empleado')
                    ->groupBy('empleados.id', 'empleados.nombres', 'empleados.apellidos', 'users.foto')
                    ->orderBy('total_permisos', 'desc')
                    ->limit(5)
                    ->get(),

                // Permisos por motivo (top 5)
                'permisos_por_motivo' => (clone $queryBase)
                    ->selectRaw('motivo, COUNT(*) as total')
                    ->groupBy('motivo')
                    ->orderBy('total', 'desc')
                    ->limit(5)
                    ->get()
            ];

            // Calcular porcentajes
            $totalPermisos = $estadisticas['total_permisos'];
            if ($totalPermisos > 0) {
                $estadisticas['porcentaje_aprobacion'] = round(($estadisticas['permisos_otorgados'] / $totalPermisos) * 100, 2);
                $estadisticas['porcentaje_rechazo'] = round(($estadisticas['permisos_rechazados'] / $totalPermisos) * 100, 2);
                $estadisticas['porcentaje_pendientes'] = round(($estadisticas['permisos_pendientes'] / $totalPermisos) * 100, 2);
                $estadisticas['porcentaje_cancelados'] = round(($estadisticas['permisos_cancelados'] / $totalPermisos) * 100, 2);
            } else {
                $estadisticas['porcentaje_aprobacion'] = 0;
                $estadisticas['porcentaje_rechazo'] = 0;
                $estadisticas['porcentaje_pendientes'] = 0;
                $estadisticas['porcentaje_cancelados'] = 0;
            }

            return response()->json([
                'success' => true,
                'estadisticas' => $estadisticas
            ]);
        } catch (\Exception $e) {
            Log::error('Error al generar estadísticas generales: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al generar estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    public function estadisticasPorRango(Request $request)
    {
        try {
            $fechaInicio = $request->fecha_inicio;
            $fechaFin = $request->fecha_fin;

            if (!$fechaInicio || !$fechaFin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Las fechas de inicio y fin son requeridas'
                ], 400);
            }

            $estadisticas = [
                // Total de permisos en el rango
                'total_permisos' => DB::connection('mysql2')->table('permisos')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->count(),

                // Permisos otorgados en el rango
                'permisos_otorgados' => DB::connection('mysql2')->table('permisos')
                    ->where('estado', 'Aprobado')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->count(),

                // Permisos rechazados en el rango
                'permisos_rechazados' => DB::connection('mysql2')->table('permisos')
                    ->where('estado', 'Rechazado')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->count(),

                // Permisos pendientes en el rango
                'permisos_pendientes' => DB::connection('mysql2')->table('permisos')
                    ->where('estado', 'Pendiente')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->count(),

                'permisos_cancelados' => DB::connection('mysql2')->table('permisos')
                    ->where('estado', 'Cancelado')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->count(),

                // Horas totales de permisos otorgados en el rango
                'horas_permisos' => DB::connection('mysql2')->table('permisos')
                    ->where('estado', 'Aprobado')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->whereNotNull('hora_inicio')
                    ->whereNotNull('hora_fin')
                    ->get()
                    ->sum(function ($permiso) {
                        $horaInicio = \Carbon\Carbon::parse($permiso->hora_inicio);
                        $horaFin = \Carbon\Carbon::parse($permiso->hora_fin);
                        return $horaInicio->diffInHours($horaFin, false);
                    }),

                // Días totales de permisos otorgados en el rango
                'dias_permisos' => DB::connection('mysql2')->table('permisos')
                    ->where('estado', 'Aprobado')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->whereNotNull('fecha_inicio')
                    ->whereNotNull('fecha_fin')
                    ->get()
                    ->sum(function ($permiso) {
                        $fechaInicio = \Carbon\Carbon::parse($permiso->fecha_inicio);
                        $fechaFin = \Carbon\Carbon::parse($permiso->fecha_fin);
                        return $fechaInicio->diffInDays($fechaFin, false) + 1;
                    }),

                // Permisos por empleado en el rango
                'permisos_por_empleado' => DB::connection('mysql2')->table('permisos')
                    ->join('empleados', 'permisos.empleado', 'empleados.id')
                    ->where('permisos.estado_reg', 'ACTIVO')
                    ->whereBetween('permisos.fecha_inicio', [$fechaInicio, $fechaFin])
                    ->selectRaw('empleados.nombres, empleados.apellidos, COUNT(*) as total_permisos')
                    ->groupBy('empleados.id', 'empleados.nombres', 'empleados.apellidos')
                    ->orderBy('total_permisos', 'desc')
                    ->get(),

                // Permisos por motivo en el rango
                'permisos_por_motivo' => DB::connection('mysql2')->table('permisos')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->selectRaw('motivo, COUNT(*) as total')
                    ->groupBy('motivo')
                    ->orderBy('total', 'desc')
                    ->get(),

                // Permisos por día en el rango
                'permisos_por_dia' => DB::connection('mysql2')->table('permisos')
                    ->where('estado_reg', 'ACTIVO')
                    ->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->selectRaw('DATE(fecha_inicio) as fecha, COUNT(*) as total')
                    ->groupBy('fecha')
                    ->orderBy('fecha', 'asc')
                    ->get()
            ];

            // Calcular porcentajes
            $totalPermisos = $estadisticas['total_permisos'];
            if ($totalPermisos > 0) {
                $estadisticas['porcentaje_aprobacion'] = round(($estadisticas['permisos_otorgados'] / $totalPermisos) * 100, 2);
                $estadisticas['porcentaje_rechazo'] = round(($estadisticas['permisos_rechazados'] / $totalPermisos) * 100, 2);
                $estadisticas['porcentaje_pendientes'] = round(($estadisticas['permisos_pendientes'] / $totalPermisos) * 100, 2);
                $estadisticas['porcentaje_cancelados'] = round(($estadisticas['permisos_cancelados'] / $totalPermisos) * 100, 2);
            } else {
                $estadisticas['porcentaje_aprobacion'] = 0;
                $estadisticas['porcentaje_rechazo'] = 0;
                $estadisticas['porcentaje_pendientes'] = 0;
                $estadisticas['porcentaje_cancelados'] = 0;
            }

            return response()->json([
                'success' => true,
                'estadisticas' => $estadisticas,
                'rango_fechas' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al generar estadísticas por rango: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al generar estadísticas por rango: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cargarPermisosTodos()
    {
        $permisos = DB::connection('mysql2')->table('permisos')
            ->join('users', 'permisos.empleado', 'users.id')
            ->join('empleados', 'empleados.id', 'users.empleado')
            ->leftJoin('cargos', 'cargos.id', 'empleados.cargo')
            ->leftJoin('empresas', 'empresas.id', 'empleados.empresa')
            ->select(
                'permisos.*',
                'empleados.nombres',
                'empleados.apellidos',
                'empleados.foto',
                'cargos.nombre as cargo',
                'empresas.nombre as empresa',
                'users.foto as foto_usuario',
                'users.foto as foto_empleado'
            )
            ->where('permisos.estado_reg', 'ACTIVO')
            ->orderBy('permisos.id', 'desc')
            ->get();
        $permisosData = [];

        foreach ($permisos as $permiso) {
            $soportes = DB::connection('mysql2')->table('soporte_permisos')
                ->where('permiso', $permiso->id)
                ->get();

            $permiso->soportes = $soportes;
            $permisosData[] = $permiso;
        }



        return response()->json([
            'success' => true,
            'permisos' => $permisos
        ]);
    }

    public function eliminarArchivo(Request $request)
    {
        $id_archivo = $request->id_archivo;

        //eliminar archivo del sistema de archivos
        $archivo = DB::connection('mysql2')->table('soporte_permisos')->where('id', $id_archivo)->first();
        unlink(public_path('storage/soportes/' . $archivo->soporte));

        DB::connection('mysql2')->table('soporte_permisos')->where('id', $id_archivo)->delete();
        //consultar permisos
        $permisos = DB::connection('mysql2')->table('permisos')
            ->where('empleado', $request->user_id)
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
            'message' => 'Archivo eliminado correctamente',
            'permisos' => $permisos
        ]);
    }

    public function eliminarPermiso(Request $request)
    {
        $id_permiso = $request->id;

        //eliminar archivos del sistema de archivos
        $archivos = DB::connection('mysql2')->table('soporte_permisos')->where('permiso', $id_permiso)->get();
        foreach ($archivos as $archivo) {
            unlink(public_path('storage/soportes/' . $archivo->soporte));
        }

        //eliminar permiso de la tabla soporte_permisos
        DB::connection('mysql2')->table('soporte_permisos')->where('permiso', $id_permiso)->delete();

        //eliminar permiso
        DB::connection('mysql2')->table('permisos')->where('id', $id_permiso)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permiso eliminado correctamente'
        ]);
    }

    public function guardarPermiso(Request $request)
    {
        try {
            if ($request->accion == 'guardar') {
                $permisosId = DB::connection('mysql2')->table('permisos')->insertGetId([
                    'empleado' => $request->user_id,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin,
                    'hora_inicio' => $request->hora_inicio,
                    'hora_fin' => $request->hora_fin,
                    'fecha_solicitud' => now(),
                    'motivo' => $request->motivo,
                    'estado' => 'Pendiente',
                    'estado_reg' => 'ACTIVO'

                ]);
            } else {
                $permisosId = $request->id_permiso;
                DB::connection('mysql2')->table('permisos')->where('id', $permisosId)->update([
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin,
                    'hora_inicio' => $request->hora_inicio,
                    'hora_fin' => $request->hora_fin,
                    'motivo' => $request->motivo
                ]);
            }

            // guardar archivos
            if ($request->hasFile('archivos')) {
                foreach ($request->archivos as $archivo) {
                    if ($archivo instanceof \Illuminate\Http\UploadedFile) {
                        $nombreOriginal = $archivo->getClientOriginalName();
                        $nombreArchivo = time() . '_' . $nombreOriginal;
                        $tipoArchivo = $archivo->getClientMimeType();
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
            }

            //consultar permisos
            $permisos = DB::connection('mysql2')->table('permisos')
                ->where('empleado', $request->user_id)
                ->get();

            $permisosIds = $permisos->pluck('id');

            $soportes = DB::connection('mysql2')->table('soporte_permisos')
                ->whereIn('permiso', $permisosIds)
                ->get();

            $permisos = $permisos->map(function ($permiso) use ($soportes) {
                $permiso->soportes = $soportes->where('permiso', $permiso->id)->values();
                return $permiso;
            });

            //enviar notificacion al admin
            $admin = DB::connection('mysql2')->table('users')
                ->where('gestor_permisos', 'Si')
                ->first();

            $mensaje = 'Nuevo permiso pendiente';
            if ($request->accion == 'guardar') {
                $mensaje = 'ha solicitado un permiso';
            } else {
                $mensaje = 'ha actualizado un permiso';
            }

            $detalleNotificacion = [
                'id_permiso' => $permisosId,
                'id_emisor' => $request->user_id,
                'tipo_emisor' => 'empleado',
                'id_receptor' => $admin->id,
                'tipo_receptor' => 'usuario',
                'mensaje' => $mensaje,
                'tipo' => 'NuevoPermiso',
                'fecha' => now()
            ];

            self::enviarNotificacion($detalleNotificacion);

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

    public function enviarNotificacion($notif)
    {
        //enviar al correo
        $permiso = DB::connection('mysql2')->table('permisos')->where('id', $notif['id_permiso'])->first();

        if ($notif['tipo_receptor'] == 'empleado') {
            $usuarioReceptor = DB::connection('mysql2')->table('users')->where('id', $notif['id_receptor'])->first();
            $usuarioReceptor = DB::connection('mysql')->table('users')->where('id_usuario_tarea', $usuarioReceptor->id)->first();
            $usuarioEmisor = DB::connection('mysql')->table('users')->where('id', $notif['id_emisor'])->first();
        } else {
            $usuarioEmisor = DB::connection('mysql')->table('users')->where('id_usuario_tarea', $notif['id_emisor'])->first();
            $usuarioReceptor = DB::connection('mysql2')->table('users')->where('id', $notif['id_receptor'])->first();
            $usuarioReceptor = DB::connection('mysql')->table('users')->where('id_usuario_tarea', $usuarioReceptor->id)->first();
        }

        \Carbon\Carbon::setLocale('es');

        // Formatear fechas con formato personalizado para a.m./p.m.
        $fechaInicio = date('d/m/Y H:i a', strtotime($permiso->fecha_inicio . 'T' . $permiso->hora_inicio));

        $fechaFin = date('d/m/Y H:i a', strtotime($permiso->fecha_fin . 'T' . $permiso->hora_fin));

        if ($notif['tipo'] == 'PermisoAprobado' || $notif['tipo'] == 'PermisoRechazado' || $notif['tipo'] == 'PermisoCancelado') {
            $mensaje = $notif['mensaje'];
        } else if ($notif['tipo'] == 'NuevoPermiso') {
            $mensaje = $notif['mensaje'] . ' con motivo: ' . $permiso->motivo . ' desde el ' .  $fechaInicio . ' hasta el ' . $fechaFin;
        }

        $notificacion = [
            'name' => $usuarioReceptor->name,
            'message' => $usuarioEmisor->name . ' ' . $mensaje,
            'tipo' => $notif['tipo'],
            'emisor' => $usuarioEmisor->name,
        ];

        $email = $usuarioReceptor->email;

        // Mail::to($email)->send(new NotificacionMailable($notificacion));
        // return response()->json(['success' => 'Notificación enviada correctamente'], 200);
    }

    public function aprobarPermiso(Request $request)
    {
        try {
            $permisoId = $request->id_permiso;

            DB::connection('mysql2')->table('permisos')
                ->where('id', $permisoId)
                ->update([
                    'estado' => 'Aprobado',
                    'comentario' => $request->comentario,
                    'fecha_decision' => now(),
                    'usuario' => Auth::user()->id
                ]);

            //enviar notificacion al empleado
            $permiso = DB::connection('mysql2')->table('permisos')->where('id', $permisoId)->first();
            $empleado = DB::connection('mysql2')->table('users')->where('id', $permiso->empleado)->first();
            $fechaSolicitud = date('d/m/Y', strtotime($permiso->fecha_solicitud));

            $mensaje = ' ha APROBADO su permiso solicitado el ' . $fechaSolicitud . ' con el motivo: ' . $request->comentario;

            $notificacion = [
                'id_permiso' => $permisoId,
                'id_emisor' => Auth::user()->id,
                'tipo_emisor' => 'usuario',
                'id_receptor' => $empleado->id,
                'tipo_receptor' => 'empleado',
                'mensaje' => $mensaje,
                'tipo' => 'PermisoAprobado',
                'fecha' => now()
            ];


            self::enviarNotificacion($notificacion);

            return response()->json([
                'success' => true,
                'message' => 'Permiso aprobado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al aprobar el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    public function rechazarPermiso(Request $request)
    {
        try {

            $permisoId = $request->id_permiso;
           
            if(Auth::user()){               

            DB::connection('mysql2')->table('permisos')
                ->where('id', $permisoId)
                ->update([
                    'estado' => 'Rechazado',
                    'comentario' => $request->comentario,
                    'fecha_decision' => now(),
                    'usuario' => Auth::user()->id
                ]);


            //enviar notificacion al empleado
            $permiso = DB::connection('mysql2')->table('permisos')->where('id', $permisoId)->first();
            $empleado = DB::connection('mysql2')->table('users')->where('id', $permiso->empleado)->first();
            $fechaSolicitud = date('d/m/Y', strtotime($permiso->fecha_solicitud));

            $mensaje = ' ha RECHAZADO su permiso solicitado el ' . $fechaSolicitud . ' con el motivo: ' . $request->comentario;
           
            $notificacion = [
                'id_permiso' => $permisoId,
                'id_emisor' => Auth::user()->id,
                'tipo_emisor' => 'usuario',
                'id_receptor' => $empleado->id,
                'tipo_receptor' => 'empleado',
                'mensaje' => $mensaje,
                'tipo' => 'PermisoRechazado',
                'fecha' => now()
            ];

            self::enviarNotificacion($notificacion);

            return response()->json([
                'success' => true,
                'message' => 'Permiso rechazado correctamente'
            ]);
            }else{
                return redirect('/')->with('error', 'Su sesión ha expirado, por favor inicie sesión nuevamente');
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al rechazar el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelarPermiso(Request $request)
    {
        try {

            $permisoId = $request->id;

            DB::connection('mysql2')->table('permisos')
                ->where('id', $permisoId)
                ->update([
                    'estado' => 'Cancelado',
                    'motivo_cancelar' => $request->motivo_cancelar,
                    'fecha_cancelacion' => now()
                ]);

            //enviar notificacion al administrador
            $admin = DB::connection('mysql2')->table('users')
            ->where('gestor_permisos', 'Si')
            ->first();

            $permiso = DB::connection('mysql2')->table('permisos')->where('id', $permisoId)->first();
            $fechaSolicitud = date('d/m/Y', strtotime($permiso->fecha_solicitud));

        $mensaje = 'ha CANCELADO un permiso solicitado el ' . $fechaSolicitud . ' con el motivo: ' . $request->motivo_cancelar;

        $detalleNotificacion = [
            'id_permiso' => $permisoId,
            'id_emisor' => $request->user_id,
            'tipo_emisor' => 'empleado',
            'id_receptor' => $admin->id,
            'tipo_receptor' => 'usuario',
            'mensaje' => $mensaje,
            'tipo' => 'PermisoCancelado',
            'fecha' => now()
        ];

        self::enviarNotificacion($detalleNotificacion);

            return response()->json([
                'success' => true,
                'message' => 'Permiso cancelado correctamente'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al cancelar el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generarDatosMensuales($fechaInicio = null, $fechaFin = null)
    {
        $meses = [];
        $añoActual = now()->year;

        // Generar datos para todos los meses del año actual
        for ($mes = 1; $mes <= 12; $mes++) {
            // Construir consulta base
            $query = DB::connection('mysql2')->table('permisos')
                ->where('estado_reg', 'ACTIVO')
                ->whereYear('fecha_inicio', $añoActual)
                ->whereMonth('fecha_inicio', $mes);
            
            // Aplicar filtro de fechas si se proporciona
            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('fecha_inicio', [$fechaInicio, $fechaFin]);
            }
            
            // Obtener el conteo real de permisos para este mes
            $total = $query->count();

            $meses[] = [
                'mes' => $mes,
                'año' => $añoActual,
                'total' => $total,
                'mes_nombre' => $this->obtenerNombreMes($mes)
            ];
        }

        return $meses;
    }

    private function obtenerNombreMes($mes)
    {
        $nombres = [
            1 => 'Enero',
            2 => 'Febrero',
            3 => 'Marzo',
            4 => 'Abril',
            5 => 'Mayo',
            6 => 'Junio',
            7 => 'Julio',
            8 => 'Agosto',
            9 => 'Septiembre',
            10 => 'Octubre',
            11 => 'Noviembre',
            12 => 'Diciembre'
        ];

        return $nombres[$mes] ?? $mes;
    }
}
