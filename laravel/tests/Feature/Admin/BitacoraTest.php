<?php

namespace Tests\Feature\Admin;

use App\Models\Bitacora;
use App\Models\Usuario;
use App\Services\BitacoraService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BitacoraTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): Usuario
    {
        return Usuario::where('numero_control', 'ADM-0001')->firstOrFail();
    }

    public function test_lists_newest_first_with_user_name_and_decoded_detail(): void
    {
        $admin = $this->admin();
        $entry = app(BitacoraService::class)->log($admin->id, 'Prueba', 'tramites', 3, ['k' => 'v']);
        Bitacora::whereKey($entry->id)->update(['fecha' => now()->addDay()]);

        $res = $this->actingAs($admin)->getJson('/admin/bitacora')->assertOk()
            ->assertJsonStructure(['rows' => [['id', 'accion', 'entidad', 'entidad_id', 'detalle', 'ip_origen', 'fecha', 'usuario_nombre']],
                'total', 'page', 'totalPages'])
            ->assertJsonPath('total', Bitacora::count())
            ->assertJsonPath('rows.0.id', $entry->id)
            ->assertJsonPath('rows.0.accion', 'Prueba')
            ->assertJsonPath('rows.0.detalle', ['k' => 'v'])
            ->assertJsonPath('rows.0.usuario_nombre', trim($admin->nombre.' '.$admin->apellido_paterno));
        $this->assertLessThanOrEqual(20, count($res->json('rows')));
    }

    public function test_pagination_and_clamping(): void
    {
        $admin = $this->admin();
        $total = Bitacora::count();

        $page = $this->actingAs($admin)->getJson('/admin/bitacora?limit=3&page=2')->assertOk()
            ->assertJsonPath('page', 2)->assertJsonPath('totalPages', (int) ceil($total / 3));
        $this->assertCount(min(3, max(0, $total - 3)), $page->json('rows'));

        $first = $this->actingAs($admin)->getJson('/admin/bitacora?limit=3&page=1')->json('rows');
        $this->assertNotSame(array_column($first, 'id'), array_column($page->json('rows'), 'id'));

        // limit capped at 50, page floor at 1
        $this->actingAs($admin)->getJson('/admin/bitacora?limit=500&page=-1')
            ->assertJsonPath('page', 1)->assertJsonPath('totalPages', (int) ceil($total / 50));
    }

    public function test_user_less_entries_have_null_name(): void
    {
        Bitacora::create(['usuario_id' => null, 'accion' => 'Sistema', 'entidad' => null, 'fecha' => now()->addDays(2)]);

        $this->actingAs($this->admin())->getJson('/admin/bitacora')
            ->assertJsonPath('rows.0.accion', 'Sistema')->assertJsonPath('rows.0.usuario_nombre', null);
    }
}
