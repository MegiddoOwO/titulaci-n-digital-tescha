<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create and update share the rules. Like Express' PUT, the identifying field (nombre/titulo)
 * must always be sent and the remaining columns are only validated when present.
 */
class CatalogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->isMethod('POST');
        $required = $creating ? 'required' : 'sometimes';
        $id = (int) $this->route('id');

        return match ($this->route('catalogo')) {
            'opciones' => [
                'nombre' => ['required', 'string', 'max:100', Rule::unique('opciones_titulacion', 'nombre')->ignore($id)],
                'fecha_limite' => ['nullable', 'date'],
            ],
            'tipos-documento' => [
                'nombre' => ['required', 'string', 'max:150'],
            ],
            'normativa' => [
                'titulo' => ['required', 'string', 'max:200'],
                'contenido' => [$required, 'string'],
                'categoria' => ['nullable', 'string', 'max:100'],
                'modalidad_id' => ['nullable', 'integer', 'exists:opciones_titulacion,id'],
                'orden' => ['nullable', 'integer', 'min:0', 'max:255'],
            ],
            'directorio' => [
                'nombre' => ['required', 'string', 'max:150'],
                'cargo' => [$required, 'string', 'max:150'],
                'departamento' => [$required, 'string', 'max:150'],
                'email' => ['nullable', 'email', 'max:100'],
                'telefono' => ['nullable', 'string', 'max:20'],
                'extension' => ['nullable', 'string', 'max:10'],
                'orden' => ['nullable', 'integer', 'min:0', 'max:255'],
            ],
        };
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es requerido.',
            'nombre.unique' => 'Ya existe un registro con ese nombre.',
            'titulo.required' => 'El título es requerido.',
            'contenido.required' => 'El contenido es requerido.',
            'cargo.required' => 'El cargo es requerido.',
            'departamento.required' => 'El departamento es requerido.',
            'fecha_limite.date' => 'La fecha límite no es válida.',
            'email.email' => 'El email no es válido.',
            'modalidad_id.exists' => 'La opción de titulación no es válida.',
            '*.max' => 'El campo :attribute excede la longitud permitida.',
        ];
    }
}
