<?php

namespace App\Services\Admin;

use App\Actions\Admin\CreateAsignacion;
use App\Actions\Invitaciones\CreateInvitacion;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Support\Spreadsheet\SpreadsheetReader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Throwable;

/**
 * Bulk invitations from a spreadsheet: parse -> validate (no writes) -> create (one existing
 * CreateInvitacion call per valid row). Nothing is stashed server-side: every step starts from the
 * uploaded file, so create re-validates against the current database state.
 */
class InvitacionMasivaService
{
    /** Canonical column order of the template. */
    public const COLUMNS = [
        'numero_control', 'correo', 'nombre', 'apellido_paterno', 'apellido_materno',
        'rol', 'opcion_titulacion', 'asesor', 'grado_academico',
    ];

    public const REQUIRED_COLUMNS = ['numero_control', 'correo', 'nombre', 'apellido_paterno', 'rol'];

    /** Normalized header (lowercase, ascii, underscores) => canonical column. */
    private const ALIASES = [
        'numero_control' => 'numero_control', 'matricula' => 'numero_control',
        'numero_de_control' => 'numero_control', 'no_control' => 'numero_control',
        'correo' => 'correo', 'email' => 'correo', 'correo_electronico' => 'correo',
        'nombre' => 'nombre', 'nombres' => 'nombre',
        'apellido_paterno' => 'apellido_paterno',
        'apellido_materno' => 'apellido_materno',
        'rol' => 'rol',
        'opcion_titulacion' => 'opcion_titulacion', 'opcion_de_titulacion' => 'opcion_titulacion',
        'opcion' => 'opcion_titulacion',
        'asesor' => 'asesor', 'asesor_numero_de_control' => 'asesor', 'asesor_numero_control' => 'asesor',
        'grado_academico' => 'grado_academico',
    ];

    public const MAX_FILE_KB = 2048;

    public function __construct(
        private readonly SpreadsheetReader $reader,
        private readonly CreateInvitacion $createInvitacion,
        private readonly CreateAsignacion $asignaciones,
        private readonly BitacoraService $bitacora,
    ) {}

    public static function maxRows(): int
    {
        return max(1, (int) config('auth.invitations.bulk_max_rows', 50));
    }

    // ------------------------------------------------------------------ parse

    /**
     * @return array<int, array{linea: int, datos: array<string, string>}> non-empty data rows
     *
     * @throws ValidationException on unreadable file, missing columns or too many rows
     */
    public function parse(UploadedFile $file): array
    {
        $grid = $this->reader->read($file);

        $headerLine = array_key_first($grid);
        if ($headerLine === null) {
            throw ValidationException::withMessages(['archivo' => 'El archivo está vacío.']);
        }

        $map = []; // column index => canonical column
        foreach ($grid[$headerLine] as $index => $header) {
            $canonical = self::ALIASES[$this->headerKey($header)] ?? null;
            if ($canonical !== null && ! in_array($canonical, $map, true)) {
                $map[$index] = $canonical;
            }
        }

        $missing = array_values(array_diff(self::REQUIRED_COLUMNS, $map));
        if ($missing) {
            throw ValidationException::withMessages([
                'archivo' => 'Faltan columnas obligatorias: '.implode(', ', $missing).'.',
            ]);
        }

        $rows = [];
        foreach ($grid as $line => $cells) {
            if ($line === $headerLine) {
                continue;
            }
            $datos = array_fill_keys(self::COLUMNS, '');
            foreach ($map as $index => $column) {
                $datos[$column] = $this->clean($cells[$index] ?? '');
            }
            if (implode('', $datos) === '') {
                continue;
            }
            $datos['correo'] = mb_strtolower($datos['correo']);
            $rows[] = ['linea' => $line, 'datos' => $datos];
        }

        if (count($rows) > self::maxRows()) {
            throw ValidationException::withMessages([
                'archivo' => 'El archivo tiene '.count($rows).' filas; el máximo por carga es '.self::maxRows().'.',
            ]);
        }
        if ($rows === []) {
            throw ValidationException::withMessages(['archivo' => 'El archivo no contiene filas de datos.']);
        }

        return $rows;
    }

