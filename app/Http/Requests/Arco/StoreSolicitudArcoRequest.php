<?php

namespace App\Http\Requests\Arco;

use Illuminate\Foundation\Http\FormRequest;

class StoreSolicitudArcoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => ['required', 'in:acceso,rectificacion,cancelacion,oposicion'],
            'detalle' => ['nullable', 'string', 'max:65000'],
        ];
    }

    public function messages(): array
    {
        $invalid = 'Tipo de solicitud inválido. Use: acceso, rectificación, cancelación u oposición.';

        return [
            'tipo.required' => $invalid,
            'tipo.in' => $invalid,
        ];
    }
}
