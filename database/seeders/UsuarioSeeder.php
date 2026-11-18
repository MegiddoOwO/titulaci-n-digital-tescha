<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo users (password for all: Demo1234!, hashes copied verbatim).
 * Mirrors the legacy database/seed.sql (same ids and values).
 */
class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('usuarios')->insertOrIgnore([
            ['id' => 1, 'numero_control' => '2021-0001', 'email' => '2021-0001@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Ian Alexis', 'apellido_paterno' => 'Flores', 'apellido_materno' => 'Martinez', 'rol' => 'estudiante', 'grado_academico' => null, 'carga_maxima' => null],
            ['id' => 2, 'numero_control' => '2021-0002', 'email' => '2021-0002@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Juan Esteban', 'apellido_paterno' => 'Anzures', 'apellido_materno' => 'Campos', 'rol' => 'estudiante', 'grado_academico' => null, 'carga_maxima' => null],
            ['id' => 3, 'numero_control' => '2021-0003', 'email' => '2021-0003@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Miguel Ángel', 'apellido_paterno' => 'Jurado', 'apellido_materno' => 'Delgadillo', 'rol' => 'estudiante', 'grado_academico' => null, 'carga_maxima' => null],
            ['id' => 4, 'numero_control' => '2021-0004', 'email' => '2021-0004@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Juan Fernando', 'apellido_paterno' => 'Reyes', 'apellido_materno' => 'Arguello', 'rol' => 'estudiante', 'grado_academico' => null, 'carga_maxima' => null],
            ['id' => 5, 'numero_control' => '2021-0005', 'email' => '2021-0005@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Brayan Uriel', 'apellido_paterno' => 'Villegas', 'apellido_materno' => 'Raymundo', 'rol' => 'estudiante', 'grado_academico' => null, 'carga_maxima' => null],
            ['id' => 10, 'numero_control' => 'DOC-0001', 'email' => 'niza.alpizar@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Niza Lucero', 'apellido_paterno' => 'Alpízar', 'apellido_materno' => 'Martínez', 'rol' => 'asesor', 'grado_academico' => 'Mtra.', 'carga_maxima' => 5],
            ['id' => 11, 'numero_control' => 'DOC-0002', 'email' => 'javier.garcia@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Javier', 'apellido_paterno' => 'García', 'apellido_materno' => 'Hernández', 'rol' => 'asesor', 'grado_academico' => 'Dr.', 'carga_maxima' => 5],
            ['id' => 12, 'numero_control' => 'DOC-0003', 'email' => 'laura.ramirez@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Laura', 'apellido_paterno' => 'Ramírez', 'apellido_materno' => 'Soto', 'rol' => 'asesor', 'grado_academico' => 'Ing.', 'carga_maxima' => 5],
            ['id' => 13, 'numero_control' => 'DOC-0004', 'email' => 'carlos.mendoza@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Carlos', 'apellido_paterno' => 'Mendoza', 'apellido_materno' => 'López', 'rol' => 'asesor', 'grado_academico' => 'Mtro.', 'carga_maxima' => 5],
            ['id' => 14, 'numero_control' => 'DOC-0005', 'email' => 'patricia.diaz@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Patricia', 'apellido_paterno' => 'Díaz', 'apellido_materno' => 'Torres', 'rol' => 'asesor', 'grado_academico' => 'Dra.', 'carga_maxima' => 5],
            ['id' => 15, 'numero_control' => 'DOC-0006', 'email' => 'roberto.sanchez@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Roberto', 'apellido_paterno' => 'Sánchez', 'apellido_materno' => 'Ruiz', 'rol' => 'asesor', 'grado_academico' => 'Mtro.', 'carga_maxima' => 5],
            ['id' => 20, 'numero_control' => 'ADM-0001', 'email' => 'admin.titulacion@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'Ricardo', 'apellido_paterno' => 'López', 'apellido_materno' => 'García', 'rol' => 'administrativo', 'grado_academico' => null, 'carga_maxima' => null],
            ['id' => 21, 'numero_control' => 'ADM-0002', 'email' => 'control.escolar@tescha.edu.mx', 'password_hash' => '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe', 'nombre' => 'María Elena', 'apellido_paterno' => 'González', 'apellido_materno' => 'Vázquez', 'rol' => 'administrativo', 'grado_academico' => null, 'carga_maxima' => null],
        ]);
    }
}
