<?php

namespace Tests\Feature\Services;

use App\Mail\NotificacionMail;
use App\Models\Dictamen;
use App\Models\Documento;
use App\Models\Usuario;
use App\Services\NotificacionService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class CrossCuttingServicesTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function dictamenOwner(): Usuario
    {
        return Usuario::findOrFail(Dictamen::where('tramite_id', 4)->firstOrFail()->tramite->usuario_id);
    }

    public function test_admin_gets_dictamen_pdf(): void
    {
        $response = $this->actingAs($this->user('ADM-0001'))->get('/admin/dictamenes/4/pdf')->assertOk();

        $this->assertStringStartsWith('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('inline; filename=dictamen_'.$this->dictamenOwner()->numero_control.'.pdf',
            str_replace('"', '', $response->headers->get('Content-Disposition')));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_admin_pdf_404_without_dictamen_and_role_isolation(): void
    {
        $this->actingAs($this->user('ADM-0001'))->get('/admin/dictamenes/1/pdf')
            ->assertNotFound();
        $this->actingAs($this->user('ADM-0001'))->getJson('/admin/dictamenes/1/pdf')
            ->assertNotFound()->assertJsonPath('message', 'Dictamen no encontrado.');

        $this->actingAs($this->user('2021-0001'))->get('/admin/dictamenes/4/pdf')->assertForbidden();
        $this->actingAs($this->user('DOC-0001'))->get('/admin/dictamenes/4/pdf')->assertForbidden();
    }

    public function test_student_gets_only_own_dictamen_pdf(): void
    {
        $owner = $this->dictamenOwner();
        $response = $this->actingAs($owner)->get('/tramites/mi-dictamen/pdf')->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());

        $other = $this->user('2021-0001');
        $this->assertNotSame($owner->id, $other->id);
        $this->actingAs($other)->getJson('/tramites/mi-dictamen/pdf')
            ->assertNotFound()->assertJsonPath('message', 'No tienes un dictamen emitido aún.');

        $this->actingAs($this->user('ADM-0001'))->get('/tramites/mi-dictamen/pdf')->assertForbidden();
    }

    public function test_mail_is_sent_for_ambos_and_email_but_not_in_app(): void
    {
        Mail::fake();
        $student = $this->user('2021-0001');
        $service = app(NotificacionService::class);

        $service->create($student->id, 'Solo app', 'Mensaje', 'in_app');
        Mail::assertNothingSent();

        $service->create($student->id, 'Ambos', 'Mensaje ambos', 'ambos');
        $service->create($student->id, 'Correo', 'Mensaje correo', 'email');

        Mail::assertSent(NotificacionMail::class, 2);
        Mail::assertSent(NotificacionMail::class, fn ($m) => $m->hasTo($student->email)
            && $m->titulo === 'Ambos' && $m->mensaje === 'Mensaje ambos');
    }

    public function test_mail_failure_does_not_fail_the_notification(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));
        $student = $this->user('2021-0001');

        $n = app(NotificacionService::class)->create($student->id, 'T', 'M', 'ambos');

        $this->assertDatabaseHas('notificaciones', ['id' => $n->id, 'tipo' => 'ambos']);
    }

    public function test_mail_renders_spanish_copy(): void
    {
        $html = (new NotificacionMail('Ana', 'Titulo', 'Cuerpo'))->render();
        $this->assertStringContainsString('Hola Ana,', $html);
        $this->assertStringContainsString('Sistema de Control y Administración de Titulación', $html);
    }

    public function test_export_csv_headers_rows_bom_and_filters(): void
    {
        $admin = $this->user('ADM-0001');
        $response = $this->actingAs($admin)->get('/admin/expedientes/export')->assertOk();
        $body = $response->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $body);
        $this->assertStringContainsString('attachment; filename=expedientes.csv', $response->headers->get('Content-Disposition'));
        $lines = array_values(array_filter(explode("\n", substr($body, 3))));
        $this->assertSame('Matrícula,Estudiante,"Opción Titulación",Avance,Estado,"Docs Aprobados","Docs Rechazados","Última Actualización"', trim($lines[0]));
        $this->assertCount(6, $lines);
        $this->assertMatchesRegularExpression('/%,/', $lines[1]);

        $filtered = $this->actingAs($admin)->get('/admin/expedientes/export?estatus=aprobado')->streamedContent();
        $rows = array_values(array_filter(explode("\n", substr($filtered, 3))));
        $this->assertCount(2, $rows);

        $searched = $this->actingAs($admin)->get('/admin/expedientes/export?search=2021-0003')->streamedContent();
        $this->assertStringContainsString('2021-0003', $searched);
        $this->assertCount(2, array_filter(explode("\n", substr($searched, 3))));
    }

    public function test_export_and_zip_require_administrativo(): void
    {
        $this->actingAs($this->user('2021-0001'))->get('/admin/expedientes/export')->assertForbidden();
        $this->actingAs($this->user('DOC-0001'))->get('/admin/expedientes/1/descargar')->assertForbidden();
    }

    public function test_zip_contains_existing_files_and_skips_missing(): void
    {
        Storage::fake('uploads');
        $ids = Documento::where('tramite_id', 1)->pluck('id')->all();
        $this->assertGreaterThanOrEqual(3, count($ids));

        Documento::where('tramite_id', 1)->update(['archivo_url' => 'uploads/1/missing.pdf']);
        Documento::whereKey($ids[0])->update(['archivo_url' => 'uploads/1/one.pdf']);
        Documento::whereKey($ids[1])->update(['archivo_url' => 'legacy_two.pdf']);
        Storage::disk('uploads')->put('uploads/1/one.pdf', 'ONE');
        Storage::disk('uploads')->put('uploads/legacy_two.pdf', 'TWO');

        $response = $this->actingAs($this->user('ADM-0001'))->get('/admin/expedientes/1/descargar')->assertOk();
        $this->assertSame('application/zip', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('expediente_1.zip', $response->headers->get('Content-Disposition'));

        $file = $response->baseResponse->getFile()->getPathname();
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($file) === true);
        $this->assertSame(2, $zip->numFiles);
        $this->assertSame('ONE', $zip->getFromName('one.pdf'));
        $this->assertSame('TWO', $zip->getFromName('legacy_two.pdf'));
        $zip->close();
    }

    public function test_zip_with_all_files_missing_is_empty_and_without_documents_404(): void
    {
        Storage::fake('uploads');
        $admin = $this->user('ADM-0001');
        Documento::where('tramite_id', 1)->update(['archivo_url' => 'uploads/1/missing.pdf']);

        $response = $this->actingAs($admin)->get('/admin/expedientes/1/descargar')->assertOk();
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($response->baseResponse->getFile()->getPathname()) === true);
        $this->assertSame(0, $zip->numFiles);

        $this->actingAs($admin)->getJson('/admin/expedientes/9999/descargar')
            ->assertNotFound()->assertJsonPath('message', 'No hay documentos para descargar.');
    }
}
