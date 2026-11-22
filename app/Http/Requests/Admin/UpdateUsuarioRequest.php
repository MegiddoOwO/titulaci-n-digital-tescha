<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUsuarioRequest extends FormRequest
{
    private const DUPLICATE = 'Ya existe un usuario con ese número de control o email.';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = (int) $this->route('usuario');

        return [
            'numero_control' => ['nullable', 'string', 'max:20', Rule::unique('usuarios', 'numero_control')->ignore($id)],
            'email' => ['nullable', 'string', 'email', 'max:120', Rule::unique('usuarios', 'email')->ignore($id)],
            'password' => ['nullable', 'string', 'min:8'],
            'nombre' => ['nullable', 'string', 'max:80'],
            'apellido_paterno' => ['nullable', 'string', 'max:80'],
            'apellido_materno' => ['nullable', 'string', 'max:80'],
            'rol' => ['nullable', 'in:estudiante,asesor,administrativo'],
            'grado_academico' => ['nullable', 'string', 'max:80'],
            'carga_maxima' => ['nullable', 'integer', 'min:0', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'numero_control.unique' => self::DUPLICATE,
            'email.unique' => self::DUPLICATE,
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'email.email' => 'El email no es válido.',
            'rol.in' => 'Rol inválido.',
            '*.max' => 'El campo :attribute excede la longitud permitida.',
        ];
    }
}
