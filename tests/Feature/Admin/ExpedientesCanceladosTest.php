<?php

namespace Tests\Feature\Admin;

use App\Models\Bitacora;
use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExpedientesCanceladosTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): Usuario
    {
        return Usuario::where('numero_control', 'ADM-0001')->firstOrFail();
    }

    private function ids(array $json): array
    {
        return collect($json['expedientes'])->pluck('id')->sort()->values()->all();
    }

    public function test_default_list_is_active_only_and_activo_zero_lists_cancelled(): void
    {
        $admin = $this->admin();
        $default = $this->actingAs($admin)->getJson('/admin/expedientes')->assertOk()->json();
        $this->assertSame(5, $default['total']);
        $this->assertSame(0, $this->actingAs($admin)->getJson('/admin/expedientes?activo=0')->json('total'));

        $this->actingAs($admin)->putJson('/admin/expedientes/3/toggle')->assertOk();

        $this->assertNotContains(3, $this->ids($this->actingAs($admin)->getJson('/admin/expedientes')->json()));
        $cancelled = $this->actingAs($admin)->getJson('/admin/expedientes?activo=0')->assertOk()->json();
        $this->assertSame([3], $this->ids($cancelled));
        $this->assertSame(['expedientes', 'total', 'page', 'totalPages'], array_keys($cancelled));
        $control = $cancelled['expedientes'][0]['numero_control'];
        $this->assertSame([3], $this->ids($this->actingAs($admin)->getJson('/admin/expedientes?activo=0&search='.$control)->json()));
        $this->assertSame(4, $this->actingAs($admin)->getJson('/admin/expedientes?activo=1')->json('total'));
    }

    public function test_reactivation_only_flips_activo_and_writes_no_bitacora(): void
    {
        $admin = $this->admin();
        $before = Tramite::find(3)->only(['estatus', 'fecha_fin']);
        $bitacora = Bitacora::count();

        $this->actingAs($admin)->putJson('/admin/expedientes/3/toggle')->assertOk();
        $this->actingAs($admin)->putJson('/admin/expedientes/3/toggle')
            ->assertOk()->assertExactJson(['message' => 'Trámite reactivado.', 'activo' => 1]);

        $this->assertSame($before, Tramite::find(3)->only(['estatus', 'fecha_fin']));
        $this->assertSame($bitacora, Bitacora::count());
        $this->assertContains(3, $this->ids($this->actingAs($admin)->getJson('/admin/expedientes')->json()));
        $this->assertSame(0, $this->actingAs($admin)->getJson('/admin/expedientes?activo=0')->json('total'));
    }

    public function test_update_of_cancelled_tramite_is_still_404(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->putJson('/admin/expedientes/3/toggle')->assertOk();
        $this->actingAs($admin)->putJson('/admin/expedientes/3', ['titulo_proyecto' => 'x'])->assertNotFound();
    }

    public function test_inertia_filters_include_activo_and_invalid_value_is_rejected(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->get('/admin/expedientes?activo=0')->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Admin/Expedientes/Index')->where('filters.activo', '0'));
        $this->actingAs($admin)->getJson('/admin/expedientes?activo=2')->assertStatus(422);
    }

    public function test_role_isolation(): void
    {
        $this->get('/admin/expedientes?activo=0')->assertRedirect('/login');
        foreach (['DOC-0001', '2021-0001'] as $n) {
            $u = Usuario::where('numero_control', $n)->firstOrFail();
            $this->actingAs($u)->get('/admin/expedientes?activo=0')->assertForbidden();
            $this->actingAs($u)->get('/admin/expedientes/3')->assertForbidden();
        }
    }
}
