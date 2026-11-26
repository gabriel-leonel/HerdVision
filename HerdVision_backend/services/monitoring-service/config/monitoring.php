<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Regra simples de geração de alertas
    |--------------------------------------------------------------------------
    | Limites de referência aplicados a cada leitura registrada. Alertas indicam
    | condições que merecem avaliação; não são diagnóstico veterinário.
    | Espelham TEMPERATURE_RANGE e LEVEL_ATTENTION_BELOW do frontend.
    */
    'thresholds' => [
        // Temperatura (°C) acima deste valor gera alerta...
        'temperature_max' => 39.5,
        // ...com gravidade alta a partir deste valor (inclusive).
        'temperature_high' => 40.0,

        // Índices de atividade e alimentação (0–100) abaixo deste valor geram alerta...
        'level_attention_below' => 40,
        // ...com gravidade alta abaixo deste valor.
        'level_high_below' => 25,
    ],

    /*
    |--------------------------------------------------------------------------
    | Herd Service
    |--------------------------------------------------------------------------
    | Usado para confirmar que o animal existe antes de aceitar uma leitura.
    */
    'herd' => [
        'url' => rtrim((string) env('HERD_API_URL', 'http://localhost:8001'), '/'),
        'timeout' => (int) env('HERD_API_TIMEOUT', 5),
    ],
];
