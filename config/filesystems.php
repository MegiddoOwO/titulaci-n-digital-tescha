<?php

$uploadsDisks = [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app/private'),
        'serve' => false,
        'throw' => true,
        'report' => false,
    ],
    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION') ?: 'us-east-1', // Cloudflare R2 uses 'auto'
        'bucket' => env('AWS_BUCKET'),
        'endpoint' => env('AWS_ENDPOINT') ?: null, // empty/unset means plain AWS S3
        'use_path_style_endpoint' => filter_var(env('AWS_USE_PATH_STYLE_ENDPOINT', false), FILTER_VALIDATE_BOOLEAN),
        // aws-sdk-php >= 3.337 sends CRC32 checksums by default, which some S3-compatible
        // services (R2, MinIO, B2...) reject or mishandle; send them only when the operation requires it.
        'request_checksum_calculation' => env('AWS_REQUEST_CHECKSUM_CALCULATION', 'when_required'),
        'response_checksum_validation' => env('AWS_RESPONSE_CHECKSUM_VALIDATION', 'when_required'),
        'visibility' => 'private',
        'throw' => true,
        'report' => false,
    ],
];

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        // Expediente uploads: UPLOADS_DISK=local (default, storage/app/private) or s3
        // (any S3-compatible service). Always private; served only through the app.
        'uploads' => $uploadsDisks[env('UPLOADS_DISK', 'local')] ?? $uploadsDisks['local'],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
