<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReadingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // A autorização por perfil é feita pelo middleware 'role' nas rotas.
        return true;
    }

    /**
     * A existência do animal no Herd Service é conferida no controller
     * (HerdClient), depois desta validação local.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Tolerância de 1 minuto para diferença de relógio com o navegador.
        $limit = now()->addMinute()->toIso8601String();

        return [
            'animal_id' => ['required', 'integer', 'min:1'],
            'recorded_at' => ['required', 'date', "before_or_equal:{$limit}"],
            'temperature' => ['nullable', 'numeric', 'between:30,45', 'required_without_all:activity_level,feeding_level'],
            'activity_level' => ['nullable', 'numeric', 'between:0,100'],
            'feeding_level' => ['nullable', 'numeric', 'between:0,100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recorded_at.before_or_equal' => 'A leitura não pode estar no futuro.',
            'temperature.required_without_all' => 'Informe ao menos um indicador (temperatura, atividade ou alimentação).',
        ];
    }
}
