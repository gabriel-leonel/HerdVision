<?php

namespace App\Http\Requests;

use App\Enums\ProtocolType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProtocolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Atualização parcial (PUT e PATCH). Desativar = enviar "active": false.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'type' => ['sometimes', 'required', 'string', Rule::enum(ProtocolType::class)],
            'active' => ['sometimes', 'required', 'boolean'],
        ];
    }
}
