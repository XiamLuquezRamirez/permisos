# Estadísticas de Permisos - Documentación

## Descripción
Este documento describe los métodos implementados para calcular estadísticas de permisos otorgados, rechazados y horas de permisos en el sistema.

## Métodos Disponibles

### 1. `informesEmpleados()`
**Ruta:** `GET /api/informes-empleados`

Calcula estadísticas detalladas para cada empleado:

#### Respuesta:
```json
{
  "success": true,
  "informes": [
    {
      "id": 1,
      "nombres": "Juan",
      "apellidos": "Pérez",
      "foto_usuario": "foto.jpg",
      "estadisticas": {
        "permisos_otorgados": 5,
        "permisos_rechazados": 2,
        "permisos_pendientes": 1,
        "total_permisos": 8,
        "horas_permisos": 24,
        "dias_permisos": 3,
        "porcentaje_aprobacion": 62.5
      }
    }
  ]
}
```

### 2. `estadisticasGenerales()`
**Ruta:** `GET /api/estadisticas-generales`

Calcula estadísticas generales del sistema:

#### Respuesta:
```json
{
  "success": true,
  "estadisticas": {
    "total_empleados": 50,
    "total_permisos": 150,
    "permisos_otorgados": 120,
    "permisos_rechazados": 20,
    "permisos_pendientes": 10,
    "horas_totales_permisos": 480,
    "dias_totales_permisos": 60,
    "porcentaje_aprobacion": 80.0,
    "porcentaje_rechazo": 13.33,
    "porcentaje_pendientes": 6.67,
    "permisos_por_mes": [
      {
        "mes": 12,
        "año": 2024,
        "total": 15
      }
    ],
    "top_empleados_permisos": [
      {
        "nombres": "María",
        "apellidos": "García",
        "total_permisos": 8
      }
    ],
    "permisos_por_motivo": [
      {
        "motivo": "Cita médica",
        "total": 45
      }
    ]
  }
}
```

### 3. `estadisticasPorRango(Request $request)`
**Ruta:** `POST /api/estadisticas-por-rango`

Calcula estadísticas para un rango de fechas específico:

#### Parámetros:
- `fecha_inicio`: Fecha de inicio (formato: YYYY-MM-DD)
- `fecha_fin`: Fecha de fin (formato: YYYY-MM-DD)

#### Ejemplo de Request:
```json
{
  "fecha_inicio": "2024-01-01",
  "fecha_fin": "2024-12-31"
}
```

#### Respuesta:
```json
{
  "success": true,
  "estadisticas": {
    "total_permisos": 100,
    "permisos_otorgados": 80,
    "permisos_rechazados": 15,
    "permisos_pendientes": 5,
    "horas_permisos": 320,
    "dias_permisos": 40,
    "porcentaje_aprobacion": 80.0,
    "permisos_por_empleado": [
      {
        "nombres": "Carlos",
        "apellidos": "López",
        "total_permisos": 5
      }
    ],
    "permisos_por_motivo": [
      {
        "motivo": "Cita médica",
        "total": 30
      }
    ],
    "permisos_por_dia": [
      {
        "fecha": "2024-01-15",
        "total": 3
      }
    ]
  },
  "rango_fechas": {
    "inicio": "2024-01-01",
    "fin": "2024-12-31"
  }
}
```

## Cálculos Implementados

### Permisos Otorgados
- Cuenta todos los permisos con estado "Aprobado" y estado_reg "ACTIVO"

### Permisos Rechazados
- Cuenta todos los permisos con estado "Rechazado" y estado_reg "ACTIVO"

### Horas de Permisos
- Calcula la diferencia entre `hora_inicio` y `hora_fin` para permisos aprobados
- Utiliza Carbon para el cálculo preciso de horas
- Solo considera permisos con ambos campos de hora completos

### Días de Permisos
- Calcula la diferencia entre `fecha_inicio` y `fecha_fin` para permisos aprobados
- Incluye el día inicial en el cálculo (+1)
- Solo considera permisos con ambos campos de fecha completos

### Porcentajes
- Porcentaje de aprobación: (permisos_otorgados / total_permisos) * 100
- Porcentaje de rechazo: (permisos_rechazados / total_permisos) * 100
- Porcentaje de pendientes: (permisos_pendientes / total_permisos) * 100

## Consideraciones Técnicas

1. **Conexión a Base de Datos**: Todos los métodos utilizan la conexión 'mysql2'
2. **Manejo de Errores**: Cada método incluye try-catch para manejo de excepciones
3. **Logging**: Los errores se registran en el log del sistema
4. **Validación**: El método por rango valida que se proporcionen ambas fechas
5. **Rendimiento**: Las consultas están optimizadas para evitar N+1 queries

## Uso en Frontend

### Ejemplo con Axios:
```javascript
// Obtener estadísticas generales
const estadisticas = await axios.get('/api/estadisticas-generales');

// Obtener estadísticas por rango
const estadisticasRango = await axios.post('/api/estadisticas-por-rango', {
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-12-31'
});

// Obtener informes de empleados
const informes = await axios.get('/api/informes-empleados');
``` 