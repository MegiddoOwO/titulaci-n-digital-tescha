<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceAsesorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['usuario_id' => ['present', 'nullable', 'integer']];
    }

    public function messages(): array
    {
        return [
            'usuario_id.present' => 'usuario_id es requerido (use null para quitar el asesor).',
            'usuario_id.integer' => 'Usuario no encontrado.',
        ];
    }
}
