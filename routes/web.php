<?php

use App\Http\Controllers\Admin\AsignacionController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\BitacoraController;
use App\Http\Controllers\Admin\CatalogoController;
use App\Http\Controllers\Admin\DictamenController;
use App\Http\Controllers\Admin\DocumentoReviewController as AdminDocumentoReviewController;
use App\Http\Controllers\Admin\ExpedienteController;
use App\Http\Controllers\Admin\InvitacionController;
use App\Http\Controllers\Admin\SolicitudArcoController as AdminSolicitudArcoController;
use App\Http\Controllers\Admin\UsuarioController;
use App\Http\Controllers\Asesor\ExpedienteController as AsesorExpedienteController;
use App\Http\Controllers\Asesor\DashboardController as AsesorDashboardController;
use App\Http\Controllers\Asesor\DocumentoController as AsesorDocumentoController;
use App\Http\Controllers\Asesor\DocumentoReviewController as AsesorDocumentoReviewController;
use App\Http\Controllers\Estudiante\DictamenController as EstudianteDictamenController;
use App\Http\Controllers\Estudiante\DocumentoController;
use App\Http\Controllers\Estudiante\TramiteController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\PrivacidadController;
use App\Http\Controllers\Public\DirectorioController;
use App\Http\Controllers\Public\InvitacionController as InvitacionPublicaController;
use App\Http\Controllers\Public\NormativaController;
use App\Http\Controllers\Public\RequisitoFotografiaController;
use App\Http\Controllers\SolicitudArcoController;
use App\Services\Admin\CatalogoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guests see the landing page; authenticated users go to their role home (as the legacy SPA did).
Route::get('/', function () {
    return auth()->check()
        ? redirect(auth()->user()->homePath())
        : Inertia::render('Landing');
})->name('home');

// Public read-only content (no session required, as in Express).
Route::get('/normativa', [NormativaController::class, 'index'])->name('normativa.index');
Route::get('/normativa/{id}', [NormativaController::class, 'show'])->whereNumber('id')->name('normativa.show');
Route::get('/directorio', [DirectorioController::class, 'index'])->name('directorio.index');
Route::get('/directorio/{id}', [DirectorioController::class, 'show'])->whereNumber('id')->name('directorio.show');
Route::get('/requisitos-fotografia', RequisitoFotografiaController::class)->name('requisitos-fotografia');

// Account invitations: public, single-use links (no state leak on invalid tokens).
Route::get('/invitacion/{token}', [InvitacionPublicaController::class, 'show'])->name('invitacion.show');
Route::post('/invitacion/{token}', [InvitacionPublicaController::class, 'store'])
    ->middleware('throttle:10,1')->name('invitacion.aceptar');