    private function headerKey(string $header): string
    {
        $ascii = Str::ascii(mb_strtolower($header));
        $ascii = preg_replace('/[^a-z0-9]+/', '_', $ascii) ?? $ascii;

        return trim($ascii, '_');
    }

    private function clean(string $value): string
    {
        $value = preg_replace('/[\s\x{00A0}\x{FEFF}]+/u', ' ', $value) ?? $value;

        return trim($value);
    }

    /** Lowercase, accent-free, single-spaced: the key for catalog and rol matching. */
    private function matchKey(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', Str::ascii(mb_strtolower($value))) ?? '');
    }

    // --------------------------------------------------------------- validate

    /**
     * @param  array<int, array{linea: int, datos: array<string, string>}>  $rows
     * @return array<int, array{linea: int, datos: array<string, string>, payload: ?array<string, mixed>, errores: array<int, array{campo: string, mensaje: string}>}>
     */
    public function validate(array $rows): array
    {
        $opciones = [];
        foreach (DB::table('opciones_titulacion')->where('activo', 1)->get(['id', 'nombre']) as $o) {
            $opciones[$this->matchKey($o->nombre)] = (int) $o->id;
        }
        $asesores = DB::table('vw_carga_docente')->get(['docente_id', 'numero_control'])
            ->keyBy(fn ($a) => mb_strtolower($a->numero_control));

        $firstControl = [];
        $firstEmail = [];
        $promised = []; // asesor id => students from earlier VALID rows of this file
        $result = [];

        foreach ($rows as ['linea' => $linea, 'datos' => $d]) {
            $errores = [];
            $add = function (string $campo, string $mensaje) use (&$errores) {
                $errores[] = ['campo' => $campo, 'mensaje' => $mensaje];
            };

            $rol = $this->matchKey($d['rol']);
            $esEstudiante = $rol === Usuario::ROL_ESTUDIANTE;
            $esAsesor = $rol === Usuario::ROL_ASESOR;

            $opcionId = null;
            $asesorId = null;

            $validator = Validator::make([
                'numero_control' => $d['numero_control'],
                'email' => $d['correo'],
                'nombre' => $d['nombre'],
                'apellido_paterno' => $d['apellido_paterno'],
                'apellido_materno' => $d['apellido_materno'] === '' ? null : $d['apellido_materno'],
                'rol' => $rol,
                'grado_academico' => $d['grado_academico'] === '' ? null : $d['grado_academico'],
            ], [
                'numero_control' => ['required', 'string', 'max:20'],
                'email' => ['required', 'string', 'email', 'max:120'],
                'nombre' => ['required', 'string', 'max:80'],
                'apellido_paterno' => ['required', 'string', 'max:80'],
                'apellido_materno' => ['nullable', 'string', 'max:80'],
                'rol' => ['required', 'in:estudiante,asesor,administrativo'],
                'grado_academico' => ['nullable', 'string', 'max:80'],
            ], [
                'required' => 'El campo es obligatorio.',
                'email' => 'El correo no es válido.',
                'max' => 'Excede la longitud permitida (:max caracteres).',
                'rol.in' => 'Rol inválido: usa estudiante, asesor o administrativo.',
            ]);

            $fieldNames = ['email' => 'correo'];
            foreach ($validator->errors()->messages() as $field => $messages) {
                $add($fieldNames[$field] ?? $field, $messages[0]);
            }

            if ($esEstudiante) {
                if ($d['opcion_titulacion'] === '') {
                    $add('opcion_titulacion', 'Elige la opción de titulación del estudiante.');
                } elseif (($opcionId = $opciones[$this->matchKey($d['opcion_titulacion'])] ?? null) === null) {
                    $add('opcion_titulacion', 'Opción de titulación no encontrada: '.$d['opcion_titulacion']);
                }

                if ($d['asesor'] !== '') {
                    $found = $asesores[mb_strtolower($d['asesor'])] ?? null;
                    if ($found === null) {
                        $add('asesor', 'Asesor no encontrado o inactivo: '.$d['asesor']);
                    } else {
                        $asesorId = (int) $found->docente_id;
                        try {
                            $this->asignaciones->assertWithinLoad($asesorId, $promised[$asesorId] ?? 0);
                        } catch (ValidationException $e) {
                            $add('asesor', 'El asesor '.$d['asesor'].' alcanzaría su carga máxima de asesorías con esta fila.');
                        }
                    }
                }
            }

            // Duplicates inside the file: the later row names the first one.
            $claim = function (array &$seen, string $campo, string $valor, string $label) use ($linea, $add) {
                if ($valor === '') {
                    return;
                }
                $key = mb_strtolower($valor);
                if (isset($seen[$key])) {
                    $add($campo, "Duplicado en el archivo: el {$label} ya aparece en la fila {$seen[$key]}.");
                } else {
                    $seen[$key] = $linea;
                }
            };
            $claim($firstControl, 'numero_control', $d['numero_control'], 'número de control');
            $claim($firstEmail, 'correo', $d['correo'], 'correo');

            // Existing users / pending invitations (same messages as the single flow).
            if ($d['numero_control'] !== '' && $d['correo'] !== '' && mb_strlen($d['numero_control']) <= 20 && mb_strlen($d['correo']) <= 120) {
                try {
                    CreateInvitacion::assertAvailable($d['numero_control'], $d['correo']);
                } catch (ValidationException $e) {
                    foreach ($e->errors() as $field => $messages) {
                        $add($field === 'email' ? 'correo' : $field, $messages[0]);
                    }
                }
            }

            // One message per field keeps the preview readable.
            $errores = collect($errores)->unique(fn ($e) => $e['campo'].'|'.$e['mensaje'])->values()->all();

            $payload = null;
            if ($errores === []) {
                $payload = [
                    'numero_control' => $d['numero_control'],
                    'email' => $d['correo'],
                    'nombre' => $d['nombre'],
                    'apellido_paterno' => $d['apellido_paterno'],
                    'apellido_materno' => $d['apellido_materno'] === '' ? null : $d['apellido_materno'],
                    'rol' => $rol,
                    'opcion_titulacion_id' => $esEstudiante ? $opcionId : null,
                    'asesor_id' => $esEstudiante ? $asesorId : null,
                    'grado_academico' => $esAsesor && $d['grado_academico'] !== '' ? $d['grado_academico'] : null,
                ];
                if ($asesorId !== null) {
                    $promised[$asesorId] = ($promised[$asesorId] ?? 0) + 1;
                }
            }

            $result[] = ['linea' => $linea, 'datos' => $d, 'payload' => $payload, 'errores' => $errores];
        }

        return $result;
    }

