<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AceptarInvitacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['password' => ['required', 'string', 'min:8', 'confirmed']];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'Token y nueva contraseña son requeridos.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ];
    }
}
