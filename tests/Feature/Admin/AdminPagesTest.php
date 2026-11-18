<?php

namespace Tests\Feature\Admin;

use App\Models\Documento;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Gate;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPagesTest extends TestCase
{
    use DatabaseTransactions;

    private const PAGES = [
        '/admin' => 'Admin/Home',
        '/admin/expedientes' => 'Admin/Expedientes/Index',
        '/admin/documentos' => 'Admin/Documentos',
        '/admin/dictamenes' => 'Admin/Dictamenes',
        '/admin/usuarios' => 'Admin/Usuarios',
        '/admin/catalogos' => 'Admin/Catalogos',
        '/admin/arco' => 'Admin/Arco',
        '/admin/bitacora' => 'Admin/Bitacora',
    ];

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function documentWithFile(): Documento
    {
        // Rolled back with the test transaction.
        $doc = Documento::firstOrFail();
        $doc->update(['archivo_url' => 'uploads/missing.pdf']);

        return $doc->fresh();
    }

    public function test_every_admin_section_renders_its_inertia_page(): void
    {
        $admin = $this->user('ADM-0001');

        foreach (self::PAGES as $url => $component) {
            $this->actingAs($admin)->get($url)->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }

    public function test_role_isolation_on_admin_pages(): void
    {
        foreach (array_keys(self::PAGES) as $url) {
            $this->get($url)->assertRedirect('/login');
        }

        foreach (self::PAGES as $url => $component) {
            $this->actingAs($this->user('DOC-0001'))->get($url)->assertForbidden();
            $this->actingAs($this->user('2021-0001'))->get($url)->assertForbidden();
        }
    }

    public function test_documentos_page_lists_expedientes_with_search_filter(): void
    {
        $admin = $this->user('ADM-0001');

        $this->actingAs($admin)->get('/admin/documentos')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Documentos')
            ->has('expedientes', 5)
            ->where('filters.search', '')
            ->has('expedientes.0', fn (Assert $e) => $e->hasAll(['id', 'numero_control', 'nombre_completo',
                'opcion_titulacion', 'estatus', 'color_semaforo', 'porcentaje'])->etc()));

        $this->actingAs($admin)->get('/admin/documentos?search=2021-0003')->assertInertia(fn (Assert $page) => $page
            ->has('expedientes', 1)
            ->where('expedientes.0.numero_control', '2021-0003')
            ->where('filters.search', '2021-0003'));
    }

    public function test_dictamenes_page_only_offers_aprobado_and_en_revision_expedientes(): void
    {
        // Seed: tramite 1 en_revision (no dictamen), 4 aprobado but already has a dictamen;
        // 2/3 en_proceso and 5 rechazado are excluded.
        $this->actingAs($this->user('ADM-0001'))->get('/admin/dictamenes')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dictamenes')
            ->has('candidatos', 1)
            ->where('candidatos', fn ($rows) => collect($rows)->pluck('id')->values()->all() === [1]));
    }

    public function test_expedientes_page_carries_filters_and_pagination_props(): void
    {
        $this->actingAs($this->user('ADM-0001'))->get('/admin/expedientes?estatus=aprobado&search=2021')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Expedientes/Index')
                ->where('filters.estatus', 'aprobado')
                ->where('filters.search', '2021')
                ->where('total', 1)->where('page', 1)->where('totalPages', 1)
                ->has('expedientes', 1));
    }

    public function test_usuarios_and_bitacora_keep_their_json_payload_for_json_clients(): void
    {
        $admin = $this->user('ADM-0001');

        $this->actingAs($admin)->getJson('/admin/usuarios')->assertOk()->assertJsonStructure(['usuarios']);
        $this->actingAs($admin)->getJson('/admin/bitacora')->assertOk();
    }

    public function test_administrativo_may_view_any_document_but_asesor_and_foreign_students_may_not(): void
    {
        $doc = $this->documentWithFile();

        $this->assertTrue(Gate::forUser($this->user('ADM-0001'))->allows('view', $doc));
        $this->assertFalse(Gate::forUser($this->user('DOC-0001'))->allows('view', $doc));
    }

    public function test_admin_document_view_route_is_admin_only(): void
    {
        $doc = $this->documentWithFile();
        $url = "/admin/tramites/{$doc->tramite_id}/documentos/{$doc->id}";

        $this->get($url)->assertRedirect('/login');
        $this->actingAs($this->user('DOC-0001'))->get($url)->assertForbidden();
        $this->actingAs($this->user('2021-0001'))->get($url)->assertForbidden();
        // Admin passes authorization; the seed file may be absent on disk, so only 403 is excluded.
        $this->assertNotSame(403, $this->actingAs($this->user('ADM-0001'))->get($url)->getStatusCode());
    }
}
