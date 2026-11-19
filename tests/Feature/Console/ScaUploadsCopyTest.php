<?php

namespace Tests\Feature\Console;

use App\Models\Documento;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ScaUploadsCopyTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('src');
        Storage::fake('dst');
        Documento::query()->update(['archivo_url' => null]);

        $ids = Documento::where('tramite_id', 1)->pluck('id')->all();
        Documento::whereKey($ids[0])->update(['archivo_url' => 'uploads/1/a.pdf']);
        Documento::whereKey($ids[1])->update(['archivo_url' => 'legacy_b.pdf']);
        Documento::whereKey($ids[2])->update(['archivo_url' => 'uploads/1/gone.pdf']);
    }

    private function seedSource(): void
    {
        Storage::disk('src')->put('uploads/1/a.pdf', 'AAA');
        Storage::disk('src')->put('uploads/legacy_b.pdf', 'BB');
    }

    private function run_(array $extra = []): \Illuminate\Testing\PendingCommand
    {
        return $this->artisan('sca:uploads-copy', ['--from' => 'src', '--to' => 'dst'] + $extra);
    }

    public function test_copies_files_and_reports_missing(): void
    {
        $this->seedSource();

        $this->run_()->expectsOutputToContain('copied=2 skipped=0 missing=1 failed=0')->assertExitCode(0);

        Storage::disk('dst')->assertExists('uploads/1/a.pdf');
        $this->assertSame('BB', Storage::disk('dst')->get('uploads/legacy_b.pdf'));
        Storage::disk('src')->assertExists('uploads/1/a.pdf');
    }

    public function test_skips_files_already_present_with_same_size(): void
    {
        $this->seedSource();
        Storage::disk('dst')->put('uploads/1/a.pdf', 'AAA');

        $this->run_()->expectsOutputToContain('copied=1 skipped=1 missing=1 failed=0')->assertExitCode(0);
    }

    public function test_dry_run_writes_nothing(): void
    {
        $this->seedSource();

        $this->run_(['--dry-run' => true, '--delete-source' => true])
            ->expectsOutputToContain('[dry-run] copied=2')->assertExitCode(0);

        $this->assertSame([], Storage::disk('dst')->allFiles());
        Storage::disk('src')->assertExists('uploads/1/a.pdf');
    }

    public function test_delete_source_only_after_verified_copy(): void
    {
        $this->seedSource();

        $this->run_(['--delete-source' => true])->assertExitCode(0);

        Storage::disk('src')->assertMissing('uploads/1/a.pdf');
        Storage::disk('src')->assertMissing('uploads/legacy_b.pdf');
        Storage::disk('dst')->assertExists('uploads/1/a.pdf');
    }

    public function test_failure_keeps_source_and_exits_1(): void
    {
        $this->seedSource();
        // Destination whose write always fails.
        $broken = \Mockery::mock(\Illuminate\Filesystem\FilesystemAdapter::class);
        $broken->shouldReceive('exists')->andReturn(false);
        $broken->shouldReceive('writeStream')->andThrow(new \RuntimeException('boom'));
        Storage::set('dst', $broken);

        $this->run_(['--delete-source' => true])
            ->expectsOutputToContain('failed=2')->assertExitCode(1);

        Storage::disk('src')->assertExists('uploads/1/a.pdf');
        Storage::disk('src')->assertExists('uploads/legacy_b.pdf');
    }

    public function test_same_disk_is_rejected(): void
    {
        $this->artisan('sca:uploads-copy', ['--from' => 'src', '--to' => 'src'])->assertExitCode(1);
    }
}
