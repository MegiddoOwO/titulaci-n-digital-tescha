<?php

namespace App\Services\Admin;

use App\Models\Invitacion;

class InvitacionService
{
    public const PAGE_SIZE = 20;

    /**
     * @return array{invitaciones: array<int, array<string, mixed>>, total: int, page: int, totalPages: int}
     */
    public function list(?string $search, ?string $estado, int $page): array
    {
        $query = Invitacion::query()->with('creador:id,nombre,apellido_paterno');

        if ($search) {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('numero_control', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhereRaw("CONCAT(nombre, ' ', apellido_paterno) LIKE ?", [$like]));
        }

        if ($estado && in_array($estado, Invitacion::ESTADOS, true)) {
            $query->enEstado($estado);
        }

        $total = (clone $query)->count();

        $rows = $query->orderByDesc('id')
            ->offset(($page - 1) * self::PAGE_SIZE)->limit(self::PAGE_SIZE)
            ->get()
            ->map(fn (Invitacion $i) => [
                'id' => $i->id,
                'numero_control' => $i->numero_control,
                'email' => $i->email,
                'nombre' => $i->nombre,
                'apellido_paterno' => $i->apellido_paterno,
                'apellido_materno' => $i->apellido_materno,
                'rol' => $i->rol,
                'opcion_titulacion_id' => $i->opcion_titulacion_id,
                'asesor_id' => $i->asesor_id,
                'estado' => $i->estado,
                'creada_por' => $i->creador ? trim($i->creador->nombre.' '.$i->creador->apellido_paterno) : null,
                'expira_en' => $i->expira_en?->toIso8601String(),
                'aceptada_en' => $i->aceptada_en?->toIso8601String(),
                'revocada_en' => $i->revocada_en?->toIso8601String(),
                'created_at' => $i->created_at?->toIso8601String(),
            ])
            ->all();

        return [
            'invitaciones' => $rows,
            'total' => $total,
            'page' => $page,
            'totalPages' => (int) ceil($total / self::PAGE_SIZE),
        ];
    }
}
