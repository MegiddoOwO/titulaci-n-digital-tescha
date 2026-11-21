# Demo image: PHP built-in server + prebuilt frontend. Not meant for production.

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
# tsconfig aliases ziggy-js to vendor/, so the frontend build needs vendor/.
COPY --from=vendor /app/vendor vendor
COPY . .
RUN npm run build

FROM php:8.4-cli
RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libonig-dev libxml2-dev unzip \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip gd bcmath mbstring \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .
COPY --from=vendor /app/vendor vendor
COPY --from=assets /app/public/build public/build
RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
        storage/app/private storage/app/public bootstrap/cache \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX,o-rwx storage bootstrap/cache \
    && find storage bootstrap/cache -type d -exec chmod 775 {} +

COPY docker/entrypoint.sh /usr/local/bin/sca-entrypoint
RUN chmod +x /usr/local/bin/sca-entrypoint

# Defaults that docker.env (compose env_file) can override.
ENV HOME=/tmp \
    APP_URL=http://127.0.0.1:8001 \
    MAIL_MAILER=log

USER www-data
EXPOSE 8001
ENTRYPOINT ["sca-entrypoint"]
