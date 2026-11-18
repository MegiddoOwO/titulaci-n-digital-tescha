<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Port of normativa.routes.ts, directorio.routes.ts and contenido.routes.ts (public reads).
 */
class PublicContentService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function normativa(?int $modalidadId): array
    {
        return DB::table('normativa as n')
            ->leftJoin('opciones_titulacion as o', 'n.modalidad_id', '=', 'o.id')
            ->where('n.activo', 1)
            ->when($modalidadId, fn ($q) => $q->where(
                fn ($w) => $w->whereNull('n.modalidad_id')->orWhere('n.modalidad_id', $modalidadId)
            ))
            ->orderBy('n.orden')->orderBy('n.id')
            ->get(['n.id', 'n.titulo', 'n.contenido', 'n.categoria', 'n.modalidad_id', 'n.orden', 'o.nombre as modalidad_nombre'])
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function normativaItem(int $id): ?array
    {
        $row = DB::table('normativa as n')
            ->leftJoin('opciones_titulacion as o', 'n.modalidad_id', '=', 'o.id')
            ->where('n.id', $id)->where('n.activo', 1)
            ->first(['n.*', 'o.nombre as modalidad_nombre']);

        return $row ? (array) $row : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function directorio(?string $search): array
    {
        $like = $search ? '%'.trim($search).'%' : null;

        return DB::table('directorio')
            ->where('activo', 1)
            ->when($like, fn ($q) => $q->where(
                fn ($w) => $w->where('nombre', 'like', $like)->orWhere('cargo', 'like', $like)->orWhere('departamento', 'like', $like)
            ))
            ->orderBy('orden')->orderBy('id')
            ->get(['id', 'nombre', 'cargo', 'departamento', 'email', 'telefono', 'extension'])
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function directorioItem(int $id): ?array
    {
        $row = DB::table('directorio')->where('id', $id)->where('activo', 1)->first();

        return $row ? (array) $row : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function requisitosFotografia(): array
    {
        return DB::table('requisitos_fotografia')
            ->where('activo', 1)
            ->orderBy('orden')->orderBy('id')
            ->get(['id', 'descripcion', 'orden'])
            ->map(fn ($r) => (array) $r)
            ->all();
    }
}
