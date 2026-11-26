<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    | A autenticação é por Bearer token (header Authorization), sem cookies;
    | por isso supports_credentials é false. Liste as origens do frontend em
    | CORS_ALLOWED_ORIGINS, separadas por vírgula, e padrões (regex) em
    | CORS_ALLOWED_ORIGINS_PATTERNS.
    */
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // A barra final é removida: o navegador envia a origem sem ela.
    'allowed_origins' => array_values(array_filter(array_map(
        fn (string $origin) => rtrim(trim($origin), '/'),
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),
    ))),

    // Expressões regulares (separadas por vírgula) para origens dinâmicas, como
    // os deploys de preview da Vercel. Use âncoras ^ e $ e escape os pontos:
    // #^https://herdvision-frontend-[a-z0-9-]+-catateras-projects\.vercel\.app$#
    'allowed_origins_patterns' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', '')),
    ))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 600,

    'supports_credentials' => false,

];
