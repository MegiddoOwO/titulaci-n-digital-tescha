<?php

namespace App\Support;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Detects uploads rejected by PHP itself (upload_max_filesize / post_max_size), which otherwise
 * surface as a generic "no file received" error.
 */
class ServerUploadLimit
{
    /** Parse a php.ini shorthand size ("2M", "1G", "512K") into bytes. */
    public static function toBytes(string|false|null $value): int
    {
        $value = trim((string) $value);

        if ($value === '' || $value === '-1') {
            return PHP_INT_MAX;
        }

        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }

    /** The human message when the request exceeded a server limit, otherwise null. */
    public static function violation(Request $request, string $field = 'archivo'): ?string
    {
        $file = $request->file($field);

        if ($file instanceof UploadedFile
            && in_array($file->getError(), [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            return self::message(self::toBytes(ini_get('upload_max_filesize')));
        }

        // An oversized POST body arrives with empty $_POST/$_FILES, so only the length gives it away.
        $postMax = self::toBytes(ini_get('post_max_size'));
        $length = (int) $request->server('CONTENT_LENGTH', 0);

        if ($file === null && $postMax !== PHP_INT_MAX && $length > $postMax) {
            return self::message($postMax);
        }

        return null;
    }

    public static function message(int $bytes): string
    {
        $mb = rtrim(rtrim(number_format($bytes / 1024 ** 2, 1, '.', ''), '0'), '.');

        return "El archivo excede el tamaño máximo permitido por el servidor ({$mb} MB).";
    }
}
