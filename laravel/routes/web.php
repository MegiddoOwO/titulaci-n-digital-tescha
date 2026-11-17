<?php

use App\Http\Controllers\Admin\AsignacionController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DictamenController;
use App\Http\Controllers\Admin\DocumentoReviewController as AdminDocumentoReviewController;
use App\Http\Controllers\Admin\ExpedienteController;
use App\Http\Controllers\Asesor\DashboardController as AsesorDashboardController;
use App\Http\Controllers\Asesor\DocumentoReviewController as AsesorDocumentoReviewController;
use App\Http\Controllers\Estudiante\DocumentoController;
use App\Http\Controllers\Estudiante\TramiteController;
use App\Http\Controllers\PrivacidadController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect(auth()->user()->homePath())
        : redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::middleware('role:estudiante')->group(function () {
        Route::get('/dashboard', [TramiteController::class, 'show'])->name('dashboard');

        Route::scopeBindings()->group(function () {
            Route::post('/tramites/{tramite}/documentos', [DocumentoController::class, 'store'])
                ->name('tramites.documentos.store');
            Route::get('/tramites/{tramite}/documentos/{documento}', [DocumentoController::class, 'show'])
                ->name('tramites.documentos.show');
        });
    });

    Route::middleware('role:asesor')->prefix('asesor')->name('asesor.')->group(function () {
        Route::get('/', AsesorDashboardController::class)->name('home');
        Route::put('/documentos/{documento}/aprobar', [AsesorDocumentoReviewController::class, 'approve'])
            ->whereNumber('documento')->name('documentos.aprobar');
        Route::put('/documentos/{documento}/rechazar', [AsesorDocumentoReviewController::class, 'reject'])
            ->whereNumber('documento')->name('documentos.rechazar');
    });

    Route::middleware('role:administrativo')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'show'])->name('home');
        Route::get('/stats', [AdminDashboardController::class, 'stats'])->name('stats');

        Route::get('/expedientes', [ExpedienteController::class, 'index'])->name('expedientes.index');
        Route::get('/expedientes/{tramite}', [ExpedienteController::class, 'show'])
            ->whereNumber('tramite')->name('expedientes.show');
        Route::put('/expedientes/{tramite}', [ExpedienteController::class, 'update'])
            ->whereNumber('tramite')->name('expedientes.update');
        Route::put('/expedientes/{tramite}/toggle', [ExpedienteController::class, 'toggle'])
            ->whereNumber('tramite')->name('expedientes.toggle');

        Route::put('/documentos/{documento}/aprobar', [AdminDocumentoReviewController::class, 'approve'])
            ->whereNumber('documento')->name('documentos.aprobar');
        Route::put('/documentos/{documento}/rechazar', [AdminDocumentoReviewController::class, 'reject'])
            ->whereNumber('documento')->name('documentos.rechazar');

        Route::post('/dictamenes', [DictamenController::class, 'store'])->name('dictamenes.store');

        Route::post('/asignaciones', [AsignacionController::class, 'store'])->name('asignaciones.store');
        Route::delete('/asignaciones/{asignacion}', [AsignacionController::class, 'destroy'])
            ->whereNumber('asignacion')->name('asignaciones.destroy');
    });

    Route::get('/privacidad/consentimiento', [PrivacidadController::class, 'show'])
        ->name('privacidad.show');
    Route::post('/privacidad/consentimiento', [PrivacidadController::class, 'store'])
        ->name('privacidad.store');
});

require __DIR__.'/auth.php';