Route::middleware('auth')->group(function () {
    Route::middleware('role:estudiante')->group(function () {
        Route::get('/dashboard', [TramiteController::class, 'show'])->name('dashboard');
        Route::get('/tramites/mi-dictamen/pdf', [EstudianteDictamenController::class, 'pdf'])
            ->name('tramites.mi-dictamen.pdf');

        Route::scopeBindings()->group(function () {
            Route::post('/tramites/{tramite}/documentos', [DocumentoController::class, 'store'])
                ->name('tramites.documentos.store');
            Route::get('/tramites/{tramite}/documentos/{documento}', [DocumentoController::class, 'show'])
                ->name('tramites.documentos.show');
        });
    });

    Route::middleware('role:asesor')->prefix('asesor')->name('asesor.')->group(function () {
        Route::get('/', AsesorDashboardController::class)->name('home');
        Route::get('/expedientes/{tramite}', [AsesorExpedienteController::class, 'show'])
            ->whereNumber('tramite')->name('expedientes.show');
        Route::scopeBindings()->get('/tramites/{tramite}/documentos/{documento}', [AsesorDocumentoController::class, 'show'])
            ->whereNumber(['tramite', 'documento'])->name('tramites.documentos.show');
        Route::put('/documentos/{documento}/aprobar', [AsesorDocumentoReviewController::class, 'approve'])
            ->whereNumber('documento')->name('documentos.aprobar');
        Route::put('/documentos/{documento}/rechazar', [AsesorDocumentoReviewController::class, 'reject'])
            ->whereNumber('documento')->name('documentos.rechazar');
    });

    Route::middleware('role:administrativo')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'show'])->name('home');
        Route::get('/stats', [AdminDashboardController::class, 'stats'])->name('stats');

        Route::get('/expedientes', [ExpedienteController::class, 'index'])->name('expedientes.index');
        Route::get('/expedientes/export', [ExpedienteController::class, 'export'])->name('expedientes.export');
        Route::get('/expedientes/{tramite}/descargar', [ExpedienteController::class, 'download'])
            ->whereNumber('tramite')->name('expedientes.descargar');
        Route::get('/expedientes/{tramite}', [ExpedienteController::class, 'show'])
            ->whereNumber('tramite')->name('expedientes.show');
        Route::put('/expedientes/{tramite}', [ExpedienteController::class, 'update'])
            ->whereNumber('tramite')->name('expedientes.update');
        Route::put('/expedientes/{tramite}/toggle', [ExpedienteController::class, 'toggle'])
            ->whereNumber('tramite')->name('expedientes.toggle');

        Route::get('/documentos', [AdminDocumentoReviewController::class, 'index'])->name('documentos.index');
        Route::scopeBindings()->get('/tramites/{tramite}/documentos/{documento}', [DocumentoController::class, 'show'])
            ->name('tramites.documentos.show');
        Route::put('/documentos/{documento}/aprobar', [AdminDocumentoReviewController::class, 'approve'])
            ->whereNumber('documento')->name('documentos.aprobar');
        Route::put('/documentos/{documento}/rechazar', [AdminDocumentoReviewController::class, 'reject'])
            ->whereNumber('documento')->name('documentos.rechazar');

        Route::get('/dictamenes', [DictamenController::class, 'index'])->name('dictamenes.index');
        Route::post('/dictamenes', [DictamenController::class, 'store'])->name('dictamenes.store');
        Route::get('/dictamenes/{tramite}/pdf', [DictamenController::class, 'pdf'])
            ->whereNumber('tramite')->name('dictamenes.pdf');

        Route::post('/asignaciones', [AsignacionController::class, 'store'])->name('asignaciones.store');
        Route::put('/tramites/{tramite}/asesor', [AsignacionController::class, 'replaceAsesor'])
            ->whereNumber('tramite')->name('tramites.asesor');
        Route::delete('/asignaciones/{asignacion}', [AsignacionController::class, 'destroy'])
            ->whereNumber('asignacion')->name('asignaciones.destroy');

        Route::get('/bitacora', [BitacoraController::class, 'index'])->name('bitacora.index');
        Route::get('/docentes', [UsuarioController::class, 'docentes'])->name('docentes');
        Route::get('/opciones-titulacion', [UsuarioController::class, 'opcionesTitulacion'])->name('opciones-titulacion');

        Route::get('/usuarios', [UsuarioController::class, 'index'])->name('usuarios.index');
        Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
        Route::get('/usuarios/{usuario}', [UsuarioController::class, 'show'])
            ->whereNumber('usuario')->name('usuarios.show');
        Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update'])
            ->whereNumber('usuario')->name('usuarios.update');
        Route::put('/usuarios/{usuario}/toggle', [UsuarioController::class, 'toggle'])
            ->whereNumber('usuario')->name('usuarios.toggle');
        Route::delete('/usuarios/{usuario}', [UsuarioController::class, 'destroy'])
            ->whereNumber('usuario')->name('usuarios.destroy');

        Route::get('/invitaciones', [InvitacionController::class, 'index'])->name('invitaciones.index');
        Route::post('/invitaciones', [InvitacionController::class, 'store'])->name('invitaciones.store');
        Route::post('/invitaciones/{invitacion}/reenviar', [InvitacionController::class, 'resend'])
            ->whereNumber('invitacion')->name('invitaciones.reenviar');
        Route::delete('/invitaciones/{invitacion}', [InvitacionController::class, 'destroy'])
            ->whereNumber('invitacion')->name('invitaciones.destroy');

        // Pages; usuarios and bitacora render from their index actions (JSON for JSON clients).
        Route::get('/catalogos', [CatalogoController::class, 'page'])->name('catalogos.page');
        Route::get('/arco', [AdminSolicitudArcoController::class, 'page'])->name('arco.page');

        Route::get('/solicitudes-arco', [AdminSolicitudArcoController::class, 'index'])->name('arco.index');
        Route::put('/solicitudes-arco/{solicitud}', [AdminSolicitudArcoController::class, 'update'])
            ->whereNumber('solicitud')->name('arco.update');

        $catalogo = ['catalogo' => implode('|', array_keys(CatalogoService::CATALOGS))];
        Route::get('/catalogos/{catalogo}', [CatalogoController::class, 'index'])
            ->where($catalogo)->name('catalogos.index');
        Route::post('/catalogos/{catalogo}', [CatalogoController::class, 'store'])
            ->where($catalogo)->name('catalogos.store');
        Route::put('/catalogos/{catalogo}/{id}', [CatalogoController::class, 'update'])
            ->where($catalogo)->whereNumber('id')->name('catalogos.update');
        Route::put('/catalogos/{catalogo}/{id}/toggle', [CatalogoController::class, 'toggle'])
            ->where($catalogo)->whereNumber('id')->name('catalogos.toggle');
    });

    Route::get('/solicitudes-arco', [SolicitudArcoController::class, 'index'])->name('arco.mine');
    Route::post('/solicitudes-arco', [SolicitudArcoController::class, 'store'])->name('arco.store');

    Route::get('/notificaciones', [NotificacionController::class, 'index'])->name('notificaciones.index');
    Route::put('/notificaciones/leer-todas', [NotificacionController::class, 'markAllRead'])
        ->name('notificaciones.leer-todas');
    Route::put('/notificaciones/{notificacion}/leida', [NotificacionController::class, 'markRead'])
        ->whereNumber('notificacion')->name('notificaciones.leida');

    Route::get('/privacidad/consentimiento', [PrivacidadController::class, 'show'])
        ->name('privacidad.show');
    Route::post('/privacidad/consentimiento', [PrivacidadController::class, 'store'])
        ->name('privacidad.store');
});

require __DIR__.'/auth.php';

// Unknown browser URLs render the 404 page inside the web middleware stack, so the shared `auth`
// prop exists for signed-in users. JSON clients keep the plain JSON 404.
Route::fallback(function (Request $request) {
    if ($request->expectsJson() || $request->is('api/*')) {
        abort(404);
    }

    return Inertia::render('NotFound')->toResponse($request)->setStatusCode(404);
});
