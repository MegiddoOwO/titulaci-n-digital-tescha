<?php

namespace Tests\Feature\Estudiante;

use App\Models\Bitacora;
use App\Models\Documento;
use App\Models\HistorialEstado;
use App\Models\Notificacion;
use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TramiteFlowTest extends TestCase
{
    use DatabaseTransactions;

    // Seed (tramite 1 / student 2021-0001): tipo 1,2 approved; 3 en_revision; 4,10 cargado;
    // 5 (prereq 1) and 11 pendiente.
    private const TIPO_APPROVED = 1;
    private const TIPO_REVIEW = 3;
    private const TIPO_PENDING = 11;
    private const TIPO_PREREQ_OK = 5;

    private const PDF = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('uploads');
    }

    private function student(string $numero = '2021-0001'): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function tramiteOf(Usuario $u): Tramite
    {
        return Tramite::where('usuario_id', $u->id)->where('activo', 1)->firstOrFail();
    }

    private function pdf(string $name = 'doc.pdf', string $content = self::PDF): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $content);
    }

    private function upload(Usuario $user, Tramite $tramite, int $tipo, ?UploadedFile $file = null)
    {
        return $this->actingAs($user)->postJson("/tramites/{$tramite->id}/documentos", [
            'tipo_documento_id' => $tipo,
            'archivo' => $file ?? $this->pdf(),
        ]);
    }

    public function test_dashboard_props_match_seed_data(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('error', null)
            ->where('tramite.id', $tramite->id)
            ->where('tramite.usuario_id', $user->id)
            ->has('tramite.documentos', 7)
            ->where('tramite.progreso.total', 7)
            ->where('tramite.progreso.aprobados', 2)
            ->where('tramite.progreso.porcentaje', 28.6)
            ->where('tramite.progreso.color_semaforo', 'ambar')
            ->has('tramite.asignaciones')
            ->has('tramite.documentos.0', fn (Assert $doc) => $doc
                ->where('tipo_documento_id', 1)
                ->where('estatus', 'aprobado')
                ->where('bloqueado', false)
                ->etc())
            ->missing('historial')
        );
    }

    public function test_dashboard_marks_prerequisite_lock_and_pending_documents(): void
    {
        $user = $this->student();
        Documento::where('tramite_id', $this->tramiteOf($user)->id)
            ->where('tipo_documento_id', 1)->update(['estatus' => 'cargado']);

        $this->actingAs($user)->get('/dashboard')->assertInertia(function (Assert $page) {
            $docs = collect($page->toArray()['props']['tramite']['documentos'])->keyBy('tipo_documento_id');
            $this->assertTrue($docs[5]['bloqueado']);
            $this->assertStringContainsString('es prerrequisito', $docs[5]['motivo_bloqueo']);
            $this->assertSame('pendiente', $docs[11]['estatus']);
        });
    }

    public function test_dashboard_historial_is_deferred_and_own(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        HistorialEstado::create([
            'tramite_id' => $tramite->id, 'estado_nuevo' => 'cargado',
            'comentario' => 'marker', 'usuario_id' => $user->id,
        ]);

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->loadDeferredProps(fn (Assert $reloaded) => $reloaded
                ->has('historial')
                ->where('historial.0.comentario', 'marker')
                ->where('historial.0.tramite_id', $tramite->id)
                ->where('historial.0.usuario_nombre', trim($user->nombre.' '.$user->apellido_paterno))));
    }

    public function test_dashboard_without_tramite_returns_error(): void
    {
        $user = $this->student();
        Tramite::where('usuario_id', $user->id)->update(['activo' => 0]);

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('tramite', null)
            ->where('error', 'No se encontró un trámite activo para este usuario.'));

        $this->actingAs($user)->getJson('/dashboard')
            ->assertNotFound()
            ->assertJson(['message' => 'No se encontró un trámite activo para este usuario.']);
    }

    public function test_non_students_get_403_on_student_routes(): void
    {
        $tramite = $this->tramiteOf($this->student());
        $doc = Documento::where('tramite_id', $tramite->id)->firstOrFail();

        foreach (['asesor', 'administrativo'] as $rol) {
            $user = Usuario::where('rol', $rol)->where('activo', 1)->orderBy('id')->firstOrFail();

            $this->actingAs($user)->get('/dashboard')->assertForbidden();
            $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$doc->id}")->assertForbidden();
            $this->upload($user, $tramite, self::TIPO_PENDING)->assertForbidden();
        }
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_upload_happy_path(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $before = [Bitacora::count(), Notificacion::count()];

        $response = $this->upload($user, $tramite, self::TIPO_PENDING, $this->pdf('Mi carta (1).pdf'));

        $response->assertOk()->assertJson(['message' => 'Documento subido correctamente.']);

        $doc = Documento::findOrFail($response->json('documento_id'));
        $this->assertSame('cargado', $doc->estatus);
        $this->assertSame($tramite->id, $doc->tramite_id);
        $this->assertSame(self::TIPO_PENDING, $doc->tipo_documento_id);
        $this->assertSame('Mi carta (1).pdf', $doc->archivo_nombre);
        $this->assertStringStartsWith("uploads/{$tramite->id}/", $doc->archivo_url);
        $this->assertStringEndsWith('_Mi_carta__1_.pdf', $doc->archivo_url);
        $this->assertNotNull($doc->fecha_subida);
        Storage::disk('uploads')->assertExists($doc->archivo_url);

        $history = HistorialEstado::where('documento_id', $doc->id)->firstOrFail();
        $this->assertSame('cargado', $history->estado_nuevo);
        $this->assertSame($user->id, $history->usuario_id);
        $this->assertStringContainsString('Mi carta (1).pdf', $history->comentario);

        // Express writes neither bitacora nor notificaciones on upload.
        $this->assertSame($before, [Bitacora::count(), Notificacion::count()]);
    }

    public function test_upload_history_shows_bytes_for_files_under_one_kilobyte(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $response = $this->upload($user, $tramite, self::TIPO_PENDING, $this->pdf('tiny.pdf'));

        $response->assertOk();
        $comentario = HistorialEstado::where('documento_id', $response->json('documento_id'))->firstOrFail()->comentario;
        $this->assertStringEndsWith('('.strlen(self::PDF).' B)', $comentario);
        $this->assertStringNotContainsString('0 KB', $comentario);
    }

    public function test_upload_via_inertia_redirects_back_with_flash(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $this->actingAs($user)->from('/dashboard')->post("/tramites/{$tramite->id}/documentos", [
            'tipo_documento_id' => self::TIPO_PENDING,
            'archivo' => $this->pdf(),
        ])->assertRedirect('/dashboard')->assertSessionHas('success', 'Documento subido correctamente.');
    }

    public function test_upload_respects_prerequisite_when_approved(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        // Tipo 5 requires tipo 1 (approved in seed): allowed.
        $this->upload($user, $tramite, self::TIPO_PREREQ_OK)->assertOk();

        Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 1)
            ->update(['estatus' => 'cargado']);
        Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 5)
            ->update(['estatus' => 'pendiente']);

        $this->upload($user, $tramite, self::TIPO_PREREQ_OK)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['archivo']);
    }

    public function test_upload_rejects_invalid_mime(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $this->upload($user, $tramite, self::TIPO_PENDING, UploadedFile::fake()->createWithContent('x.txt', 'hello'))
            ->assertUnprocessable()
            ->assertJsonPath('errors.archivo.0', 'Formato no permitido. Solo se aceptan: PDF.');

        $this->assertSame(0, count(Storage::disk('uploads')->allFiles()));
    }

    public function test_upload_is_refused_when_the_catalog_formats_are_unknown(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        DB::table('tipos_documento')->where('id', self::TIPO_PENDING)->update(['formato_permitido' => 'XYZ']);

        $this->upload($user, $tramite, self::TIPO_PENDING)
            ->assertUnprocessable()
            ->assertJsonPath('errors.archivo.0', 'El tipo de documento no tiene formatos permitidos válidos. Contacte a administración.');

        $this->assertSame(0, count(Storage::disk('uploads')->allFiles()));

        DB::table('tipos_documento')->where('id', self::TIPO_PENDING)->update(['formato_permitido' => 'PDF']);
        $this->upload($user, $tramite, self::TIPO_PENDING)->assertSuccessful();
    }

    public function test_upload_rejects_corrupt_pdf(): void
    {
        $user = $this->student();

        $this->upload($user, $this->tramiteOf($user), self::TIPO_PENDING, $this->pdf('bad.pdf', 'not really a pdf'))
            ->assertUnprocessable();
    }

    public function test_upload_rejects_oversized_file(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $big = UploadedFile::fake()->createWithContent('big.pdf', self::PDF.str_repeat('0', 10 * 1024 * 1024 + 10));

        $this->upload($user, $tramite, self::TIPO_PENDING, $big)
            ->assertUnprocessable()
            ->assertJsonPath('errors.archivo.0', fn ($m) => str_starts_with($m, 'El archivo excede el límite de 10.00 MB.'));

        $this->assertSame(0, count(Storage::disk('uploads')->allFiles()));
    }

    public function test_upload_requires_file_and_type(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $this->actingAs($user)->postJson("/tramites/{$tramite->id}/documentos", [])
            ->assertUnprocessable()
            ->assertJsonPath('errors.archivo.0', 'No se recibió ningún archivo.')
            ->assertJsonPath('errors.tipo_documento_id.0', 'tipo_documento_id es requerido.');
    }

    public function test_upload_rejects_unknown_or_foreign_option_type(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $this->upload($user, $tramite, 999999)->assertUnprocessable()
            ->assertJsonPath('errors.tipo_documento_id.0', 'Tipo de documento no válido.');
        // tipo 20 belongs to another titulacion option
        $this->upload($user, $tramite, 20)->assertUnprocessable();
    }

    public function test_upload_blocked_while_approved_or_in_review(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $before = Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', self::TIPO_APPROVED)->first();

        $this->upload($user, $tramite, self::TIPO_APPROVED)->assertUnprocessable()
            ->assertJsonPath('errors.archivo.0', 'El documento ya fue aprobado y no puede reemplazarse.');
        $this->upload($user, $tramite, self::TIPO_REVIEW, UploadedFile::fake()->createWithContent('f.jpg', base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=')))
            ->assertUnprocessable();

        $this->assertSame($before->estatus, $before->fresh()->estatus);
        $this->assertSame($before->archivo_url, $before->fresh()->archivo_url);
        $this->assertSame(0, count(Storage::disk('uploads')->allFiles()));
    }

    public function test_resubmission_after_rejection(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $doc = Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 4)->firstOrFail();
        $doc->update(['estatus' => 'rechazado', 'motivo_rechazo' => 'Ilegible']);

        $this->upload($user, $tramite, 4)->assertOk()->assertJsonPath('documento_id', $doc->id);

        $doc->refresh();
        $this->assertSame('cargado', $doc->estatus);
        $this->assertNull($doc->motivo_rechazo);
        Storage::disk('uploads')->assertExists($doc->archivo_url);
        $this->assertSame(1, HistorialEstado::where('documento_id', $doc->id)->where('estado_nuevo', 'cargado')->count());
    }

    public function test_other_student_cannot_upload_or_download(): void
    {
        $owner = $this->student();
        $tramite = $this->tramiteOf($owner);
        $stranger = $this->student('2021-0002');
        $doc = Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 4)->firstOrFail();
        $doc->update(['archivo_url' => "uploads/{$tramite->id}/x.pdf", 'archivo_nombre' => 'x.pdf']);
        Storage::disk('uploads')->put($doc->archivo_url, self::PDF);

        $this->upload($stranger, $tramite, self::TIPO_PENDING)->assertForbidden();
        $this->actingAs($stranger)->get("/tramites/{$tramite->id}/documentos/{$doc->id}")->assertForbidden();
        $this->assertFalse(Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', self::TIPO_PENDING)->first()?->archivo_url !== null);
    }

    public function test_owner_downloads_own_document_inline(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $doc = Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 4)->firstOrFail();
        $doc->update(['archivo_url' => "uploads/{$tramite->id}/x.pdf", 'archivo_nombre' => 'Pago.pdf']);
        Storage::disk('uploads')->put($doc->archivo_url, self::PDF);

        $response = $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$doc->id}");

        $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('inline', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('Pago.pdf', $response->headers->get('Content-Disposition'));
    }

    public function test_legacy_bare_file_name_resolves_under_uploads(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $doc = Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 4)->firstOrFail();
        $doc->update(['archivo_url' => '1700000000000_legacy.pdf', 'archivo_nombre' => 'legacy.pdf']);
        Storage::disk('uploads')->put('uploads/1700000000000_legacy.pdf', self::PDF);

        $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$doc->id}")->assertOk();
    }

    public function test_download_404_cases(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);
        $doc = Documento::where('tramite_id', $tramite->id)->where('tipo_documento_id', 4)->firstOrFail();

        // No file recorded.
        $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$doc->id}")
            ->assertNotFound();

        // File recorded but missing from disk.
        $doc->update(['archivo_url' => "uploads/{$tramite->id}/missing.pdf"]);
        $this->actingAs($user)->getJson("/tramites/{$tramite->id}/documentos/{$doc->id}")
            ->assertNotFound()->assertJson(['message' => 'Archivo no encontrado en el servidor.']);

        // Path traversal is refused.
        $doc->update(['archivo_url' => '../../.env']);
        $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$doc->id}")->assertNotFound();

        // Document that does not belong to the tramite in the URL.
        $other = Documento::where('tramite_id', '!=', $tramite->id)->firstOrFail();
        $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$other->id}")->assertNotFound();
    }

    public function test_upload_to_inactive_or_missing_tramite_is_404(): void
    {
        $user = $this->student();
        $tramite = $this->tramiteOf($user);

        $this->upload($user, $tramite, self::TIPO_PENDING, null);
        Tramite::whereKey($tramite->id)->update(['activo' => 0]);

        $this->upload($user, $tramite, self::TIPO_PENDING)->assertNotFound();
        $this->actingAs($user)->postJson('/tramites/999999/documentos', [])->assertNotFound();
    }
}
