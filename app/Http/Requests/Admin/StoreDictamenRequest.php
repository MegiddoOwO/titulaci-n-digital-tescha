<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreDictamenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tramite_id' => ['required', 'integer'],
            'resultado' => ['required', 'in:aprobado,rechazado'],
            'observaciones' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'tramite_id.*' => 'tramite_id y resultado son requeridos.',
            'resultado.required' => 'tramite_id y resultado son requeridos.',
            'resultado.in' => "resultado debe ser 'aprobado' o 'rechazado'.",
        ];
    }
}
