<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consentimiento extends Model
{
    protected $table = 'consentimientos';

    public $timestamps = false;

    protected $fillable = ['usuario_id', 'version_aviso', 'ip_origen', 'user_agent', 'fecha_consentimiento'];

    protected function casts(): array
    {
        return [
            'fecha_consentimiento' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
