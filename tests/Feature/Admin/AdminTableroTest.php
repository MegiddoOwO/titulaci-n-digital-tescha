<?php

namespace Tests\Feature\Admin;

use App\Models\Documento;
use App\Models\Tramite;
use App\Models\Usuario;
use App\Services\Admin\AdminTableroService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTableroTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    public function test_resumen_exposes_tablero_props_matching_the_seed(): void
    {
        $this->actingAs($this->user('ADM-0001'))->get('/admin')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Home')
            ->has('stats.por_estatus')
            ->has('tablero.estatus', 5)
            ->where('tablero.estatus.0', ['estatus' => 'en_proceso', 'total' => 2, 'rojo' => 0, 'ambar' => 2, 'verde' => 0])
            ->where('tablero.estatus.1', ['estatus' => 'en_revision', 'total' => 1, 'rojo' => 0, 'ambar' => 1, 'verde' => 0])
            ->where('tablero.estatus.2', ['estatus' => 'aprobado', 'total' => 1, 'rojo' => 0, 'ambar' => 0, 'verde' => 1])
            ->where('tablero.estatus.3', ['estatus' => 'rechazado', 'total' => 1, 'rojo' => 1, 'ambar' => 0, 'verde' => 0])
            ->where('tablero.estatus.4', ['estatus' => 'completado', 'total' => 0, 'rojo' => 0, 'ambar' => 0, 'verde' => 0])
            ->has('tablero.semanal', 8)
            ->has('tablero.semanal.0', fn (Assert $w) => $w->has('semana')->has('documentos'))
            ->where('tablero.pendientes.total', 4)
            ->has('tablero.pendientes.filas', 4)
            // Red first: the rejected trámite (id 5) leads the table.
            ->where('tablero.pendientes.filas.0.id', 5)
            ->where('tablero.pendientes.filas.0.color_semaforo', 'rojo')
            ->where('tablero.pendientes.filas.0.docs_rechazados', 1)
            ->has('tablero.pendientes.filas.0', fn (Assert $r) => $r
                ->hasAll(['id', 'numero_control', 'nombre_completo', 'estatus', 'color_semaforo', 'docs_rechazados', 'docs_pendientes'])));
    }

    public function test_stats_json_contract_is_unchanged(): void
    {
        $admin = $this->user('ADM-0001');

        $this->actingAs($admin)->getJson('/admin/stats')->assertOk()
            ->assertJsonMissingPath('tablero')
            ->assertJsonStructure(['total_activos', 'pendientes_revision', 'dictamenes_emitidos', 'en_proceso', 'por_estatus']);
        $this->actingAs($admin)->getJson('/admin')->assertOk()->assertJsonMissingPath('tablero');
    }

    public function test_weekly_series_buckets_reviews_and_fills_empty_weeks_with_zero(): void
    {
        $now = CarbonImmutable::parse('2026-11-18 10:00:00');
        Documento::query()->update(['fecha_revision' => null]);
        $ids = Documento::query()->limit(3)->pluck('id');
        Documento::whereKey($ids[0])->update(['fecha_revision' => '2026-11-17 09:00:00']);
        Documento::whereKey($ids[1])->update(['fecha_revision' => '2026-11-16 00:30:00']);
        Documento::whereKey($ids[2])->update(['fecha_revision' => '2026-10-06 12:00:00']);
        // Older than the 8-week window: ignored.
        Documento::query()->whereNotIn('id', $ids->all())->limit(1)->update(['fecha_revision' => '2026-01-05 12:00:00']);

        $series = app(AdminTableroService::class)->tablero($now)['semanal'];

        $this->assertCount(8, $series);
        $this->assertSame('2026-09-28', $series[0]['semana']);
        $this->assertSame('2026-11-16', $series[7]['semana']);
        $this->assertSame(2, $series[7]['documentos']);
        $this->assertSame(1, $series[1]['documentos']); // week of 2026-10-05
        $this->assertSame(3, array_sum(array_column($series, 'documentos')));
    }

    public function test_empty_state_has_zero_counts_and_no_rows(): void
    {
        Tramite::query()->update(['activo' => 0]);

        $this->actingAs($this->user('ADM-0001'))->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->where('tablero.estatus.0.total', 0)
            ->where('tablero.pendientes.total', 0)
            ->where('tablero.pendientes.filas', []));
    }

    public function test_non_admin_roles_cannot_load_the_resumen(): void
    {
        foreach (['2021-0001', 'DOC-0001'] as $numero) {
            $this->actingAs($this->user($numero))->get('/admin')->assertForbidden();
        }
    }
}
