<?php

namespace App\Services;

use App\Enums\AlertSeverity;
use App\Enums\AlertType;
use App\Models\Alert;
use App\Models\MonitoringReading;

/**
 * Regra simples de geração de alertas a partir de uma leitura (dados manuais).
 * Cada indicador fora da referência gera um alerta "Pendente" ligado à
 * leitura. Limites em config/monitoring.php.
 */
class AlertGenerator
{
    public function __construct(private readonly AlertWorkflow $workflow) {}

    /**
     * @return list<Alert>
     */
    public function fromReading(MonitoringReading $reading): array
    {
        $t = config('monitoring.thresholds');
        $alerts = [];

        if ($reading->temperature !== null && $reading->temperature > $t['temperature_max']) {
            $alerts[] = $this->create(
                $reading,
                AlertType::Temperature,
                $reading->temperature >= $t['temperature_high'] ? AlertSeverity::High : AlertSeverity::Medium,
                sprintf(
                    'Temperatura de %s °C, acima da referência de %s °C. Recomenda-se avaliação.',
                    $this->number($reading->temperature, 1),
                    $this->number($t['temperature_max'], 1),
                ),
            );
        }

        if ($reading->activity_level !== null && $reading->activity_level < $t['level_attention_below']) {
            $alerts[] = $this->create(
                $reading,
                AlertType::Activity,
                $reading->activity_level < $t['level_high_below'] ? AlertSeverity::High : AlertSeverity::Medium,
                sprintf(
                    'Índice de atividade em %s, abaixo da referência de %s. Recomenda-se avaliação.',
                    $this->number($reading->activity_level),
                    $this->number($t['level_attention_below']),
                ),
            );
        }

        if ($reading->feeding_level !== null && $reading->feeding_level < $t['level_attention_below']) {
            $alerts[] = $this->create(
                $reading,
                AlertType::Feeding,
                $reading->feeding_level < $t['level_high_below'] ? AlertSeverity::High : AlertSeverity::Medium,
                sprintf(
                    'Índice de alimentação em %s, abaixo da referência de %s. Vale observar o cocho.',
                    $this->number($reading->feeding_level),
                    $this->number($t['level_attention_below']),
                ),
            );
        }

        return $alerts;
    }

    private function create(MonitoringReading $reading, AlertType $type, AlertSeverity $severity, string $description): Alert
    {
        return $this->workflow->open([
            'animal_id' => $reading->animal_id,
            'monitoring_reading_id' => $reading->id,
            'type' => $type->value,
            'severity' => $severity->value,
            'description' => $description,
        ]);
    }

    /** Número no formato pt-BR (ex.: 40,2). */
    private function number(float|int $value, int $decimals = 0): string
    {
        return number_format((float) $value, $decimals, ',', '.');
    }
}
