<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvitacionRequest extends FormRequest
{
    private const REQUIRED = 'Campos requeridos: numero_control, email, nombre, apellido_paterno, rol.';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero_control' => ['required', 'string', 'max:20'],
            'email' => ['required', 'string', 'email', 'max:120'],
            'nombre' => ['required', 'string', 'max:80'],
            'apellido_paterno' => ['required', 'string', 'max:80'],
            'apellido_materno' => ['nullable', 'string', 'max:80'],
            'rol' => ['required', 'in:estudiante,asesor,administrativo'],
            'grado_academico' => ['nullable', 'string', 'max:80'],
            'carga_maxima' => ['nullable', 'integer', 'min:0', 'max:255'],
            'asesor_id' => ['nullable', 'integer', 'exists:usuarios,id'],
            'opcion_titulacion_id' => ['required_if:rol,estudiante', 'nullable', 'integer', 'exists:opciones_titulacion,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'numero_control.required' => self::REQUIRED,
            'email.required' => self::REQUIRED,
            'nombre.required' => self::REQUIRED,
            'apellido_paterno.required' => self::REQUIRED,
            'rol.required' => self::REQUIRED,
            'rol.in' => 'Rol inválido.',
            'email.email' => 'El email no es válido.',
            '*.max' => 'El campo :attribute excede la longitud permitida.',
            'opcion_titulacion_id.required_if' => 'Elige la opción de titulación del estudiante.',
            'opcion_titulacion_id.exists' => 'La opción de titulación no es válida.',
            'asesor_id.exists' => 'El asesor no es válido.',
        ];
    }
}
