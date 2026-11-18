<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class RejectDocumentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // role middleware + DocumentoPolicy::review run in the controller
    }

    public function rules(): array
    {
        return ['motivo' => ['required', 'string']];
    }

    public function messages(): array
    {
        return [
            'motivo.required' => 'El motivo de rechazo es requerido.',
            'motivo.string' => 'El motivo de rechazo es requerido.',
        ];
    }
}
