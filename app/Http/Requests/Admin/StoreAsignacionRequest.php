<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAsignacionRequest extends FormRequest
{
    private const REQUIRED = 'tramite_id, usuario_id y rol_asignacion (asesor|sinodal|revisor) son requeridos.';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tramite_id' => ['required', 'integer', 'exists:tramites,id'],
            'usuario_id' => ['required', 'integer', 'exists:usuarios,id'],
            'rol_asignacion' => ['required', 'in:asesor,sinodal,revisor'],
        ];
    }

    public function messages(): array
    {
        return [
            'tramite_id.required' => self::REQUIRED,
            'tramite_id.integer' => self::REQUIRED,
            'tramite_id.exists' => 'Trámite no encontrado.',
            'usuario_id.required' => self::REQUIRED,
            'usuario_id.integer' => self::REQUIRED,
            'usuario_id.exists' => 'Usuario no encontrado.',
            'rol_asignacion.required' => self::REQUIRED,
            'rol_asignacion.in' => self::REQUIRED,
        ];
    }
}
