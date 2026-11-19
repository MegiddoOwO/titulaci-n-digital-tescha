<?php

namespace App\Console\Commands;

use App\Models\Documento;
use App\Support\StoredUploadPath;
use App\Support\Uploads;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Copies every file referenced by documentos.archivo_url from one disk to another (typically
 * local -> the configured `uploads` S3 disk). Read-only on the database; never deletes the source
 * unless --delete-source is given, and then only after the copy was verified by size.
 */
class ScaUploadsCopy extends Command
{
    protected $signature = 'sca:uploads-copy
        {--from=local : Source disk}
        {--to= : Destination disk (default: the configured uploads disk)}
        {--dry-run : Report what would happen without writing anything}
        {--delete-source : Delete each source file after a verified copy}';

    protected $description = 'Copy the uploaded expediente files between storage disks';

    public function handle(): int
    {
        $fromName = (string) $this->option('from');
        $toName = (string) ($this->option('to') ?: Uploads::DISK);
        $dry = (bool) $this->option('dry-run');
        $delete = (bool) $this->option('delete-source');

        if ($fromName === $toName) {
            $this->error('Source and destination disks are the same.');

            return self::FAILURE;
        }

        $from = Storage::disk($fromName);
        $to = Storage::disk($toName);
        $counts = ['copied' => 0, 'skipped' => 0, 'missing' => 0, 'failed' => 0];

        $paths = Documento::query()->whereNotNull('archivo_url')->pluck('archivo_url')
            ->map(fn ($stored) => StoredUploadPath::resolve((string) $stored))
            ->unique();

        foreach ($paths as $path) {
            if ($path === null) {
                $counts['failed']++;
                $this->warn('Skipped an unresolvable stored path.');

                continue;
            }

            try {
                if (! $from->exists($path)) {
                    $counts['missing']++;
                    $this->warn("missing: {$path}");

                    continue;
                }

                $size = $from->size($path);

                if ($to->exists($path) && $to->size($path) === $size) {
                    $counts['skipped']++;

                    continue;
                }

                if ($dry) {
                    $counts['copied']++;
                    $this->line("would copy: {$path}");

                    continue;
                }

                $stream = $from->readStream($path);
                $to->writeStream($path, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }

                if (! $to->exists($path) || $to->size($path) !== $size) {
                    $counts['failed']++;
                    $this->error("verification failed: {$path}");

                    continue;
                }

                $counts['copied']++;

                if ($delete) {
                    $from->delete($path);
                }
            } catch (Throwable $e) {
                $counts['failed']++;
                $this->error("failed: {$path} (".get_class($e).")");
            }
        }

        $this->info(sprintf(
            '%scopied=%d skipped=%d missing=%d failed=%d',
            $dry ? '[dry-run] ' : '',
            $counts['copied'], $counts['skipped'], $counts['missing'], $counts['failed'],
        ));

        return $counts['failed'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
