<?php

namespace App\Console\Commands;

use App\Support\Uploads;
use Aws\Exception\AwsException;
use Illuminate\Console\Command;
use Throwable;

/**
 * Healthcheck of the `uploads` disk: prints the effective settings (never the secret) and runs
 * put, read back, exists, delete and gone against a throwaway object. Exit 0 only if all passed.
 */
class ScaUploadsTest extends Command
{
    protected $signature = 'sca:uploads-test';

    protected $description = 'Show the effective uploads disk settings and run a write/read/delete healthcheck';

    public function handle(): int
    {
        $config = (array) config('filesystems.disks.uploads');
        $driver = (string) ($config['driver'] ?? '-');

        $rows = [['driver', $driver]];
        if ($driver === 's3') {
            $rows = array_merge($rows, [
                ['bucket', (string) ($config['bucket'] ?? '') ?: '(unset)'],
                ['endpoint host', $this->host($config['endpoint'] ?? null)],
                ['region', (string) ($config['region'] ?? '-')],
                ['path style', ($config['use_path_style_endpoint'] ?? false) ? 'true' : 'false'],
                ['access key id', $this->mask($config['key'] ?? null)],
                ['request_checksum_calculation', (string) ($config['request_checksum_calculation'] ?? '(sdk default)')],
                ['response_checksum_validation', (string) ($config['response_checksum_validation'] ?? '(sdk default)')],
            ]);
        }
        $this->table(['Setting', 'Value'], $rows);

        if ($driver !== 's3') {
            $this->warn('Se esta probando el disco LOCAL. Para probar R2 u otro bucket define UPLOADS_DISK=s3 y ejecuta php artisan config:clear.');
        }

        $path = 'uploads/_healthcheck/'.now()->format('YmdHis').'-'.bin2hex(random_bytes(3)).'.txt';
        $body = 'sca-healthcheck '.now()->toIso8601String();
        $ok = true;
        $putTried = false;

        try {
            $disk = Uploads::disk();

            $putTried = true;
            $stored = $this->step('put', fn () => $disk->put($path, $body) !== false || throw new \RuntimeException('put returned false'));
            $ok = $stored;

            if ($stored) {
                $ok = $this->step('read back', function () use ($disk, $path, $body) {
                    if ($disk->get($path) !== $body) {
                        throw new \RuntimeException('El contenido leido no coincide con el escrito.');
                    }
                }) && $ok;
                $ok = $this->step('exists', fn () => $disk->exists($path) || throw new \RuntimeException('exists devolvio false')) && $ok;
                $deleted = $this->step('delete', function () use ($disk, $path) {
                    $disk->delete($path);
                });
                $ok = $deleted && $ok;
                $ok = $this->step('gone', fn () => ! $disk->exists($path) || throw new \RuntimeException('El objeto sigue existiendo tras borrarlo')) && $ok;
            }
        } catch (Throwable $e) {
            $ok = false;
            $this->line('  FAIL  setup: '.$this->describe($e));
        } finally {
            if ($putTried) {
                try {
                    Uploads::disk()->delete($path);
                } catch (Throwable) {
                    // best-effort cleanup; the step output already reported the real failure
                }
            }
        }

        if ($ok) {
            $this->info('Todo correcto: el disco uploads puede escribir, leer y borrar.');

            return self::SUCCESS;
        }

        $this->error('La prueba fallo. Revisa las pistas anteriores.');

        return self::FAILURE;
    }

    private function step(string $name, callable $fn): bool
    {
        try {
            $fn();
            $this->line("  OK    {$name}");

            return true;
        } catch (Throwable $e) {
            $this->line("  FAIL  {$name}: ".$this->describe($e));

            return false;
        }
    }

    /** Error code plus an actionable hint; never the raw message (it may echo request details). */
    private function describe(Throwable $e): string
    {
        $text = '';
        $code = null;
        for ($t = $e; $t !== null; $t = $t->getPrevious()) {
            if ($t instanceof AwsException && $t->getAwsErrorCode()) {
                $code ??= $t->getAwsErrorCode();
            }
            $text .= ' '.$t->getMessage();
        }

        $hints = [
            'SignatureDoesNotMatch' => 'revisa AWS_SECRET_ACCESS_KEY y que el token sea de R2',
            'InvalidAccessKeyId' => 'revisa AWS_ACCESS_KEY_ID',
            'AccessDenied' => 'el token necesita permiso Object Read & Write sobre ese bucket',
            'NoSuchBucket' => 'revisa AWS_BUCKET',
        ];
        foreach ($hints as $needle => $hint) {
            if ($code === $needle || str_contains($text, $needle)) {
                return "{$needle} -> {$hint}";
            }
        }
        if (preg_match('/cURL error|Could not resolve host|Connection refused|timed out|Failed to connect/i', $text)) {
            return 'error de conexion -> revisa AWS_ENDPOINT (account id) y la red';
        }

        return $code ? "{$code} (sin pista conocida)" : $e::class;
    }

    private function host(mixed $endpoint): string
    {
        $host = parse_url((string) $endpoint, PHP_URL_HOST);

        return $host ?: '(none, AWS S3)';
    }

    private function mask(mixed $key): string
    {
        $key = (string) $key;

        return $key === '' ? '(none)' : substr($key, 0, 4).str_repeat('*', max(strlen($key) - 4, 1));
    }
}
