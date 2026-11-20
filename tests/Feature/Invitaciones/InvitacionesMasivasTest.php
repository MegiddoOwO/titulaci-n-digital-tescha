<?php

namespace Tests\Feature\Invitaciones;

use App\Models\Bitacora;
use App\Models\Invitacion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Tests\TestCase;

class InvitacionesMasivasTest extends TestCase
{
    use DatabaseTransactions;

    private const HEADER = 'numero_control,correo,nombre,apellido_paterno,apellido_materno,rol,opcion_titulacion,asesor,grado_academico';

    /** @var array<int, string> */
    private array $tmp = [];

    protected function tearDown(): void
    {
        foreach ($this->tmp as $file) {
            @unlink($file);
        }
        parent::tearDown();
    }

    /** A temp .xlsx path removed in tearDown (the extensionless tempnam file is renamed, not leaked). */
    private function tmpXlsx(): string
    {
        $base = tempnam(sys_get_temp_dir(), 'inv-test-');
        $path = $base.'.xlsx';
        rename($base, $path);

        return $this->tmp[] = $path;
    }

    /** Copies the downloaded template aside and deletes the server's temp file (never sent in tests). */
    private function keepDownload($response): string
    {
        $original = $response->baseResponse->getFile()->getPathname();
        $copy = $this->tmpXlsx();
        copy($original, $copy);
        $this->tmp[] = $original;

        return $copy;
    }

    private function admin(): Usuario
    {
        return Usuario::where('numero_control', 'ADM-0001')->firstOrFail();
    }

