<?php

namespace App\Http\Requests\Admin;

use App\Services\Admin\InvitacionMasivaService;
use Illuminate\Foundation\Http\FormRequest;

/** Upload of the bulk invitations spreadsheet; always answers JSON (the UI calls it with fetch). */
class ValidateInvitacionMasivaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function expectsJson(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'archivo' => [
                'required', 'file', 'max:'.InvitacionMasivaService::MAX_FILE_KB,
                function (string $attribute, mixed $value, \Closure $fail) {
                    $extension = strtolower($value->getClientOriginalExtension());
                    if (! in_array($extension, ['xlsx', 'csv'], true)) {
                        $fail('Formato no admitido. Sube un archivo .xlsx o .csv.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'archivo.required' => 'Selecciona el archivo con las invitaciones.',
            'archivo.file' => 'El archivo no se pudo subir.',
            'archivo.uploaded' => 'El archivo no se pudo subir (supera el límite del servidor).',
            'archivo.max' => 'El archivo supera el tamaño máximo de 2 MB.',
        ];
    }
}
