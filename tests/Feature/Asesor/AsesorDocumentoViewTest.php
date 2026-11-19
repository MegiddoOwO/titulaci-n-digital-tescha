<?php

namespace Tests\Feature\Asesor;

use App\Models\Documento;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * GET /asesor/tramites/{tramite}/documentos/{documento} and the additive dashboard props.
 * Seed: DOC-0001 is assigned to tramites 1 and 4 (not 5); tramite 1 has 3 documents to review.
 */
class AsesorDocumentoViewTest extends TestCase
{
    use DatabaseTransactions;

    private const PDF = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function documentWithFile(int $tramiteId): Documento
    {
        Storage::fake('uploads');
        $doc = Documento::where('tramite_id', $tramiteId)->where('estatus', 'cargado')->firstOrFail();
        $doc->update(['archivo_url' => "uploads/{$tramiteId}/x.pdf", 'archivo_nombre' => 'Pago.pdf']);
        Storage::disk('uploads')->put($doc->archivo_url, self::PDF);

        return $doc;
    }

    public function test_assigned_asesor_opens_the_document_inline(): void
    {
        $doc = $this->documentWithFile(1);

        $response = $this->actingAs($this->user('DOC-0001'))->get("/asesor/tramites/1/documentos/{$doc->id}");

        $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('inline', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('Pago.pdf', $response->headers->get('Content-Disposition'));
    }

    public function test_unassigned_asesor_is_forbidden(): void
    {
        $doc = $this->documentWithFile(1);

        $this->actingAs($this->user('DOC-0005'))->get("/asesor/tramites/1/documentos/{$doc->id}")->assertForbidden();
    }

    public function test_student_and_guest_cannot_use_the_asesor_route(): void
    {
        $doc = $this->documentWithFile(1);

        $this->actingAs($this->user('2021-0001'))->get("/asesor/tramites/1/documentos/{$doc->id}")->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->get("/asesor/tramites/1/documentos/{$doc->id}")->assertRedirect('/login');
    }

    public function test_admin_route_is_unaffected_and_asesor_route_is_not_open_to_admin(): void
    {
        $doc = $this->documentWithFile(1);

        $this->actingAs($this->user('ADM-0001'))->get("/admin/tramites/1/documentos/{$doc->id}")->assertOk();
        $this->actingAs($this->user('ADM-0001'))->get("/asesor/tramites/1/documentos/{$doc->id}")->assertForbidden();
    }

    public function test_document_of_another_tramite_is_404(): void
    {
        $doc = $this->documentWithFile(1);

        // Tramite 4 is also assigned to DOC-0001, but the document belongs to tramite 1.
        $this->actingAs($this->user('DOC-0001'))->get("/asesor/tramites/4/documentos/{$doc->id}")->assertNotFound();
    }

    public function test_missing_file_is_404(): void
    {
        $doc = $this->documentWithFile(1);
        $asesor = $this->user('DOC-0001');

        $doc->update(['archivo_url' => null]);
        $this->actingAs($asesor)->get("/asesor/tramites/1/documentos/{$doc->id}")->assertNotFound();

        $doc->update(['archivo_url' => 'uploads/1/missing.pdf']);
        $this->actingAs($asesor)->get("/asesor/tramites/1/documentos/{$doc->id}")->assertNotFound();
    }

    public function test_dashboard_adds_revision_and_carga_props_without_touching_estudiantes(): void
    {
        $asesor = $this->user('DOC-0001');

        $this->actingAs($asesor)->get('/asesor')->assertInertia(fn (Assert $page) => $page
            ->component('Asesor/Home')
            ->has('estudiantes', 2)
            ->has('revision', 2)
            ->where('revision', fn ($rows) => collect($rows)->keyBy('tramite_id')->map(fn ($r) => [$r['por_revisar'], $r['rechazados']])->toArray()
                == [1 => [3, 0], 4 => [0, 0]])
            ->where('carga', ['actual' => 2, 'maxima' => 5])
        );
    }

    public function test_carga_maxima_null_is_passed_through_and_other_asesor_data_is_isolated(): void
    {
        $this->user('DOC-0001')->update(['carga_maxima' => null]);

        $this->actingAs($this->user('DOC-0001'))->get('/asesor')
            ->assertInertia(fn (Assert $page) => $page->where('carga', ['actual' => 2, 'maxima' => null]));

        // DOC-0005 is only assigned to tramite 4: nothing of tramite 1 leaks into its props.
        $this->actingAs($this->user('DOC-0005'))->get('/asesor')->assertInertia(fn (Assert $page) => $page
            ->has('estudiantes', 1)
            ->has('revision', 1)
            ->where('revision.0.tramite_id', 4));
    }

    public function test_plain_json_payload_is_unchanged(): void
    {
        $json = $this->actingAs($this->user('DOC-0001'))->getJson('/asesor')->assertOk()->json();

        $this->assertSame(['estudiantes'], array_keys($json));
    }
}
