<?php

namespace App\Http\Middleware;

use App\Models\Consentimiento;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'auth' => [
                'user' => fn () => $request->user() ? [
                    'id' => $request->user()->id,
                    'numero_control' => $request->user()->numero_control,
                    'nombre_completo' => $request->user()->nombre_completo,
                    'nombre' => $request->user()->nombre,
                    'apellido_paterno' => $request->user()->apellido_paterno,
                    'email' => $request->user()->email,
                    'rol' => $request->user()->rol,
                ] : null,
                'consentimiento' => fn () => $request->user()
                    ? Consentimiento::where('usuario_id', $request->user()->id)->exists()
                    : false,
            ],
        ];
    }
}
