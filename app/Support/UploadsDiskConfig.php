<?php

namespace App\Support;

/**
 * Builds the `uploads` disk variants (local, s3, r2) from an env array, so config/filesystems.php
 * stays short and tests can resolve each variant without touching the real environment.
 *
 * - local: storage/app/private (default; unknown names fall back to it).
 * - s3: generic S3-compatible service. The AWS_* names are the S3 SDK convention, no AWS account needed.
 * - r2: Cloudflare R2 with R2_* names; each credential falls back to its AWS_* counterpart.
 */
final class UploadsDiskConfig
{
    public const ENV_KEYS = [
        'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_DEFAULT_REGION', 'AWS_BUCKET', 'AWS_ENDPOINT',
        'AWS_USE_PATH_STYLE_ENDPOINT', 'AWS_REQUEST_CHECKSUM_CALCULATION', 'AWS_RESPONSE_CHECKSUM_VALIDATION',
        'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_JURISDICTION', 'R2_ENDPOINT',
    ];

    /** Reads the relevant variables through env() (call it from a config file, never at runtime). */
    public static function readEnv(): array
    {
        return array_combine(self::ENV_KEYS, array_map(fn (string $k) => env($k), self::ENV_KEYS));
    }

    public static function make(string $name, array $env): array
    {
        return match ($name) {
            's3' => self::s3($env),
            'r2' => self::r2($env),
            default => self::local(),
        };
    }

    private static function local(): array
    {
        return [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => true,
            'report' => false,
        ];
    }

    private static function s3(array $env): array
    {
        return [
            'driver' => 's3',
            'key' => self::get($env, 'AWS_ACCESS_KEY_ID'),
            'secret' => self::get($env, 'AWS_SECRET_ACCESS_KEY'),
            'region' => self::get($env, 'AWS_DEFAULT_REGION') ?: 'us-east-1',
            'bucket' => self::get($env, 'AWS_BUCKET'),
            'endpoint' => self::get($env, 'AWS_ENDPOINT') ?: null, // empty/unset means plain AWS S3
            'use_path_style_endpoint' => filter_var(self::get($env, 'AWS_USE_PATH_STYLE_ENDPOINT') ?? false, FILTER_VALIDATE_BOOLEAN),
            // aws-sdk-php >= 3.337 sends CRC32 checksums by default, which some S3-compatible
            // services (R2, MinIO, B2...) reject or mishandle; send them only when the operation requires it.
            'request_checksum_calculation' => self::get($env, 'AWS_REQUEST_CHECKSUM_CALCULATION') ?? 'when_required',
            'response_checksum_validation' => self::get($env, 'AWS_RESPONSE_CHECKSUM_VALIDATION') ?? 'when_required',
            'visibility' => 'private',
            'throw' => true,
            'report' => false,
        ];
    }

    private static function r2(array $env): array
    {
        $account = self::get($env, 'R2_ACCOUNT_ID');
        $jurisdiction = strtolower((string) self::get($env, 'R2_JURISDICTION'));
        $endpoint = self::get($env, 'R2_ENDPOINT');

        // Only `eu` is a known jurisdiction; anything else yields no endpoint (sca:uploads-test explains why).
        if (! $endpoint && $account && in_array($jurisdiction, ['', 'eu'], true)) {
            $endpoint = 'https://'.$account.($jurisdiction === 'eu' ? '.eu' : '').'.r2.cloudflarestorage.com';
        }

        return [
            'driver' => 's3',
            'provider' => 'r2', // informational (sca:uploads-test); ignored by the S3 adapter
            'account_id' => $account,
            'jurisdiction' => $jurisdiction ?: null,
            'key' => self::get($env, 'R2_ACCESS_KEY_ID') ?? self::get($env, 'AWS_ACCESS_KEY_ID'),
            'secret' => self::get($env, 'R2_SECRET_ACCESS_KEY') ?? self::get($env, 'AWS_SECRET_ACCESS_KEY'),
            'region' => 'auto',
            'bucket' => self::get($env, 'R2_BUCKET') ?? self::get($env, 'AWS_BUCKET'),
            'endpoint' => $endpoint ?: null,
            'use_path_style_endpoint' => true,
            'request_checksum_calculation' => self::get($env, 'AWS_REQUEST_CHECKSUM_CALCULATION') ?? 'when_required',
            'response_checksum_validation' => self::get($env, 'AWS_RESPONSE_CHECKSUM_VALIDATION') ?? 'when_required',
            'visibility' => 'private',
            'throw' => true,
            'report' => false,
        ];
    }

    /** Env value with empty strings treated as unset. */
    private static function get(array $env, string $key): mixed
    {
        $value = $env[$key] ?? null;

        return is_string($value) && trim($value) === '' ? null : (is_string($value) ? trim($value) : $value);
    }
}
