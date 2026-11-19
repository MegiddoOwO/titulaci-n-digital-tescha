<?php

namespace App\Support;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

/** Single place that names the disk holding expediente uploads (see config/filesystems.php). */
final class Uploads
{
    public const DISK = 'uploads';

    public static function disk(): FilesystemAdapter
    {
        return Storage::disk(self::DISK);
    }
}
