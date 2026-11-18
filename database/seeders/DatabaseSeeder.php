<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeds the demo data (order matters: foreign keys).
     */
    public function run(): void
    {
        $this->call([
            CatalogoSeeder::class,
            UsuarioSeeder::class,
            TramiteSeeder::class,
            TrazabilidadSeeder::class,
        ]);
    }
}
