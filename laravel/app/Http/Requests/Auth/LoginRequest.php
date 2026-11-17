<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'numero_control' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'numero_control.required' => 'Número de control y contraseña son requeridos.',
            'password.required' => 'Número de control y contraseña son requeridos.',
        ];
    }
}
