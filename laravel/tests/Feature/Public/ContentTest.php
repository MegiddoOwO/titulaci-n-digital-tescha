<?php

namespace Tests\Feature\Public;

use App\Models\Directorio;
use App\Models\Normativa;
use App\Models\OpcionTitulacion;
use App\Models\RequisitoFotografia;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ContentTest extends TestCase
{
    use DatabaseTransactions;

    public function test_normativa_is_public_active_only_and_ordered(): void
    {
        $inactive = Normativa::create(['titulo' => 'Oculta', 'contenido' => 'x', 'activo' => 0]);

        $res = $this->getJson('/normativa')->assertOk()
            ->assertJsonStructure([['id', 'titulo', 'contenido', 'categoria', 'modalidad_id', 'orden', 'modalidad_nombre']]);

        $this->assertCount(Normativa::where('activo', 1)->count(), $res->json());
        $this->assertNotContains($inactive->id, array_column($res->json(), 'id'));
        $orders = array_column($res->json(), 'orden');
        $sorted = $orders;
        sort($sorted);
        $this->assertSame($sorted, $orders);
    }

    public function test_normativa_modalidad_filter_keeps_general_entries(): void
    {
        $opcion = OpcionTitulacion::create(['nombre' => 'Opción filtro']);
        $other = OpcionTitulacion::create(['nombre' => 'Otra opción']);
        $general = Normativa::create(['titulo' => 'General', 'contenido' => 'x', 'modalidad_id' => null]);
        $specific = Normativa::create(['titulo' => 'Específica', 'contenido' => 'x', 'modalidad_id' => $opcion->id]);
        $foreign = Normativa::create(['titulo' => 'Ajena', 'contenido' => 'x', 'modalidad_id' => $other->id]);

        $rows = $this->getJson("/normativa?modalidad_id={$opcion->id}")->assertOk()->json();
        $ids = array_column($rows, 'id');

        $this->assertContains($general->id, $ids);
        $this->assertContains($specific->id, $ids);
        $this->assertNotContains($foreign->id, $ids);
        $this->assertSame('Opción filtro', collect($rows)->firstWhere('id', $specific->id)['modalidad_nombre']);
    }

    public function test_normativa_show(): void
    {
        $item = Normativa::where('activo', 1)->firstOrFail();

        $this->getJson("/normativa/{$item->id}")->assertOk()
            ->assertJsonPath('id', $item->id)->assertJsonPath('titulo', $item->titulo)->assertJsonStructure(['modalidad_nombre']);

        $item->update(['activo' => 0]);
        $this->getJson("/normativa/{$item->id}")->assertNotFound()->assertJsonPath('message', 'Normativa no encontrada.');
        $this->getJson('/normativa/99999999')->assertNotFound();
    }

    public function test_directorio_list_search_and_show(): void
    {
        $hidden = Directorio::create(['nombre' => 'Zeta Oculto', 'cargo' => 'C', 'departamento' => 'D', 'activo' => 0]);
        $visible = Directorio::create(['nombre' => 'Zeta Visible', 'cargo' => 'Buscador', 'departamento' => 'Qwerty', 'orden' => 200]);

        $all = $this->getJson('/directorio')->assertOk()
            ->assertJsonStructure([['id', 'nombre', 'cargo', 'departamento', 'email', 'telefono', 'extension']])->json();
        $this->assertCount(Directorio::where('activo', 1)->count(), $all);
        $this->assertNotContains($hidden->id, array_column($all, 'id'));

        $this->getJson('/directorio?search=Qwerty')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $visible->id);
        $this->getJson('/directorio?search=Buscador')->assertJsonCount(1);
        $this->getJson('/directorio?search=%20%20%20')->assertJsonCount(count($all));

        $this->getJson("/directorio/{$visible->id}")->assertOk()->assertJsonPath('nombre', 'Zeta Visible');
        $this->getJson("/directorio/{$hidden->id}")->assertNotFound()->assertJsonPath('message', 'Contacto no encontrado.');
    }

    public function test_requisitos_fotografia_is_public(): void
    {
        $hidden = RequisitoFotografia::create(['descripcion' => 'Oculto', 'orden' => 1, 'activo' => 0]);

        $rows = $this->getJson('/requisitos-fotografia')->assertOk()
            ->assertJsonStructure([['id', 'descripcion', 'orden']])->json();

        $this->assertCount(RequisitoFotografia::where('activo', 1)->count(), $rows);
        $this->assertNotContains($hidden->id, array_column($rows, 'id'));
    }
}
