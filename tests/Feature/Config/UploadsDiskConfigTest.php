<?php

namespace Tests\Feature\Config;

use App\Support\UploadsDiskConfig;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UploadsDiskConfigTest extends TestCase
{
    public function test_unknown_and_default_names_fall_back_to_local(): void
    {
        foreach (['local', 'nope', ''] as $name) {
            $c = UploadsDiskConfig::make($name, ['R2_ACCOUNT_ID' => 'x']);
            $this->assertSame('local', $c['driver']);
            $this->assertSame(storage_path('app/private'), $c['root']);
        }
    }

    public function test_generic_s3_is_unchanged(): void
    {
        $c = UploadsDiskConfig::make('s3', [
            'AWS_ACCESS_KEY_ID' => 'k', 'AWS_SECRET_ACCESS_KEY' => 's', 'AWS_BUCKET' => 'b',
            'AWS_ENDPOINT' => 'http://minio:9000', 'AWS_USE_PATH_STYLE_ENDPOINT' => 'true',
            'R2_ACCOUNT_ID' => 'ignored', 'R2_BUCKET' => 'ignored',
        ]);
        $this->assertSame('s3', $c['driver']);
        $this->assertSame(['k', 's', 'b', 'http://minio:9000', true, 'us-east-1'], [
            $c['key'], $c['secret'], $c['bucket'], $c['endpoint'], $c['use_path_style_endpoint'], $c['region'],
        ]);
        $this->assertSame('when_required', $c['request_checksum_calculation']);
        $this->assertSame('private', $c['visibility']);
        $this->assertArrayNotHasKey('provider', $c);

        $plain = UploadsDiskConfig::make('s3', []);
        $this->assertNull($plain['endpoint']);
        $this->assertFalse($plain['use_path_style_endpoint']);
    }

    public function test_r2_derives_endpoint_from_account_id_with_defaults(): void
    {
        $c = UploadsDiskConfig::make('r2', [
            'R2_ACCOUNT_ID' => 'abc123', 'R2_ACCESS_KEY_ID' => 'rk', 'R2_SECRET_ACCESS_KEY' => 'rs', 'R2_BUCKET' => 'rb',
        ]);
        $this->assertSame('s3', $c['driver']);
        $this->assertSame('r2', $c['provider']);
        $this->assertSame('https://abc123.r2.cloudflarestorage.com', $c['endpoint']);
        $this->assertSame('auto', $c['region']);
        $this->assertTrue($c['use_path_style_endpoint']);
        $this->assertSame(['rk', 'rs', 'rb'], [$c['key'], $c['secret'], $c['bucket']]);
        $this->assertSame('private', $c['visibility']);
        $this->assertTrue($c['throw']);
        $this->assertArrayNotHasKey('url', $c);
        $this->assertSame('when_required', $c['request_checksum_calculation']);
        $this->assertSame('when_required', $c['response_checksum_validation']);
    }

    public function test_r2_eu_jurisdiction(): void
    {
        $c = UploadsDiskConfig::make('r2', ['R2_ACCOUNT_ID' => 'abc123', 'R2_JURISDICTION' => 'EU']);
        $this->assertSame('https://abc123.eu.r2.cloudflarestorage.com', $c['endpoint']);
    }

    public function test_r2_unknown_jurisdiction_gives_no_endpoint(): void
    {
        $c = UploadsDiskConfig::make('r2', ['R2_ACCOUNT_ID' => 'abc123', 'R2_JURISDICTION' => 'fedramp']);
        $this->assertNull($c['endpoint']);
        $this->assertSame('fedramp', $c['jurisdiction']);
    }

    public function test_r2_endpoint_override_wins(): void
    {
        $c = UploadsDiskConfig::make('r2', ['R2_ACCOUNT_ID' => 'abc123', 'R2_ENDPOINT' => 'http://127.0.0.1:9100']);
        $this->assertSame('http://127.0.0.1:9100', $c['endpoint']);

        $noAccount = UploadsDiskConfig::make('r2', ['R2_ENDPOINT' => 'http://127.0.0.1:9100']);
        $this->assertSame('http://127.0.0.1:9100', $noAccount['endpoint']);
    }

    public function test_r2_falls_back_to_aws_credentials_and_prefers_r2_ones(): void
    {
        $fallback = UploadsDiskConfig::make('r2', [
            'AWS_ACCESS_KEY_ID' => 'ak', 'AWS_SECRET_ACCESS_KEY' => 'as', 'AWS_BUCKET' => 'ab', 'R2_ACCESS_KEY_ID' => '',
        ]);
        $this->assertSame(['ak', 'as', 'ab'], [$fallback['key'], $fallback['secret'], $fallback['bucket']]);

        $preferred = UploadsDiskConfig::make('r2', [
            'AWS_ACCESS_KEY_ID' => 'ak', 'R2_ACCESS_KEY_ID' => 'rk',
        ]);
        $this->assertSame('rk', $preferred['key']);
    }

    #[DataProvider('missingAccount')]
    public function test_r2_without_account_id_or_endpoint_has_null_endpoint(array $env): void
    {
        $c = UploadsDiskConfig::make('r2', $env);
        $this->assertNull($c['endpoint']);
        $this->assertNull($c['account_id']);
    }

    public static function missingAccount(): array
    {
        return [[[]], [['R2_ACCOUNT_ID' => '  ', 'R2_ENDPOINT' => '']]];
    }

    public function test_filesystems_config_exposes_uploads_and_r2_copy_target(): void
    {
        $this->assertSame('r2', config('filesystems.disks.r2.provider'));
        $this->assertSame('s3', config('filesystems.disks.r2.driver'));
        $this->assertContains(config('filesystems.disks.uploads.driver'), ['local', 's3']);
    }
}
