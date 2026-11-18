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

        // Safety net: tests must never touch the live `sca_tescha` database.
        $database = DB::connection()->getDatabaseName();

        if ($database !== 'sca_tescha_test') {
            throw new \RuntimeException(
                "Refusing to run tests against database [{$database}]; expected [sca_tescha_test]."
            );
        }
    }
}
