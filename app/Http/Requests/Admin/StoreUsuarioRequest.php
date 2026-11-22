<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreUsuarioRequest extends FormRequest
{
    private const REQUIRED = 'Campos requeridos: numero_control, email, password, nombre, apellido_paterno, rol.';

    private const DUPLICATE = 'Ya existe un usuario con ese número de control o email.';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero_control' => ['required', 'string', 'max:20', 'unique:usuarios,numero_control'],
            'email' => ['required', 'string', 'email', 'max:120', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:8'],
            'nombre' => ['required', 'string', 'max:80'],
            'apellido_paterno' => ['required', 'string', 'max:80'],
            'apellido_materno' => ['nullable', 'string', 'max:80'],
            'rol' => ['required', 'in:estudiante,asesor,administrativo'],
            'grado_academico' => ['nullable', 'string', 'max:80'],
            'carga_maxima' => ['nullable', 'integer', 'min:0', 'max:255'],
            'asesor_id' => ['nullable', 'integer'],
            'opcion_titulacion_id' => ['nullable', 'integer', 'exists:opciones_titulacion,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'numero_control.required' => self::REQUIRED,
            'email.required' => self::REQUIRED,
            'password.required' => self::REQUIRED,
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'nombre.required' => self::REQUIRED,
            'apellido_paterno.required' => self::REQUIRED,
            'rol.required' => self::REQUIRED,
            'rol.in' => 'Rol inválido.',
            'numero_control.unique' => self::DUPLICATE,
            'email.unique' => self::DUPLICATE,
            'email.email' => 'El email no es válido.',
            '*.max' => 'El campo :attribute excede la longitud permitida.',
            'opcion_titulacion_id.exists' => 'La opción de titulación no es válida.',
        ];
    }
}
