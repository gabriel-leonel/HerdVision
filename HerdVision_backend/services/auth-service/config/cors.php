<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    | A autenticação é por Bearer token (header Authorization), sem cookies;
    | por isso supports_credentials é false. Liste as origens do frontend em
    | CORS_ALLOWED_ORIGINS, separadas por vírgula.
    */
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 600,

    'supports_credentials' => false,

];
