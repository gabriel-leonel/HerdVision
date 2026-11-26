<?php

namespace App\Http\Requests;

use App\Enums\AnimalStatus;
use App\Enums\Species;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnimalRequest extends FormRequest
{
    public function authorize(): bool
    {
        // A autorização por perfil é feita pelo middleware 'role' nas rotas.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'identification' => ['required', 'string', 'max:255', Rule::unique('animals', 'identification')],
            'name' => ['nullable', 'string', 'max:255'],
            'species' => ['required', 'string', Rule::enum(Species::class)],
            'breed' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'status' => ['required', 'string', Rule::enum(AnimalStatus::class)],
            'lot_id' => ['required', 'integer', Rule::exists('lots', 'id')],
        ];
    }
}
