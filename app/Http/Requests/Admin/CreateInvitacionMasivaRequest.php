<?php

namespace App\Http\Requests\Admin;

class CreateInvitacionMasivaRequest extends ValidateInvitacionMasivaRequest
{
    public function rules(): array
    {
        return parent::rules() + ['omitir_errores' => ['nullable', 'boolean']];
    }
}
