<?php

namespace App\Http\Requests;

use App\Enums\AnimalStatus;
use App\Enums\Species;
use App\Models\Animal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnimalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Atualização parcial: só os campos enviados são alterados (vale para PUT e PATCH).
     * Campos opcionais (nome, raça, nascimento) podem ser limpos com null.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Animal $animal */
        $animal = $this->route('animal');

        return [
            'identification' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('animals', 'identification')->ignore($animal->id)],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'species' => ['sometimes', 'required', 'string', Rule::enum(Species::class)],
            'breed' => ['sometimes', 'nullable', 'string', 'max:255'],
            'birth_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'status' => ['sometimes', 'required', 'string', Rule::enum(AnimalStatus::class)],
            'lot_id' => ['sometimes', 'required', 'integer', Rule::exists('lots', 'id')],
        ];
    }
}
