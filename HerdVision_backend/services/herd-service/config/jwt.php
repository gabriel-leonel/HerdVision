<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validação de JWT (RS256)
    |--------------------------------------------------------------------------
    | Este serviço NÃO emite tokens: apenas valida os emitidos pelo auth-service,
    | usando a chave PÚBLICA. Copie o arquivo `storage/jwt/public.pem` do
    | auth-service para o mesmo caminho aqui, ou informe o PEM em JWT_PUBLIC_KEY.
    */
    'algo' => 'RS256',

    // Conteúdo PEM direto na variável (use "\n" nas quebras) tem precedência
    // sobre o caminho do arquivo.
    'public_key' => env('JWT_PUBLIC_KEY'),
    'public_key_path' => env('JWT_PUBLIC_KEY_PATH', storage_path('jwt/public.pem')),

    // Deve ser IGUAL ao JWT_ISSUER do auth-service (por padrão, o APP_URL dele).
    // Não use o APP_URL deste serviço.
    'issuer' => env('JWT_ISSUER', 'http://localhost:8000'),

    // Tolerância (segundos) para diferença de relógio entre serviços.
    'leeway' => (int) env('JWT_LEEWAY', 10),
];