    // ----------------------------------------------------------------- create

    /**
     * @param  array<int, array{linea: int, payload: array<string, mixed>}>  $validRows  entries of validate() with a payload
     * @return array{resultados: array<int, array<string, mixed>>, errores: array<int, array{linea: int, campo: string, mensaje: string}>}
     */
    public function create(array $validRows, Usuario $admin, int $rowsRead = 0, int $skipped = 0): array
    {
        // Mail is synchronous, so a large file can outlive the default execution time.
        if (function_exists('set_time_limit')) {
            @set_time_limit(max(60, count($validRows) * 15));
        }

        $resultados = [];
        $errores = [];
        $mail = [];

        foreach ($validRows as ['linea' => $linea, 'payload' => $payload]) {
            try {
                ['invitacion' => $inv, 'link' => $link, 'correo' => $estado] = $this->createInvitacion->execute($payload, $admin);
            } catch (ValidationException $e) {
                foreach ($e->errors() as $field => $messages) {
                    $errores[] = ['linea' => $linea, 'campo' => $field === 'email' ? 'correo' : $field, 'mensaje' => $messages[0]];
                }

                continue;
            } catch (Throwable) {
                $errores[] = ['linea' => $linea, 'campo' => 'general', 'mensaje' => 'No se pudo crear la invitación.'];

                continue;
            }

            $mail[$estado] = ($mail[$estado] ?? 0) + 1;
            $resultados[] = [
                'linea' => $linea,
                'id' => $inv->id,
                'numero_control' => $inv->numero_control,
                'correo' => $inv->email,
                'correo_estado' => $estado,
                // Delivered by mail: the link is not needed again, so it never leaves the server.
                'link' => $estado === CreateInvitacion::CORREO_ENVIADO ? null : $link,
            ];
        }

        // Counts only: never links or tokens.
        $this->bitacora->log($admin->id, 'invitaciones_carga_masiva', 'invitacion', null, [
            'filas_leidas' => $rowsRead,
            'creadas' => count($resultados),
            'omitidas' => $skipped + count(array_unique(array_column($errores, 'linea'))),
            'correo' => $mail,
        ]);

        return ['resultados' => $resultados, 'errores' => $errores];
    }

