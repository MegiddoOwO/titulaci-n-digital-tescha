<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpedienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'opcion_titulacion_id' => ['sometimes', 'integer', 'exists:opciones_titulacion,id'],
            'titulo_proyecto' => ['sometimes', 'nullable', 'string', 'max:300'],
        ];
    }

    public function messages(): array
    {
        return [
            'opcion_titulacion_id.*' => 'La opción de titulación no es válida.',
            'titulo_proyecto.max' => 'El título del proyecto no puede exceder 300 caracteres.',
        ];
    }
}
