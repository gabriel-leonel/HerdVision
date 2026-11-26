<?php

namespace App\Http\Requests;

use App\Enums\AlertStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAlertStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Valida só se o status existe; se a transição é permitida a partir do
     * status atual é decidido pelo AlertWorkflow (RN01).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::enum(AlertStatus::class)],
        ];
    }

    public function targetStatus(): AlertStatus
    {
        return AlertStatus::from($this->validated('status'));
    }
}
