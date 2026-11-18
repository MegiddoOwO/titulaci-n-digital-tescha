<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dictamen extends Model
{
    protected $table = 'dictamenes';

    protected $fillable = ['tramite_id', 'resultado', 'observaciones', 'emitido_por', 'fecha_emision'];

    protected function casts(): array
    {
        return [
            'fecha_emision' => 'datetime',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class, 'tramite_id');
    }

    public function emisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'emitido_por');
    }
}
