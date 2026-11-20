<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateInvitacionMasivaRequest;
use App\Http\Requests\Admin\ValidateInvitacionMasivaRequest;
use App\Services\Admin\InvitacionMasivaService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class InvitacionMasivaController extends Controller
{
    private const MAX_ERRORS = 200;

    public function __construct(private readonly InvitacionMasivaService $masiva) {}

    public function plantillaXlsx(): BinaryFileResponse
    {
        return response()->download($this->masiva->xlsxTemplate(), 'plantilla-invitaciones.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }

    public function plantillaCsv(): Response
    {
        return response($this->masiva->csvTemplate(), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla-invitaciones.csv"',
        ]);
    }

    public function validar(ValidateInvitacionMasivaRequest $request): JsonResponse
    {
        $rows = $this->masiva->validate($this->masiva->parse($request->file('archivo')));

        return response()->json($this->summary($rows));
    }

    public function crear(CreateInvitacionMasivaRequest $request): JsonResponse
    {
        $rows = $this->masiva->validate($this->masiva->parse($request->file('archivo')));
        $summary = $this->summary($rows);
        $omit = $request->boolean('omitir_errores');

        if ($summary['con_error'] > 0 && ! $omit) {
            return response()->json(['message' => 'El archivo tiene filas con errores; no se creó ninguna invitación.'] + $summary, 422);
        }

        $valid = array_values(array_filter($rows, fn ($r) => $r['payload'] !== null));
        if ($valid === []) {
            return response()->json(['message' => 'Ninguna fila es válida; no se creó ninguna invitación.'] + $summary, 422);
        }

        $result = $this->masiva->create($valid, $request->user(), count($rows), $summary['con_error']);

        $errores = array_merge($summary['errores'], $result['errores']);

        return response()->json([
            'message' => 'Invitaciones creadas.',
            'creadas' => count($result['resultados']),
            'omitidas' => $summary['con_error'] + count(array_unique(array_column($result['errores'], 'linea'))),
            'resultados' => $result['resultados'],
            'errores' => array_slice($errores, 0, self::MAX_ERRORS),
        ], 201);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows output of InvitacionMasivaService::validate
     * @return array<string, mixed>
     */
    private function summary(array $rows): array
    {
        $errores = [];
        $validas = [];
        $conError = 0;

        foreach ($rows as $row) {
            if ($row['errores']) {
                $conError++;
                foreach ($row['errores'] as $e) {
                    $errores[] = ['linea' => $row['linea']] + $e;
                }

                continue;
            }
            $p = $row['payload'];
            $validas[] = [
                'linea' => $row['linea'],
                'numero_control' => $p['numero_control'],
                'correo' => $p['email'],
                'nombre' => trim($p['nombre'].' '.$p['apellido_paterno'].' '.($p['apellido_materno'] ?? '')),
                'rol' => $p['rol'],
                'opcion_titulacion_id' => $p['opcion_titulacion_id'],
                'asesor_id' => $p['asesor_id'],
                'grado_academico' => $p['grado_academico'],
            ];
        }

        return [
            'total' => count($rows),
            'validas' => count($validas),
            'con_error' => $conError,
            'errores' => array_slice($errores, 0, self::MAX_ERRORS),
            'filas_validas' => $validas,
        ];
    }
}
