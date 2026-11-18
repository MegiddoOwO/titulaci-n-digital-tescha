<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite(); // tests must not depend on a built frontend

        // Exported shell variables (for example CACHE_STORE=file) beat phpunit.xml. File-backed
        // cache would persist rate-limiter counters across runs and break the auth tests.
        config([
            'cache.default' => 'array',
            'session.driver' => 'array',
            'mail.default' => 'array',
        ]);
        $this->app['cache']->setDefaultDriver('array');

        // Safety net: tests must never touch the live `sca_tescha` database.
        $database = DB::connection()->getDatabaseName();

        if ($database !== 'sca_tescha_test') {
            throw new \RuntimeException(
                "Refusing to run tests against database [{$database}]; expected [sca_tescha_test]."
            );
        }
    }
}
