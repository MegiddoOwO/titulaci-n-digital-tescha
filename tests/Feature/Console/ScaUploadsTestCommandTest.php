<?php

namespace Tests\Feature\Console;

use Aws\CommandInterface;
use Aws\Exception\AwsException;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class ScaUploadsTestCommandTest extends TestCase
{
    private const SECRET = 'SUPER-SECRET-VALUE-123';

    private function s3Config(): void
    {
        config(['filesystems.disks.uploads' => [
            'driver' => 's3', 'key' => 'AKIAEXAMPLEKEY1234', 'secret' => self::SECRET, 'bucket' => 'mybucket',
            'endpoint' => 'https://acct123.r2.cloudflarestorage.com/secretpath', 'region' => 'auto',
            'use_path_style_endpoint' => true,
            'request_checksum_calculation' => 'when_required', 'response_checksum_validation' => 'when_required',
        ]]);
    }

    public function test_success_path_with_local_disk_message_and_cleanup(): void
    {
        Storage::fake('uploads');

        $this->artisan('sca:uploads-test')
            ->expectsOutputToContain('disco LOCAL')
            ->expectsOutputToContain('OK    put')
            ->expectsOutputToContain('OK    gone')
            ->assertExitCode(0);

        $this->assertSame([], Storage::disk('uploads')->allFiles('uploads/_healthcheck'));
    }

    public function test_prints_masked_settings_and_never_the_secret(): void
    {
        Storage::fake('uploads');
        $this->s3Config();

        $this->artisan('sca:uploads-test')
            ->expectsOutputToContain('acct123.r2.cloudflarestorage.com')
            ->expectsOutputToContain('when_required')
            ->doesntExpectOutputToContain(self::SECRET)
            ->doesntExpectOutputToContain('AKIAEXAMPLEKEY1234')
            ->doesntExpectOutputToContain('secretpath')
            ->assertExitCode(0);
    }

    public function test_read_mismatch_fails_but_still_deletes(): void
    {
        $this->s3Config();
        $disk = $this->failingDisk(function (MockInterface $m) {
            $m->shouldReceive('put')->andReturn(true);
            $m->shouldReceive('get')->andReturn('other content');
            $m->shouldReceive('exists')->andReturn(true, false, false);
            $m->shouldReceive('delete')->twice()->andReturn(true); // step + final cleanup
        });
        Storage::set('uploads', $disk);

        $this->artisan('sca:uploads-test')
            ->expectsOutputToContain('FAIL  read back')
            ->expectsOutputToContain('OK    delete')
            ->assertExitCode(1);
    }

    public function test_put_failure_maps_hint_hides_secret_and_cleans_up(): void
    {
        $this->s3Config();
        $aws = new AwsException(
            'Error executing "PutObject" with secret '.self::SECRET,
            Mockery::mock(CommandInterface::class),
            ['code' => 'SignatureDoesNotMatch'],
        );
        $disk = $this->failingDisk(function (MockInterface $m) use ($aws) {
            $m->shouldReceive('put')->andThrow(new \RuntimeException('Unable to write', 0, $aws));
            $m->shouldReceive('delete')->once()->andReturn(true); // cleanup even after failed put
        });
        Storage::set('uploads', $disk);

        $this->artisan('sca:uploads-test')
            ->expectsOutputToContain('revisa AWS_SECRET_ACCESS_KEY')
            ->doesntExpectOutputToContain(self::SECRET)
            ->assertExitCode(1);
    }

    public function test_connection_error_hint(): void
    {
        $this->s3Config();
        $disk = $this->failingDisk(function (MockInterface $m) {
            $m->shouldReceive('put')->andThrow(new \RuntimeException('cURL error 6: Could not resolve host: x'));
            $m->shouldReceive('delete')->andThrow(new \RuntimeException('still down')); // cleanup failure is swallowed
        });
        Storage::set('uploads', $disk);

        $this->artisan('sca:uploads-test')
            ->expectsOutputToContain('revisa AWS_ENDPOINT')
            ->assertExitCode(1);
    }

    private function failingDisk(callable $expectations): FilesystemAdapter
    {
        /** @var FilesystemAdapter&MockInterface $mock */
        $mock = Mockery::mock(FilesystemAdapter::class);
        $expectations($mock);

        return $mock;
    }
}
