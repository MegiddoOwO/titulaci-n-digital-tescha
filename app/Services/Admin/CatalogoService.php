<?php

namespace App\Services\Admin;

use App\Models\Directorio;
use App\Models\Normativa;
use App\Models\OpcionTitulacion;
use App\Models\TipoDocumento;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Port of catalogos.routes.ts `crudRoutes`. Express edited only `nombre` plus a few extra
 * columns per catalog. Its `normativa` and `directorio` entries could never work (normativa has no
 * `nombre` column; directorio needs `cargo`/`departamento`), so those two edit their real columns.
 */
class CatalogoService
{
    /** @var array<string, array{model: class-string<Model>, order: string, columns: list<string>}> */
    public const CATALOGS = [
        'opciones' => [
            'model' => OpcionTitulacion::class, 'order' => 'nombre',
            'columns' => ['nombre', 'fecha_limite'],
        ],
        'tipos-documento' => [
            'model' => TipoDocumento::class, 'order' => 'nombre',
            'columns' => ['nombre'],
        ],
        'normativa' => [
            'model' => Normativa::class, 'order' => 'titulo',
            'columns' => ['titulo', 'contenido', 'categoria', 'modalidad_id', 'orden'],
        ],
        'directorio' => [
            'model' => Directorio::class, 'order' => 'nombre',
            'columns' => ['nombre', 'cargo', 'departamento', 'email', 'telefono', 'extension', 'orden'],
        ],
    ];

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(string $catalogo): array
    {
        $config = self::CATALOGS[$catalogo];

        return DB::table((new $config['model'])->getTable())
            ->orderBy($config['order'])->orderBy('id')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    public function find(string $catalogo, int $id): Model
    {
        return self::CATALOGS[$catalogo]['model']::find($id) ?? abort(404, 'Registro no encontrado.');
    }

    /**
     * @param  array<string, mixed>  $data  validated input
     */
    public function create(string $catalogo, array $data): Model
    {
        return self::CATALOGS[$catalogo]['model']::create($this->only($catalogo, $data));
    }

    /**
     * @param  array<string, mixed>  $data  only the keys present are updated
     */
    public function update(string $catalogo, Model $item, array $data): void
    {
        $item->update($this->only($catalogo, $data));
    }

    public function toggle(Model $item): void
    {
        $item->update(['activo' => $item->activo ? 0 : 1]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function only(string $catalogo, array $data): array
    {
        return array_intersect_key($data, array_flip(self::CATALOGS[$catalogo]['columns']));
    }
}
