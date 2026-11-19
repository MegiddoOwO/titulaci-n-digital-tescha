# Sistema de Titulación Digital - TESCHA

Plataforma web para la gestión y seguimiento del proceso de titulación de los alumnos del Tecnológico de Estudios Superiores de Chalco (TESCHA). Permite a estudiantes, asesores y administrativos gestionar expedientes, validar documentación y emitir dictámenes de manera digital.

## Tecnologías

- **Backend:** Laravel 13 (PHP 8.3 o superior), Eloquent, MariaDB/MySQL.
- **Frontend:** React 18 + TypeScript servido con Inertia.js, Tailwind CSS 3 y shadcn/ui, compilado con Vite.
- **PDF:** barryvdh/laravel-dompdf (dictámenes).
- **Autenticación:** sesión de Laravel, con el número de control como identificador.

## Roles

| Rol | Qué hace |
|---|---|
| Estudiante | Ve su trámite, sube documentos, consulta el historial y el dictamen, crea solicitudes ARCO. |
| Asesor | Revisa (aprueba o rechaza) los documentos de los estudiantes que tiene asignados. |
| Administrativo | Gestiona expedientes, documentos, dictámenes, usuarios, asignaciones, catálogos, solicitudes ARCO y bitácora. |

## Requisitos

- PHP 8.3+ con las extensiones `pdo_mysql`, `mbstring`, `xml`, `dom`, `zip`, `curl`, `fileinfo`, `openssl`, `tokenizer`, `ctype`, `bcmath`.
- Composer 2, Node.js 22 y npm.
- MariaDB o MySQL.

## Instalación

```bash
composer install
npm ci --ignore-scripts
cp .env.example .env
php artisan key:generate
```

Edita `.env` y configura la base de datos (la migración base es DDL de MariaDB/MySQL, no funciona con SQLite):

```
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sca_tescha
DB_USERNAME=...
DB_PASSWORD=...
SESSION_DRIVER=file
CACHE_STORE=file
```

Crea la base de datos vacía y luego:

```bash
php artisan migrate --seed   # esquema + datos de demostración
npm run build
php artisan serve
```

Cuentas de demostración (contraseña `Demo1234!`): estudiante `2021-0001`, asesor `DOC-0001`, administrativo `ADM-0001`.

Si ya tienes una base `sca_tescha` creada con el esquema anterior, `php artisan migrate` la adopta sin modificar sus tablas.

### Demo local sin configuración

`scripts/demo.sh` levanta una instancia propia de MariaDB (sin root, datos en `~/.local/share/sca-mariadb`) y sirve Laravel en `http://127.0.0.1:8001`:

```bash
scripts/demo.sh up        # base de datos + app
scripts/demo.sh status
scripts/demo.sh down
scripts/demo.sh reset-db --yes   # borra y recrea la base de demostración
scripts/demo.sh test-db          # prepara la base de pruebas
```

## Pruebas

Las pruebas corren solo contra la base `sca_tescha_test` (hay una protección que aborta si la base conectada tiene otro nombre) y usan `DatabaseTransactions`; nunca `RefreshDatabase`.

```bash
scripts/demo.sh test-db   # crea y siembra sca_tescha_test (una vez)
composer test             # o: php artisan test
```

## Correo

Por defecto `MAIL_MAILER=log`: los correos se escriben en `storage/logs` y no llegan a nadie. Se envían de forma síncrona (no hay cola) y un fallo de envío nunca interrumpe la operación: se registra en el log solo con el dominio del destinatario. Llevan correo el restablecimiento de contraseña y las notificaciones de tipo `email`/`ambos`.

**Gmail (solo pruebas, unos 500 correos por día).** Activa la verificación en dos pasos en la cuenta de Google y genera una *contraseña de aplicación* (no la contraseña normal):

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=smtp
MAIL_USERNAME=tu.cuenta@gmail.com
MAIL_PASSWORD=contraseña-de-aplicación
MAIL_FROM_ADDRESS=tu.cuenta@gmail.com
MAIL_FROM_NAME="SCA-TESCHA"
```

`MAIL_SCHEME` sustituye al antiguo `MAIL_ENCRYPTION`: `smtp` usa STARTTLS en el puerto 587; para SSL directo usa el puerto 465 con `MAIL_SCHEME=smtps`. El usuario es la dirección completa y `MAIL_FROM_ADDRESS` debe ser la misma cuenta.

**SMTP de producción o proveedor transaccional** (Resend, Brevo, Mailgun, SES por SMTP, o el servidor de la institución): cambian solo estas variables con los datos que entregue el proveedor (`MAIL_HOST`, `MAIL_PORT`, `MAIL_SCHEME`, `MAIL_USERNAME`, `MAIL_PASSWORD`) y `MAIL_FROM_ADDRESS` con una dirección del dominio autorizado. `MAIL_TIMEOUT` (segundos, 10 por defecto) evita que un servidor SMTP caído deje colgada una petición.

**Demos: `MAIL_ALWAYS_TO`.** Los usuarios de ejemplo tienen direcciones reales del dominio de la institución. Con `MAIL_ALWAYS_TO=tu.cuenta@gmail.com` todo correo saliente se entrega solo a esa dirección; el asunto lleva el prefijo `[Para: original@correo]` y el encabezado `X-Original-To` conserva al destinatario previsto. Déjalo sin definir en producción.

**Diagnóstico:** `php artisan sca:mail-test destino@correo.com` muestra la configuración efectiva (sin la contraseña; el usuario enmascarado), envía un mensaje de prueba y termina con código 1 si falla.

**Entregabilidad en producción:** configura SPF y DKIM (y DMARC) en el dominio remitente; sin ellos los correos suelen caer en spam.

## Almacenamiento de archivos

Los documentos subidos usan el disco `uploads`, elegido con `UPLOADS_DISK` en `.env`:

- `local` (por defecto): `storage/app/private/uploads/{tramite_id}/...`.
- `s3`: cualquier servicio compatible con S3. **Se recomienda Cloudflare R2.** Usa `league/flysystem-aws-s3-v3` (ya incluido en `composer.json`).

### Configurar Cloudflare R2

1. En el panel de Cloudflare: **R2 > Create bucket**. Mantenlo **privado**: no actives la URL pública `r2.dev` ni un dominio público personalizado.
2. **R2 > Manage API tokens > Create API token**. Permiso **Object Read & Write**, limitado a ese bucket.
3. Copia el **Access Key ID** y el **Secret Access Key** (solo se muestran una vez) y tu **Account ID** (el endpoint S3 es `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
4. Agrega a `.env` (deja `UPLOADS_DISK=local` hasta migrar los archivos existentes, paso 6):

