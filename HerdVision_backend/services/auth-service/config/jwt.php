<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Algoritmo
    |--------------------------------------------------------------------------
    | RS256 (assimétrico): apenas o auth-service possui a chave privada e emite
    | tokens. Os demais microsserviços só precisam da chave PÚBLICA para validar
    | a assinatura localmente, sem consultar o auth-service a cada requisição.
    */
    'algo' => 'RS256',

    /*
    |--------------------------------------------------------------------------
    | Chaves
    |--------------------------------------------------------------------------
    | Informe o conteúdo PEM direto na variável (útil em plataformas de deploy,
    | use "\n" para quebras de linha) OU o caminho do arquivo. O conteúdo tem
    | precedência sobre o caminho. Gere o par com: php artisan jwt:generate-keys
    */
    'private_key' => env('JWT_PRIVATE_KEY'),
    'private_key_path' => env('JWT_PRIVATE_KEY_PATH', storage_path('jwt/private.pem')),

    'public_key' => env('JWT_PUBLIC_KEY'),
    'public_key_path' => env('JWT_PUBLIC_KEY_PATH', storage_path('jwt/public.pem')),

    /*
    |--------------------------------------------------------------------------
    | Claims e validade
    |--------------------------------------------------------------------------
    */
    'issuer' => env('JWT_ISSUER', env('APP_URL', 'http://localhost')),

    // Validade do token em minutos.
    'ttl' => (int) env('JWT_TTL', 60),

    // Tolerância (segundos) para diferença de relógio entre serviços.
    'leeway' => (int) env('JWT_LEEWAY', 10),
];
