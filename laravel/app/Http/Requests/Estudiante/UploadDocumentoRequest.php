<?php

namespace App\Http\Requests\Estudiante;

use Illuminate\Foundation\Http\FormRequest;
use App\Support\ServerUploadLimit;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Facades\Gate;

class UploadDocumentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tramite = $this->route('tramite');

        // Express only finds tramites with activo = 1.
        abort_unless($tramite->activo, 404, 'Trámite no encontrado.');

        Gate::authorize('uploadDocument', $tramite);

        return true;
    }

    public function rules(): array
    {
        return [
            // 20 MB hard cap (Express multer limit); the per-type limit is enforced by the action.
            'archivo' => ['required', 'file', 'max:20480'],
            'tipo_documento_id' => ['required', 'integer'],
        ];
    }

    /** Replace the generic "no file" errors when PHP itself rejected the upload for size. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $message = ServerUploadLimit::violation($this);

            if ($message !== null) {
                $validator->errors()->forget('archivo');
                $validator->errors()->add('archivo', $message);
            }
        });
    }

    public function messages(): array
    {
        return [
            'archivo.required' => 'No se recibió ningún archivo.',
            'archivo.file' => 'No se recibió ningún archivo.',
            'archivo.uploaded' => 'No se recibió ningún archivo.',
            'archivo.max' => 'El archivo excede el límite de 20 MB.',
            'tipo_documento_id.required' => 'tipo_documento_id es requerido.',
            'tipo_documento_id.integer' => 'tipo_documento_id es requerido.',
        ];
    }
}
