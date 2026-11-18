<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ResolveSolicitudArcoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', 'in:en_proceso,completada,rechazada'],
            'respuesta' => ['nullable', 'string', 'max:65000'],
        ];
    }

    public function messages(): array
    {
        return [
            'estado.required' => 'Estado inválido.',
            'estado.in' => 'Estado inválido.',
        ];
    }
}