    // -------------------------------------------------------------- templates

    public function csvTemplate(): string
    {
        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, self::COLUMNS, ',', '"', '');
        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);

        return "\xEF\xBB\xBF".$csv;
    }

    /** @return string path of a temporary .xlsx the caller must delete */
    public function xlsxTemplate(): string
    {
        $base = tempnam(sys_get_temp_dir(), 'plantilla-inv-');
        $path = $base.'.xlsx';
        rename($base, $path);
        $writer = new XlsxWriter;
        $writer->openToFile($path);

        $writer->getCurrentSheet()->setName('Invitaciones');
        $writer->addRow(Row::fromValues(self::COLUMNS));

        $writer->addNewSheetAndMakeItCurrent()->setName('Instrucciones');
        foreach ($this->instructions() as $line) {
            $writer->addRow(Row::fromValues($line));
        }

        $writer->addNewSheetAndMakeItCurrent()->setName('Catálogos');
        $writer->addRow(Row::fromValues(['Opciones de titulación (copia el nombre exacto)']));
        foreach (DB::table('opciones_titulacion')->where('activo', 1)->orderBy('nombre')->pluck('nombre') as $nombre) {
            $writer->addRow(Row::fromValues([$nombre]));
        }
        $writer->addRow(Row::fromValues(['']));
        $writer->addRow(Row::fromValues(['Asesores activos']));
        $writer->addRow(Row::fromValues(['Número de control', 'Nombre completo', 'Carga actual / máxima']));
        foreach (DB::table('vw_carga_docente')->orderBy('nombre_completo')->get() as $a) {
            $writer->addRow(Row::fromValues([
                (string) $a->numero_control,
                $a->nombre_completo,
                $a->carga_actual.' / '.($a->carga_maxima ?: CreateAsignacion::DEFAULT_MAX_LOAD),
            ]));
        }

        $writer->close();

        return $path;
    }

    private function exampleRow(): string
    {
        $opcion = DB::table('opciones_titulacion')->where('activo', 1)->orderBy('nombre')->value('nombre') ?? 'Tesis profesional';

        return implode(',', ['2024-0123', 'ana.lopez@tescha.edu.mx', 'Ana', 'López', 'Ruiz', 'estudiante', str_contains($opcion, ',') ? '"'.$opcion.'"' : $opcion, 'DOC-0001', '']);
    }

    /** @return array<int, array<int, string>> */
    private function instructions(): array
    {
        $max = self::maxRows();

        return [
            ['Cómo llenar la hoja "Invitaciones"'],
            ['1. Escribe una invitación por fila, debajo de los encabezados. No cambies los nombres de las columnas.'],
            ['2. Columnas obligatorias: numero_control, correo, nombre, apellido_paterno, rol.'],
            ['3. Columnas opcionales: apellido_materno, asesor, grado_academico. opcion_titulacion es obligatoria para estudiantes.'],
            ['4. rol acepta: estudiante, asesor o administrativo.'],
            ['5. opcion_titulacion debe coincidir con el nombre de la hoja "Catálogos" (no importan mayúsculas ni acentos).'],
            ['6. asesor lleva el número de control de un asesor activo (ver "Catálogos"); solo aplica a estudiantes y respeta su carga máxima.'],
            ['7. grado_academico solo aplica a asesores.'],
            ["8. Máximo {$max} filas por archivo."],
            ['9. Guarda como .xlsx o .csv (UTF-8) y súbelo. El archivo se revisa completo antes de crear nada y verás los errores por fila.'],
            ['10. Los enlaces de invitación se muestran una sola vez al crear; guárdalos entonces.'],
            [''],
            ['Columnas obligatorias: numero_control, correo, nombre, apellido_paterno, rol (y opcion_titulacion si el rol es estudiante).'],
            [''],
            ['Ejemplo de una fila completa (solo es un ejemplo: no está incluida en la plantilla):'],
            [$this->exampleRow()],
            [''],
            ['También puedes ver esta guía dentro de la pantalla Carga masiva.'],
        ];
    }
}
