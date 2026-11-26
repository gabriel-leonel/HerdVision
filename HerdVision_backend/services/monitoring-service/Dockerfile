
FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git unzip libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN mkdir -p storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

RUN chmod +x docker-entrypoint.sh

EXPOSE 10000

# Cria o SQLite, roda as migrations e sobe o servidor.
CMD ["./docker-entrypoint.sh"]
