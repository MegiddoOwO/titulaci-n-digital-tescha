<?php

use App\Http\Controllers\PrivacidadController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check()
        ? redirect(auth()->user()->homePath())
        : redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))
        ->middleware('role:estudiante')->name('dashboard');

    Route::get('/asesor', fn () => Inertia::render('Asesor/Home'))
        ->middleware('role:asesor')->name('asesor.home');

    Route::get('/admin', fn () => Inertia::render('Admin/Home'))
        ->middleware('role:administrativo')->name('admin.home');

    Route::get('/privacidad/consentimiento', [PrivacidadController::class, 'show'])
        ->name('privacidad.show');
    Route::post('/privacidad/consentimiento', [PrivacidadController::class, 'store'])
        ->name('privacidad.store');
});

require __DIR__.'/auth.php';
