<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\LoginAttemptService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'bloqueado' => (bool) session('bloqueado', false),
        ]);
    }

    public function store(LoginRequest $request, LoginAttemptService $attempts): RedirectResponse
    {
        $result = $attempts->attempt(
            $request->string('numero_control')->toString(),
            $request->string('password')->toString(),
        );

        if ($result['user'] === null) {
            return back()
                ->withErrors(['numero_control' => $result['error']])
                ->with('bloqueado', $result['locked']);
        }

        Auth::login($result['user']);
        $request->session()->regenerate();

        return redirect()->intended($result['user']->homePath());
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
