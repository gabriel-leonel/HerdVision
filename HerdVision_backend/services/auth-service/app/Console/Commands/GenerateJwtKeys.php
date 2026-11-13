<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('jwt:generate-keys {--force : Sobrescreve as chaves existentes}')]
#[Description('Gera o par de chaves RSA (RS256) usado para assinar e validar os JWTs')]
class GenerateJwtKeys extends Command
{
    public function handle(): int
    {
        $privatePath = config('jwt.private_key_path');
        $publicPath = config('jwt.public_key_path');

        if ((is_file($privatePath) || is_file($publicPath)) && ! $this->option('force')) {
            $this->error('Já existem chaves JWT. Use --force para sobrescrever (invalida todos os tokens emitidos).');

            return self::FAILURE;
        }

        $resource = openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);

        if ($resource === false || ! openssl_pkey_export($resource, $privatePem)) {
            $this->error('Falha ao gerar a chave RSA. Verifique se a extensão openssl está habilitada.');

            return self::FAILURE;
        }

        $publicPem = openssl_pkey_get_details($resource)['key'];

        if (! is_dir(dirname($privatePath))) {
            mkdir(dirname($privatePath), 0700, true);
        }

        file_put_contents($privatePath, $privatePem);
        chmod($privatePath, 0600);
        file_put_contents($publicPath, $publicPem);

        $this->info("Chave privada: {$privatePath}");
        $this->info("Chave pública:  {$publicPath}");
        $this->line('Copie SOMENTE a chave pública para os demais microsserviços.');

        return self::SUCCESS;
    }
}
