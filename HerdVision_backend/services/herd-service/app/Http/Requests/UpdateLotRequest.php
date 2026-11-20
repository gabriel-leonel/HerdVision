<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Atualização parcial: só os campos enviados são alterados (vale para PUT e PATCH).
     * Para limpar a descrição, envie "description": null.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
