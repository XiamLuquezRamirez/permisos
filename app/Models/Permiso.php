<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'fecha_inicio',
        'fecha_fin',
        'motivo',
        'estado',
        'archivos'
    ];

    protected $casts = [
        'fecha' => 'date',
        'duracion' => 'integer',
        'archivos' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 