<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Read-only model over the `vw_carga_docente` database view.
 */
class VwCargaDocente extends Model
{
    protected $table = 'vw_carga_docente';

    protected $primaryKey = 'docente_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'carga_maxima' => 'integer',
            'carga_actual' => 'integer',
        ];
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'docente_id');
    }

    public function save(array $options = []): never
    {
        throw new LogicException('vw_carga_docente is a read-only view.');
    }

    public function delete(): never
    {
        throw new LogicException('vw_carga_docente is a read-only view.');
    }
}