    private function csv(array $lines, string $name = 'invitaciones.csv', string $prefix = ''): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $prefix.implode("\n", $lines)."\n");
    }

    /** @param  array<int, array<int, mixed>>  $rows */
    private function xlsx(array $rows, string $name = 'invitaciones.xlsx'): UploadedFile
    {
        $path = $this->tmpXlsx();
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->getCurrentSheet()->setName('Invitaciones');
        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();

        return UploadedFile::fake()->createWithContent($name, (string) file_get_contents($path));
    }

    private function validar(UploadedFile $file)
    {
        return $this->actingAs($this->admin())->post('/admin/invitaciones/masiva/validar', ['archivo' => $file], ['Accept' => 'application/json']);
    }

    private function crear(UploadedFile $file, array $extra = [])
    {
        return $this->actingAs($this->admin())->post('/admin/invitaciones/masiva/crear', ['archivo' => $file] + $extra, ['Accept' => 'application/json']);
    }

    /** @return array<string, int> */
    private function counts(): array
    {
        return [
            'invitaciones' => DB::table('invitaciones')->count(),
            'usuarios' => DB::table('usuarios')->count(),
            'bitacora' => DB::table('bitacora')->count(),
        ];
    }

    private function good(int $n = 1): array
    {
        return [
            "2050-000{$n},2050-000{$n}@tescha.edu.mx,Alumno {$n},Prueba,Uno,estudiante,Tesis,,",
        ];
    }

    private function errorFor($response, int $linea, string $campo): ?string
    {
        foreach ($response->json('errores') as $e) {
            if ($e['linea'] === $linea && $e['campo'] === $campo) {
                return $e['mensaje'];
            }
        }

        return null;
    }

    // ------------------------------------------------------------- templates

    public function test_csv_template_has_bom_and_exact_header(): void
    {
        $response = $this->actingAs($this->admin())->get('/admin/invitaciones/plantilla.csv')->assertOk();

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('plantilla-invitaciones.csv', $response->headers->get('Content-Disposition'));
        $this->assertSame("\xEF\xBB\xBF".self::HEADER."\n", $response->getContent());
    }

    public function test_xlsx_template_has_three_sheets_and_current_catalogs(): void
    {
        $response = $this->actingAs($this->admin())->get('/admin/invitaciones/plantilla.xlsx')->assertOk();
        $this->assertInstanceOf(BinaryFileResponse::class, $response->baseResponse);
        $this->assertStringContainsString('plantilla-invitaciones.xlsx', $response->headers->get('Content-Disposition'));

        $copy = $this->keepDownload($response);

        $reader = new Reader;
        $reader->open($copy);
        $sheets = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            $sheets[$sheet->getName()] = array_map(fn ($r) => $r->toArray(), iterator_to_array($sheet->getRowIterator(), false));
        }
        $reader->close();

        $this->assertSame(['Invitaciones', 'Instrucciones', 'Catálogos'], array_keys($sheets));
        $this->assertSame([explode(',', self::HEADER)], $sheets['Invitaciones']);

        $catalogos = json_encode($sheets['Catálogos'], JSON_UNESCAPED_UNICODE);
        $this->assertStringContainsString('Residencias Profesionales', $catalogos);
        $this->assertStringContainsString('DOC-0001', $catalogos);
        $this->assertMatchesRegularExpression('#\d+ \\\\?/ 5#', $catalogos);
    }

    // ---------------------------------------------------------------- parsing

    public function test_parses_comma_and_semicolon_delimiters_bom_and_aliases(): void
    {
        $comma = $this->validar($this->csv([self::HEADER, ...$this->good(1)]))->assertOk();
        $this->assertSame(1, $comma->json('validas'));

        $semi = $this->validar($this->csv([
            'Matrícula;Email;Nombre;Apellido Paterno;Rol;Opción de titulación',
            '2050-0002;a2@tescha.edu.mx;Ana;López;Estudiante;  residencias   PROFESIONALES ',
        ], 'a.csv', "\xEF\xBB\xBF"))->assertOk();
        $this->assertSame(1, $semi->json('validas'));
        $this->assertSame('2050-0002', $semi->json('filas_validas.0.numero_control'));
        $this->assertSame(2, $semi->json('filas_validas.0.opcion_titulacion_id'));
    }

    public function test_parses_windows_1252_csv(): void
    {
        $content = mb_convert_encoding(
            self::HEADER."\n".'2050-0003,a3@tescha.edu.mx,José Ángel,Peña,,estudiante,Créditos de Posgrado,,'."\n",
            'Windows-1252', 'UTF-8',
        );
        $response = $this->validar(UploadedFile::fake()->createWithContent('viejo.csv', $content))->assertOk();

        $this->assertSame(1, $response->json('validas'));
        $this->assertSame('José Ángel Peña', $response->json('filas_validas.0.nombre'));
        $this->assertSame(5, $response->json('filas_validas.0.opcion_titulacion_id'));
    }

    public function test_xlsx_keeps_numeric_looking_control_numbers_as_text(): void
    {
        $response = $this->validar($this->xlsx([
            explode(',', self::HEADER),
            [202324054, 'num@tescha.edu.mx', 'Num', 'Eral', null, 'estudiante', 'Tesis', null, null],
            ['00123', 'ceros@tescha.edu.mx', 'Ceros', 'Izq', null, 'estudiante', 'Tesis', null, null],
            [20232405412345.0, 'big@tescha.edu.mx', 'Big', 'Num', null, 'administrativo', null, null, null],
        ]))->assertOk();

        $this->assertSame(3, $response->json('validas'));
        $this->assertSame(['202324054', '00123', '20232405412345'], array_column($response->json('filas_validas'), 'numero_control'));
    }

    public function test_skips_empty_rows_but_keeps_file_line_numbers(): void
    {
        $response = $this->validar($this->csv([
            self::HEADER, '', ',,,,,,,,', '2050-0004,,Sin,Correo,,estudiante,Tesis,,',
        ]))->assertOk();

        $this->assertSame(1, $response->json('total'));
        $this->assertNotNull($this->errorFor($response, 4, 'correo'));
    }

    // ------------------------------------------------------------- file errors

    public function test_file_level_errors(): void
    {
        $this->validar($this->csv(['numero_control,correo,nombre', '1,a@b.mx,A']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('archivo')
            ->assertJsonPath('errors.archivo.0', 'Faltan columnas obligatorias: apellido_paterno, rol.');

        $this->validar($this->csv([self::HEADER]))->assertStatus(422)->assertJsonValidationErrors('archivo');

        $this->validar(UploadedFile::fake()->createWithContent('a.txt', 'x'))->assertStatus(422)->assertJsonValidationErrors('archivo');
        $this->validar(UploadedFile::fake()->createWithContent('a.xlsx', 'not a zip'))->assertStatus(422)->assertJsonValidationErrors('archivo');
        $this->actingAs($this->admin())->postJson('/admin/invitaciones/masiva/validar', [])->assertStatus(422)->assertJsonValidationErrors('archivo');

        $big = UploadedFile::fake()->createWithContent('big.csv', self::HEADER."\n".str_repeat('x', 3 * 1024 * 1024));
        $this->validar($big)->assertStatus(422)->assertJsonValidationErrors('archivo');
    }

    public function test_rejects_more_rows_than_the_limit(): void
    {
        config(['auth.invitations.bulk_max_rows' => 3]);
        $lines = [self::HEADER];
        for ($i = 1; $i <= 4; $i++) {
            $lines[] = "2060-000{$i},m{$i}@tescha.edu.mx,N,P,,administrativo,,,";
        }

        $this->validar($this->csv($lines))->assertStatus(422)->assertJsonValidationErrors('archivo');
        $this->crear($this->csv($lines))->assertStatus(422);
    }

    // ------------------------------------------------------------- row errors

    public function test_row_errors_per_kind(): void
    {
        $asesorActivo = 'DOC-0001';
        Usuario::where('numero_control', 'DOC-0004')->update(['activo' => 0]);
        $pending = Invitacion::create([
            'token_hash' => hash('sha256', 'x'), 'numero_control' => '2070-0009', 'email' => 'pend@tescha.edu.mx',
            'nombre' => 'P', 'apellido_paterno' => 'P', 'rol' => 'administrativo',
            'creada_por' => $this->admin()->id, 'expira_en' => now()->addDay(),
        ]);

        $response = $this->validar($this->csv([
            self::HEADER,
            ',,,,,,,,',                                                                  // 2: blank (skipped)
            '2070-0001,,Sin,Correo,,estudiante,Tesis,,',                                 // 3: missing correo
            '2070-0002,no-es-correo,A,B,,estudiante,Tesis,,',                            // 4: bad email
            '2070-0003,c3@tescha.edu.mx,A,B,,jefe,Tesis,,',                              // 5: bad rol
            '2070-0004,c4@tescha.edu.mx,A,B,,estudiante,Inventada,,',                    // 6: unknown opción
            '2070-0005,c5@tescha.edu.mx,A,B,,estudiante,,,',                             // 7: opción required
            '2070-0006,c6@tescha.edu.mx,A,B,,estudiante,Tesis,NOPE-1,',                  // 8: unknown asesor
            '2070-0007,c7@tescha.edu.mx,A,B,,estudiante,Tesis,DOC-0004,',                // 9: inactive asesor
            '2070-0008,c8@tescha.edu.mx,A,B,,administrativo,,,',                         // 10: ok
            '2070-0008,c9@tescha.edu.mx,A,B,,administrativo,,,',                         // 11: dup control
            '2070-0010,c8@tescha.edu.mx,A,B,,administrativo,,,',                         // 12: dup email
            '2021-0001,c11@tescha.edu.mx,A,B,,administrativo,,,',                        // 13: existing user control
            '2070-0011,admin.titulacion@tescha.edu.mx,A,B,,administrativo,,,',           // 14: existing user email
            '2070-0009,c12@tescha.edu.mx,A,B,,administrativo,,,',                        // 15: pending control
            '2070-0012,pend@tescha.edu.mx,A,B,,administrativo,,,',                       // 16: pending email
            '2070-0013,'.str_repeat('a', 130).'@tescha.edu.mx,A,B,,administrativo,,,',   // 17: too long
            "2070-0014,c14@tescha.edu.mx,A,B,,estudiante,Tesis,{$asesorActivo},",        // 18: ok
        ]))->assertOk();

        $this->assertSame(16, $response->json('total'));
        $this->assertSame(2, $response->json('validas'));
        $this->assertSame([10, 18], array_column($response->json('filas_validas'), 'linea'));

        $this->assertNotNull($this->errorFor($response, 3, 'correo'));
        $this->assertSame('El correo no es válido.', $this->errorFor($response, 4, 'correo'));
        $this->assertStringContainsString('Rol inválido', $this->errorFor($response, 5, 'rol'));
        $this->assertSame('Opción de titulación no encontrada: Inventada', $this->errorFor($response, 6, 'opcion_titulacion'));
        $this->assertNotNull($this->errorFor($response, 7, 'opcion_titulacion'));
        $this->assertStringContainsString('NOPE-1', $this->errorFor($response, 8, 'asesor'));
        $this->assertStringContainsString('inactivo', $this->errorFor($response, 9, 'asesor'));
        $this->assertStringContainsString('fila 10', $this->errorFor($response, 11, 'numero_control'));
        $this->assertStringContainsString('fila 10', $this->errorFor($response, 12, 'correo'));
        $this->assertSame('Ya existe un usuario con ese número de control.', $this->errorFor($response, 13, 'numero_control'));
        $this->assertSame('Ya existe un usuario con ese email.', $this->errorFor($response, 14, 'correo'));
        $this->assertSame('Ya hay una invitación pendiente para ese número de control.', $this->errorFor($response, 15, 'numero_control'));
        $this->assertSame('Ya hay una invitación pendiente para ese correo.', $this->errorFor($response, 16, 'correo'));
        $this->assertStringContainsString('longitud', $this->errorFor($response, 17, 'correo'));
        $this->assertNotNull($pending->id);
    }

    public function test_asesor_load_counts_earlier_valid_rows_of_the_same_file(): void
    {
        $asesor = DB::table('vw_carga_docente')->where('numero_control', 'DOC-0002')->first();
        Usuario::where('id', $asesor->docente_id)->update(['carga_maxima' => $asesor->carga_actual + 2]);

        $response = $this->validar($this->csv([
            self::HEADER,
            '2080-0001,l1@tescha.edu.mx,A,B,,estudiante,Tesis,DOC-0002,',
            '2080-0002,l2@tescha.edu.mx,A,B,,estudiante,Tesis,doc-0002,',
            '2080-0003,l3@tescha.edu.mx,A,B,,estudiante,Tesis,DOC-0002,',
            '2080-0004,l4@tescha.edu.mx,A,B,,estudiante,Tesis,,',
        ]))->assertOk();

        $this->assertSame(3, $response->json('validas'));
        $this->assertStringContainsString('carga máxima', $this->errorFor($response, 4, 'asesor'));
        $this->assertSame([2, 3, 5], array_column($response->json('filas_validas'), 'linea'));
    }

    public function test_asesor_and_grado_columns_are_ignored_for_other_roles(): void
    {
        $response = $this->validar($this->csv([
            self::HEADER,
            '2090-0001,r1@tescha.edu.mx,A,B,,administrativo,Tesis,NOPE-1,Dr.',
            '2090-0002,r2@tescha.edu.mx,A,B,,asesor,Tesis,NOPE-1,Dr.',
            '2090-0003,r3@tescha.edu.mx,A,B,,estudiante,Tesis,,Dr.',
        ]))->assertOk();

        $this->assertSame(3, $response->json('validas'));
        $this->assertSame([null, 'Dr.', null], array_column($response->json('filas_validas'), 'grado_academico'));
        $this->assertSame([null, null, 1], array_column($response->json('filas_validas'), 'opcion_titulacion_id'));
    }

    // ----------------------------------------------------------------- writes

    public function test_validate_writes_nothing(): void
    {
        Mail::fake();
        $before = $this->counts();

        $this->validar($this->csv([self::HEADER, ...$this->good(1), '2050-0002,bad,A,B,,estudiante,Tesis,,']))->assertOk();

        $this->assertSame($before, $this->counts());
        Mail::assertNothingSent();
    }

    public function test_create_all_valid_goes_through_the_existing_flow(): void
    {
        Mail::fake();
        Log::spy();
        $before = $this->counts();

        $response = $this->crear($this->csv([
            self::HEADER,
            '2100-0001,b1@tescha.edu.mx,Uno,Prueba,,estudiante,Tesis,DOC-0001,',
            '2100-0002,b2@tescha.edu.mx,Dos,Prueba,,asesor,,,Mtra.',
            '2100-0003,b3@tescha.edu.mx,Tres,Prueba,,administrativo,,,',
        ]))->assertCreated();

        $this->assertSame(3, $response->json('creadas'));
        $this->assertSame(0, $response->json('omitidas'));
        $this->assertSame(['enviado', 'enviado', 'enviado'], array_map(
            fn ($r) => $r['correo_estado'] === 'no_configurado' ? 'enviado' : $r['correo_estado'],
            $response->json('resultados'),
        ));
        $this->assertSame([2, 3, 4], array_column($response->json('resultados'), 'linea'));

        $after = $this->counts();
        $this->assertSame($before['invitaciones'] + 3, $after['invitaciones']);
        $this->assertSame($before['usuarios'], $after['usuarios']);
        $this->assertSame($before['bitacora'] + 4, $after['bitacora']); // 3 rows + 1 summary
        Mail::assertSentCount(3);

        foreach ($response->json('resultados') as $r) {
            $token = basename($r['link']);
            $this->assertSame(64, strlen($token));
            $inv = Invitacion::findOrFail($r['id']);
            $this->assertSame(hash('sha256', $token), $inv->token_hash);
            // The plain token is nowhere in the DB (rows or audit log).
            $this->assertSame(0, DB::table('invitaciones')->where('token_hash', $token)->count());
            $this->assertSame(0, DB::table('bitacora')->where('detalle', 'like', "%{$token}%")->count());
        }

        $summary = Bitacora::where('accion', 'invitaciones_carga_masiva')->latest('id')->firstOrFail();
        $this->assertSame(3, $summary->detalle['creadas']);
        $this->assertSame(3, $summary->detalle['filas_leidas']);
        $this->assertStringNotContainsString('http', json_encode($summary->detalle));
        $this->assertSame(3, Bitacora::where('accion', 'invitacion_creada')->whereIn('entidad_id', array_column($response->json('resultados'), 'id'))->count());

        Log::shouldNotHaveReceived('info');
        $asesor = Invitacion::where('numero_control', '2100-0002')->firstOrFail();
        $this->assertSame('Mtra.', $asesor->grado_academico);
    }

    public function test_create_with_errors_and_no_skip_creates_nothing(): void
    {
        Mail::fake();
        $before = $this->counts();

        $this->crear($this->csv([self::HEADER, ...$this->good(1), '2050-0002,bad,A,B,,estudiante,Tesis,,']))
            ->assertStatus(422)
            ->assertJsonPath('con_error', 1)
            ->assertJsonPath('validas', 1);

        $this->assertSame($before, $this->counts());
        Mail::assertNothingSent();
    }

    public function test_create_with_skip_creates_valid_rows_and_reports_skipped(): void
    {
        Mail::fake();
        $before = $this->counts();

        $response = $this->crear($this->csv([
            self::HEADER, ...$this->good(1), '2050-0002,bad,A,B,,estudiante,Tesis,,', ...$this->good(3),
        ]), ['omitir_errores' => true])->assertCreated();

        $this->assertSame(2, $response->json('creadas'));
        $this->assertSame(1, $response->json('omitidas'));
        $this->assertSame(3, $response->json('errores.0.linea'));
        $this->assertSame($before['invitaciones'] + 2, $this->counts()['invitaciones']);
        $this->assertSame(1, Bitacora::where('accion', 'invitaciones_carga_masiva')->count());
        $summary = Bitacora::where('accion', 'invitaciones_carga_masiva')->firstOrFail();
        $this->assertSame(1, $summary->detalle['omitidas']);

        // No valid rows at all: 422 even with omitir_errores.
        $this->crear($this->csv([self::HEADER, '2050-0002,bad,A,B,,estudiante,Tesis,,']), ['omitir_errores' => true])->assertStatus(422);
    }

    public function test_create_revalidates_state_changes_made_after_validate(): void
    {
        Mail::fake();
        $file = fn () => $this->csv([self::HEADER, ...$this->good(1), ...$this->good(2)]);

        $this->validar($file())->assertOk()->assertJsonPath('validas', 2);

        // Between the two steps somebody else invites the first person.
        Invitacion::create([
            'token_hash' => hash('sha256', 'y'), 'numero_control' => '2050-0001', 'email' => 'otro@tescha.edu.mx',
            'nombre' => 'O', 'apellido_paterno' => 'O', 'rol' => 'administrativo',
            'creada_por' => $this->admin()->id, 'expira_en' => now()->addDay(),
        ]);

        $this->crear($file())->assertStatus(422)->assertJsonPath('con_error', 1);

        $response = $this->crear($file(), ['omitir_errores' => true])->assertCreated();
        $this->assertSame(1, $response->json('creadas'));
        $this->assertSame('2050-0002', $response->json('resultados.0.numero_control'));
    }

    public function test_a_mail_failure_on_one_row_does_not_stop_the_rest(): void
    {
        $calls = 0;
        Mail::shouldReceive('to')->andReturnUsing(function () use (&$calls) {
            $calls++;
            $pending = \Mockery::mock();
            $pending->shouldReceive('send')->andReturnUsing(function () use ($calls) {
                if ($calls === 2) {
                    throw new \RuntimeException('smtp down for someone@example.com');
                }
            });

            return $pending;
        });

        $response = $this->crear($this->csv([
            self::HEADER, ...$this->good(1), ...$this->good(2), ...$this->good(3),
        ]))->assertCreated();

        $this->assertSame(3, $response->json('creadas'));
        $estados = array_column($response->json('resultados'), 'correo_estado');
        $this->assertSame('fallido', $estados[1]);
        $this->assertNotSame('fallido', $estados[0]);
        $this->assertNotSame('fallido', $estados[2]);

        $summary = Bitacora::where('accion', 'invitaciones_carga_masiva')->firstOrFail();
        $this->assertSame(1, $summary->detalle['correo']['fallido']);
    }

    public function test_xlsx_upload_creates_invitations(): void
    {
        Mail::fake();

        $response = $this->crear($this->xlsx([
            explode(',', self::HEADER),
            [202324054, 'x1@tescha.edu.mx', 'Xlsx', 'Uno', null, 'estudiante', 'Tesis', null, null],
        ]))->assertCreated();

        $this->assertSame(1, $response->json('creadas'));
        $this->assertSame('202324054', $response->json('resultados.0.numero_control'));
    }

    // ------------------------------------------------------- round trip & authz

    public function test_downloaded_xlsx_template_can_be_filled_and_reuploaded(): void
    {
        $response = $this->actingAs($this->admin())->get('/admin/invitaciones/plantilla.xlsx')->assertOk();
        // The template header row must parse back with the same reader (missing data rows -> clear 422).
        $copy = $this->keepDownload($response);

        $this->validar(UploadedFile::fake()->createWithContent('plantilla.xlsx', (string) file_get_contents($copy)))
            ->assertStatus(422)
            ->assertJsonPath('errors.archivo.0', 'El archivo no contiene filas de datos.');
    }

    public function test_only_administrativo_can_use_the_routes(): void
    {
        $routes = [
            ['get', '/admin/invitaciones/plantilla.xlsx'],
            ['get', '/admin/invitaciones/plantilla.csv'],
            ['post', '/admin/invitaciones/masiva/validar'],
            ['post', '/admin/invitaciones/masiva/crear'],
        ];

        foreach ($routes as [$method, $url]) {
            $this->post('/logout');
            $this->$method($url)->assertRedirect('/login');
            foreach (['2021-0001', 'DOC-0001'] as $nc) {
                $this->actingAs(Usuario::where('numero_control', $nc)->firstOrFail())
                    ->$method($url, [], ['Accept' => 'application/json'])->assertForbidden();
            }
        }
    }

    public function test_bulk_throttle_has_its_own_bucket(): void
    {
        $admin = $this->admin();
        $empty = fn () => UploadedFile::fake()->createWithContent('a.csv', self::HEADER."\n");

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($admin)->post('/admin/invitaciones/masiva/validar', ['archivo' => $empty()], ['Accept' => 'application/json']);
        }
        $this->actingAs($admin)->post('/admin/invitaciones/masiva/validar', ['archivo' => $empty()], ['Accept' => 'application/json'])
            ->assertStatus(429);

        // The single-invitation form and the template are unaffected.
        $this->actingAs($admin)->get('/admin/invitaciones/plantilla.csv')->assertOk();
        $this->actingAs($admin)->postJson('/admin/invitaciones', ['numero_control' => ''])->assertStatus(422);
    }
}
