<?php

namespace App\Support;

/**
 * Resolves `documentos.archivo_url` to a path on the `uploads` disk.
 *
 * New uploads store `uploads/{tramite_id}/<file>`; legacy Express values are a bare file name
 * that lived in server/uploads and is expected at `uploads/<file>` after the cutover copy.
 */
final class StoredUploadPath
{
    public static function resolve(string $stored): ?string
    {
        if (str_contains($stored, '..') || str_starts_with($stored, '/')) {
            return null;
        }

        return str_contains($stored, '/') ? $stored : "uploads/{$stored}";
    }
}
