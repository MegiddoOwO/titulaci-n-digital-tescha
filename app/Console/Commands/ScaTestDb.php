<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Rebuilds (migrate:fresh --seed) the database the app is connected to, but
 * only when its name ends with `_test`. Use it as:
 *   DB_DATABASE=sca_tescha_test php artisan sca:test-db
 * It refuses any other database so the live data can never be wiped by it.
 */
class ScaTestDb extends Command
{
    protected $signature = 'sca:test-db';

    protected $description = 'Rebuild and seed the test database (refuses unless its name ends with _test)';

    public function handle(): int
    {
        $database = (string) DB::connection()->getDatabaseName();

        if (! str_ends_with($database, '_test')) {
            $this->error("Refusing to run: database [{$database}] does not end with _test.");

            return self::FAILURE;
        }

        $this->info("Rebuilding [{$database}]...");

        return $this->call('migrate:fresh', ['--seed' => true, '--force' => true, '--drop-views' => true]);
    }
}