```env
UPLOADS_DISK=s3
AWS_ACCESS_KEY_ID=<access key id>
AWS_SECRET_ACCESS_KEY=<secret access key>
AWS_DEFAULT_REGION=auto
AWS_BUCKET=<nombre del bucket>
AWS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_USE_PATH_STYLE_ENDPOINT=true
```

5. Ejecuta `php artisan config:clear` y luego `php artisan sca:uploads-test`. Muestra la configuración efectiva (sin el secreto, la clave enmascarada y solo el host del endpoint) y prueba escribir, leer, comprobar y borrar un objeto temporal en `uploads/_healthcheck/`. Termina con código 1 si algo falla y traduce los errores comunes (firma inválida, clave inexistente, permisos, bucket inexistente, endpoint o red) a una pista concreta. Con `UPLOADS_DISK=local` solo prueba el disco local.
6. Si ya hay archivos subidos, migra con la sección siguiente (respaldo, simulación y copia real).
7. Cambia a `UPLOADS_DISK=s3`, ejecuta `php artisan config:clear` y prueba abrir un documento y descargar un expediente.

Notas:

- Si el bucket se creó con jurisdicción UE, el endpoint es `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com` (fuente: <https://developers.cloudflare.com/r2/reference/data-location/>); la jurisdicción no se puede cambiar después.
- Checksums: el SDK de AWS (>= 3.337) envía sumas CRC32 por defecto y algunos servicios compatibles con S3 fallan con ellas. Por eso el disco usa `request_checksum_calculation` y `response_checksum_validation` en `when_required`. Pueden cambiarse con `AWS_REQUEST_CHECKSUM_CALCULATION` y `AWS_RESPONSE_CHECKSUM_VALIDATION` (`when_required` o `when_supported`).
- La integración con R2 se verificó con el protocolo S3 contra MinIO, no con una cuenta real de R2; haz la prueba del paso 5 con tus credenciales antes de migrar.

### Otros proveedores compatibles con S3

| Proveedor | `AWS_ENDPOINT` | `AWS_DEFAULT_REGION` | Path style |
|---|---|---|---|
| AWS S3 | (vacío) | región del bucket | `false` |
| Backblaze B2 | `https://s3.<region>.backblazeb2.com` | `<region>` | `false` |
| DigitalOcean Spaces | `https://<region>.digitaloceanspaces.com` | `<region>` | `false` |
| MinIO | `http://<host>:9000` | `us-east-1` | `true` |

### Reglas y privacidad

- El bucket debe ser **privado**. La aplicación nunca genera URLs públicas ni prefirmadas: cada archivo se sirve en streaming por la aplicación, solo después de pasar la política de acceso.
- Respalda el bucket (versionado o réplica del proveedor) además de la base de datos.
- Los documentos son datos personales de estudiantes. Antes de usar un proveedor externo, confirma con el área jurídica y de TI de la institución que el aviso de privacidad cubre el almacenamiento con un tercero.
- Las pruebas automáticas nunca usan un bucket real.

### Migrar los archivos existentes a un bucket

1. Haz un respaldo de la base de datos y de `storage/app/private`.
2. Configura las variables del bucket pero deja `UPLOADS_DISK=local`; luego ejecuta `php artisan config:clear`.
3. Simula: `php artisan sca:uploads-copy --from=local --to=s3 --dry-run`. Para copiar al disco configurado como `uploads` omite `--to` (con `UPLOADS_DISK=s3`).
4. Copia: `php artisan sca:uploads-copy --from=local --to=s3`. Omite los archivos ya presentes con el mismo tamaño, verifica el tamaño tras copiar e informa copiados, omitidos, faltantes y fallidos (código de salida 1 si algo falló).
5. Cambia a `UPLOADS_DISK=s3` y prueba abrir un documento y descargar un expediente.
6. Conserva `storage/app/private/uploads` hasta confirmar. Solo si lo deseas, `--delete-source` borra cada origen únicamente tras una copia verificada.

## Antes de producción

- `APP_DEBUG=false` y un `APP_KEY` propio.
- HTTPS, SMTP real (ver [Correo](#correo)) y contraseñas distintas a las de demostración.
- Respaldos de la base de datos **y** de los documentos subidos (`storage/app/private` o el bucket, ver [Almacenamiento de archivos](#almacenamiento-de-archivos)).
- Límites de subida de PHP (`upload_max_filesize`, `post_max_size`) mayores que el máximo por tipo de documento.

## Historial

La versión anterior (React + Express) se conserva en la rama `legacy-express` y en el tag `pre-laravel-cleanup`.
