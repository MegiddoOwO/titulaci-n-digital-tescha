<?php

namespace App\Http\Controllers;

use App\Models\Consentimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PrivacidadController extends Controller
{
    public const VERSION_AVISO = '1.0';

    public function show(Request $request): JsonResponse
    {
        $row = Consentimiento::where('usuario_id', $request->user()->id)->orderByDesc('id')->first();

        if (! $row) {
            return response()->json(['consentido' => false]);
        }

        return response()->json([
            'consentido' => true,
            'version' => $row->version_aviso,
            'fecha' => $row->fecha_consentimiento,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Consentimiento::create([
            'usuario_id' => $request->user()->id,
            'version_aviso' => self::VERSION_AVISO,
            'ip_origen' => $request->ip() ?? 'unknown',
            'user_agent' => Str::limit($request->userAgent() ?? 'unknown', 500, ''),
        ]);

        return response()->json(['message' => 'Consentimiento registrado correctamente.']);
    }
}
