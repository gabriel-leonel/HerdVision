<?php

namespace App\Http\Requests;

use App\Enums\AssociationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnimalProtocolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Só a data de início e o status podem mudar (concluir/reabrir). Para
     * trocar o animal ou o protocolo, desvincule e aplique de novo.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'status' => ['sometimes', 'required', 'string', Rule::enum(AssociationStatus::class)],
        ];
    }
}
