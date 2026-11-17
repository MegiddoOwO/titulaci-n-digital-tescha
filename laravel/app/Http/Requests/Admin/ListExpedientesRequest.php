<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListExpedientesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string'],
            'estatus' => ['nullable', 'string'],
            'page' => ['nullable'],
            'limit' => ['nullable'],
        ];
    }

    // Express: parseInt with fallbacks, page >= 1, 1 <= limit <= 100 (default 20).
    public function page(): int
    {
        return max(1, (int) $this->query('page') ?: 1);
    }

    public function limit(): int
    {
        return min(100, max(1, (int) $this->query('limit') ?: 20));
    }
}
