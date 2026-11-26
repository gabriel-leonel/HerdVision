<?php

namespace App\Http\Requests;

use App\Enums\AssociationStatus;
use App\Models\ManagementProtocol;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAnimalProtocolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'animal_id' => ['required', 'integer', Rule::exists('animals', 'id')],
            'management_protocol_id' => ['required', 'integer', Rule::exists('management_protocols', 'id')],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'status' => ['required', 'string', Rule::enum(AssociationStatus::class)],
        ];
    }

    /**
     * Protocolo inativo não pode ser aplicado a novos animais.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('management_protocol_id')) {
                    return;
                }

                $protocol = ManagementProtocol::find($this->input('management_protocol_id'));

                if ($protocol && ! $protocol->active) {
                    $validator->errors()->add(
                        'management_protocol_id',
                        'Protocolos inativos não podem ser associados. Reative o protocolo antes.',
                    );
                }
            },
        ];
    }
}
