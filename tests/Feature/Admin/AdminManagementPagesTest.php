<?php

namespace Tests\Feature\Admin;

use App\Models\Bitacora;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\SolicitudArcoService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminManagementPagesTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function admin(): Usuario
    {
        return $this->user('ADM-0001');
    }

    public function test_usuarios_page_carries_list_filters_and_lookups(): void
    {
        $total = Usuario::count();

        $this->actingAs($this->admin())->get('/admin/usuarios')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Usuarios')
            ->where('total', $total)->where('page', 1)->where('totalPages', (int) ceil($total / 20))
            ->has('usuarios', min(20, $total))
            ->where('filters', ['search' => '', 'rol' => ''])
            ->has('usuarios.0', fn (Assert $u) => $u->hasAll(['id', 'numero_control', 'email', 'nombre',
                'apellido_paterno', 'rol', 'activo', 'grado_academico', 'carga_maxima'])->missing('password_hash')->etc())
            ->has('docentes.0', fn (Assert $d) => $d->hasAll(['id', 'nombre_completo', 'carga_actual', 'carga_maxima'])->etc())
            ->has('opciones.0', fn (Assert $o) => $o->hasAll(['id', 'nombre'])));
    }

    public function test_usuarios_page_applies_search_rol_and_page_query_params(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get('/admin/usuarios?search=DOC-0001&rol=asesor')->assertInertia(fn (Assert $page) => $page
            ->has('usuarios', 1)
            ->where('usuarios.0.numero_control', 'DOC-0001')
            ->where('filters', ['search' => 'DOC-0001', 'rol' => 'asesor']));

        $asesores = Usuario::where('rol', 'asesor')->count();
        $this->actingAs($admin)->get('/admin/usuarios?rol=asesor')->assertInertia(fn (Assert $page) => $page
            ->where('total', $asesores)
            ->where('usuarios', fn ($rows) => collect($rows)->pluck('rol')->unique()->all() === ['asesor']));

        $this->actingAs($admin)->get('/admin/usuarios?page=999')->assertInertia(fn (Assert $page) => $page
            ->where('page', 999)->has('usuarios', 0));
        $this->actingAs($admin)->get('/admin/usuarios?page=-3')->assertInertia(fn (Assert $page) => $page
            ->where('page', 1));
    }

    public function test_usuarios_mutations_redirect_back_with_flash_or_the_spanish_guard_message(): void
    {
        $admin = $this->admin();
        $docente = $this->user('DOC-0001');

        $this->actingAs($admin)->from('/admin/usuarios?page=1')->put("/admin/usuarios/{$docente->id}/toggle")
            ->assertRedirect('/admin/usuarios?page=1')->assertSessionHas('success', 'Usuario desactivado.');

        $this->actingAs($admin)->from('/admin/usuarios')->delete("/admin/usuarios/{$admin->id}")
            ->assertRedirect('/admin/usuarios')
            ->assertSessionHasErrors(['usuario' => 'No puede eliminarse a sí mismo.']);

        $this->actingAs($admin)->from('/admin/usuarios')->post('/admin/usuarios', ['rol' => 'asesor'])
            ->assertSessionHasErrors(['numero_control' => 'Campos requeridos: numero_control, email, password, nombre, apellido_paterno, rol.']);
    }

    public function test_bitacora_page_paginates_with_decoded_detalle(): void
    {
        $entry = app(BitacoraService::class)->log($this->admin()->id, 'Prueba', 'tramites', 3, ['k' => 'v']);
        Bitacora::whereKey($entry->id)->update(['fecha' => now()->addDay()]);
        $total = Bitacora::count();

        $this->actingAs($this->admin())->get('/admin/bitacora')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Bitacora')
            ->where('total', $total)->where('page', 1)->where('totalPages', (int) ceil($total / 20))
            ->where('rows.0.id', $entry->id)
            ->where('rows.0.detalle', ['k' => 'v'])
            ->has('rows.0', fn (Assert $r) => $r->hasAll(['id', 'accion', 'entidad', 'entidad_id', 'detalle',
                'ip_origen', 'fecha', 'usuario_nombre'])));

        $this->actingAs($this->admin())->get('/admin/bitacora?page=2')->assertInertia(fn (Assert $page) => $page
            ->where('page', 2)->has('rows', max(0, min(20, $total - 20))));
    }

    public function test_catalogos_page_loads_only_the_requested_tab(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get('/admin/catalogos')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Catalogos')->where('tab', 'opciones')
            ->has('items.0', fn (Assert $i) => $i->hasAll(['id', 'nombre', 'fecha_limite', 'activo'])->etc()));

        $this->actingAs($admin)->get('/admin/catalogos?tab=normativa')->assertInertia(fn (Assert $page) => $page
            ->where('tab', 'normativa')
            ->has('items.0', fn (Assert $i) => $i->hasAll(['id', 'titulo', 'contenido', 'categoria', 'orden', 'activo'])->etc()));

        $this->actingAs($admin)->get('/admin/catalogos?tab=directorio')->assertInertia(fn (Assert $page) => $page
            ->where('tab', 'directorio')
            ->has('items.0', fn (Assert $i) => $i->hasAll(['id', 'nombre', 'cargo', 'departamento', 'activo'])->etc()));

        $this->actingAs($admin)->get('/admin/catalogos?tab=usuarios')->assertInertia(fn (Assert $page) => $page
            ->where('tab', 'opciones'));
    }

    public function test_catalogo_mutations_redirect_back_to_the_tab_and_json_endpoints_still_answer_json(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->from('/admin/catalogos?tab=directorio')->post('/admin/catalogos/directorio', [
            'nombre' => 'Prueba', 'cargo' => 'Jefa', 'departamento' => 'Titulación',
        ])->assertRedirect('/admin/catalogos?tab=directorio')->assertSessionHas('success', 'Creado correctamente.');

        $this->actingAs($admin)->from('/admin/catalogos')->post('/admin/catalogos/normativa', ['titulo' => 'Sin contenido'])
            ->assertSessionHasErrors(['contenido' => 'El contenido es requerido.']);

        $this->actingAs($admin)->getJson('/admin/catalogos/normativa')->assertOk()->assertJsonStructure([['id', 'titulo']]);
    }

    public function test_arco_page_lists_requests_and_resolution_redirects_back(): void
    {
        $student = $this->user('2021-0001');
        $solicitud = app(SolicitudArcoService::class)->create($student->id, 'acceso', 'Detalle de prueba');

        $this->actingAs($this->admin())->get('/admin/arco')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Arco')
            ->where('solicitudes', fn ($rows) => collect($rows)->contains('id', $solicitud->id))
            ->has('solicitudes.0', fn (Assert $s) => $s->hasAll(['id', 'tipo', 'estado', 'detalle_solicitud',
                'respuesta', 'fecha_solicitud', 'fecha_resolucion', 'numero_control', 'nombre_completo'])));

        $this->actingAs($this->admin())->from('/admin/arco')
            ->put("/admin/solicitudes-arco/{$solicitud->id}", ['estado' => 'completada', 'respuesta' => 'Listo'])
            ->assertRedirect('/admin/arco')->assertSessionHas('success', 'Solicitud actualizada.');
        $this->assertSame('completada', $solicitud->fresh()->estado);

        $this->actingAs($this->admin())->from('/admin/arco')
            ->put("/admin/solicitudes-arco/{$solicitud->id}", ['estado' => 'otro'])
            ->assertSessionHasErrors(['estado' => 'Estado inválido.']);

        $this->actingAs($this->admin())->getJson('/admin/solicitudes-arco')->assertOk();
    }

    public function test_pages_reject_guests_and_other_roles(): void
    {
        $urls = ['/admin/usuarios', '/admin/bitacora', '/admin/catalogos', '/admin/arco'];

        foreach ($urls as $url) {
            $this->get($url)->assertRedirect('/login');
        }

        foreach ($urls as $url) {
            $this->actingAs($this->user('DOC-0001'))->get($url)->assertForbidden();
            $this->actingAs($this->user('2021-0001'))->get($url)->assertForbidden();
        }
    }
}
