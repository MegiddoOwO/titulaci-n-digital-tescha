<?php

namespace Tests\Feature\Admin;

use App\Models\Directorio;
use App\Models\Normativa;
use App\Models\OpcionTitulacion;
use App\Models\TipoDocumento;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): Usuario
    {
        return Usuario::where('numero_control', 'ADM-0001')->firstOrFail();
    }

    public function test_opciones_crud_and_toggle(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->getJson('/admin/catalogos/opciones')->assertOk()
            ->assertJsonStructure([['id', 'nombre', 'fecha_limite', 'descripcion', 'activo']])
            ->assertJsonCount(OpcionTitulacion::count());

        $id = $this->actingAs($admin)->postJson('/admin/catalogos/opciones', [
            'nombre' => '  Opción de prueba  ', 'fecha_limite' => '2027-01-31',
        ])->assertOk()->assertJsonPath('message', 'Creado correctamente.')->json('id');

        $opcion = OpcionTitulacion::findOrFail($id);
        $this->assertSame('Opción de prueba', $opcion->nombre);
        $this->assertSame('2027-01-31', $opcion->fecha_limite->toDateString());
        $this->assertTrue($opcion->activo);

        $this->actingAs($admin)->putJson("/admin/catalogos/opciones/{$id}", ['nombre' => 'Renombrada'])
            ->assertOk()->assertExactJson(['message' => 'Actualizado correctamente.']);
        $this->assertSame('2027-01-31', $opcion->fresh()->fecha_limite->toDateString()); // absent => untouched

        $this->actingAs($admin)->putJson("/admin/catalogos/opciones/{$id}", ['nombre' => 'Renombrada', 'fecha_limite' => null])->assertOk();
        $this->assertNull($opcion->fresh()->fecha_limite);

        $this->actingAs($admin)->putJson("/admin/catalogos/opciones/{$id}/toggle")
            ->assertOk()->assertExactJson(['message' => 'Estado actualizado.']);
        $this->assertFalse($opcion->fresh()->activo);
        $this->actingAs($admin)->putJson("/admin/catalogos/opciones/{$id}/toggle");
        $this->assertTrue($opcion->fresh()->activo);
    }

    public function test_opciones_validation(): void
    {
        $admin = $this->admin();
        $existing = OpcionTitulacion::firstOrFail();

        $this->actingAs($admin)->postJson('/admin/catalogos/opciones', ['nombre' => '   '])
            ->assertStatus(422)->assertJsonPath('errors.nombre.0', 'El nombre es requerido.');
        $this->actingAs($admin)->postJson('/admin/catalogos/opciones', ['nombre' => $existing->nombre])
            ->assertStatus(422)->assertJsonPath('errors.nombre.0', 'Ya existe un registro con ese nombre.');
        $this->actingAs($admin)->postJson('/admin/catalogos/opciones', ['nombre' => 'X', 'fecha_limite' => 'mañana'])
            ->assertStatus(422)->assertJsonValidationErrors(['fecha_limite']);
        $this->actingAs($admin)->putJson("/admin/catalogos/opciones/{$existing->id}", [])->assertStatus(422);
        $this->actingAs($admin)->putJson('/admin/catalogos/opciones/99999999', ['nombre' => 'X'])->assertNotFound();
        $this->actingAs($admin)->putJson('/admin/catalogos/opciones/99999999/toggle')->assertNotFound();

        // Keeping the own name on update is not a duplicate.
        $this->actingAs($admin)->putJson("/admin/catalogos/opciones/{$existing->id}", ['nombre' => $existing->nombre])->assertOk();
    }

    public function test_tipos_documento_crud_only_touches_nombre(): void
    {
        $admin = $this->admin();
        $tipo = TipoDocumento::firstOrFail();

        $id = $this->actingAs($admin)->postJson('/admin/catalogos/tipos-documento', [
            'nombre' => 'Constancia nueva', 'obligatorio' => 0, 'orden' => 99,
        ])->assertOk()->json('id');

        $created = TipoDocumento::findOrFail($id);
        $this->assertSame('Constancia nueva', $created->nombre);
        $this->assertTrue($created->obligatorio); // extra columns ignored, DB default applies
        $this->assertSame('PDF', $created->formato_permitido);

        $this->actingAs($admin)->putJson("/admin/catalogos/tipos-documento/{$id}", ['nombre' => 'Constancia v2'])->assertOk();
        $this->assertSame('Constancia v2', $created->fresh()->nombre);

        $this->actingAs($admin)->putJson("/admin/catalogos/tipos-documento/{$tipo->id}/toggle")->assertOk();
        $this->assertNotSame((bool) $tipo->activo, (bool) $tipo->fresh()->activo);

        $this->actingAs($admin)->postJson('/admin/catalogos/tipos-documento', [])
            ->assertStatus(422)->assertJsonPath('errors.nombre.0', 'El nombre es requerido.');
        $this->actingAs($admin)->getJson('/admin/catalogos/tipos-documento')->assertOk()
            ->assertJsonCount(TipoDocumento::count());
    }

    public function test_normativa_crud(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->getJson('/admin/catalogos/normativa')->assertOk()
            ->assertJsonCount(Normativa::count())->assertJsonStructure([['id', 'titulo', 'contenido', 'activo']]);

        $id = $this->actingAs($admin)->postJson('/admin/catalogos/normativa', [
            'titulo' => 'Lineamiento', 'contenido' => 'Texto', 'categoria' => 'General', 'orden' => 9,
        ])->assertOk()->json('id');
        $this->assertDatabaseHas('normativa', ['id' => $id, 'titulo' => 'Lineamiento', 'categoria' => 'General', 'orden' => 9]);

        $this->actingAs($admin)->putJson("/admin/catalogos/normativa/{$id}", ['titulo' => 'Lineamiento 2'])->assertOk();
        $this->assertDatabaseHas('normativa', ['id' => $id, 'titulo' => 'Lineamiento 2', 'contenido' => 'Texto']);

        $this->actingAs($admin)->putJson("/admin/catalogos/normativa/{$id}/toggle")->assertOk();
        $this->assertDatabaseHas('normativa', ['id' => $id, 'activo' => 0]);

        $this->actingAs($admin)->postJson('/admin/catalogos/normativa', ['titulo' => 'Sin contenido'])
            ->assertStatus(422)->assertJsonPath('errors.contenido.0', 'El contenido es requerido.');
        $this->actingAs($admin)->postJson('/admin/catalogos/normativa', ['contenido' => 'x'])
            ->assertStatus(422)->assertJsonPath('errors.titulo.0', 'El título es requerido.');
        $this->actingAs($admin)->postJson('/admin/catalogos/normativa', ['titulo' => 'T', 'contenido' => 'x', 'modalidad_id' => 99999])
            ->assertStatus(422)->assertJsonValidationErrors(['modalidad_id']);
    }

    public function test_directorio_crud(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->getJson('/admin/catalogos/directorio')->assertOk()->assertJsonCount(Directorio::count());

        $id = $this->actingAs($admin)->postJson('/admin/catalogos/directorio', [
            'nombre' => 'Ana Pérez', 'cargo' => 'Jefa', 'departamento' => 'Titulación', 'email' => 'ana@tescha.edu.mx', 'extension' => '101',
        ])->assertOk()->json('id');
        $this->assertDatabaseHas('directorio', ['id' => $id, 'nombre' => 'Ana Pérez', 'extension' => '101']);

        $this->actingAs($admin)->putJson("/admin/catalogos/directorio/{$id}", ['nombre' => 'Ana P.', 'cargo' => 'Directora'])->assertOk();
        $this->assertDatabaseHas('directorio', ['id' => $id, 'nombre' => 'Ana P.', 'cargo' => 'Directora', 'departamento' => 'Titulación']);

        $this->actingAs($admin)->putJson("/admin/catalogos/directorio/{$id}/toggle")->assertOk();
        $this->assertDatabaseHas('directorio', ['id' => $id, 'activo' => 0]);

        $this->actingAs($admin)->postJson('/admin/catalogos/directorio', ['nombre' => 'Solo nombre'])
            ->assertStatus(422)->assertJsonValidationErrors(['cargo', 'departamento']);
        $this->actingAs($admin)->postJson('/admin/catalogos/directorio', ['nombre' => 'N', 'cargo' => 'C', 'departamento' => 'D', 'email' => 'no'])
            ->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_unknown_catalog_is_404(): void
    {
        $this->actingAs($this->admin())->getJson('/admin/catalogos/usuarios')->assertNotFound();
    }

    public function test_role_isolation(): void
    {
        foreach (['2021-0001', 'DOC-0001'] as $numero) {
            $user = Usuario::where('numero_control', $numero)->firstOrFail();
            foreach (['opciones', 'tipos-documento', 'normativa', 'directorio'] as $catalogo) {
                $this->actingAs($user)->getJson("/admin/catalogos/{$catalogo}")->assertForbidden();
                $this->actingAs($user)->postJson("/admin/catalogos/{$catalogo}", ['nombre' => 'x'])->assertForbidden();
                $this->actingAs($user)->putJson("/admin/catalogos/{$catalogo}/1", ['nombre' => 'x'])->assertForbidden();
                $this->actingAs($user)->putJson("/admin/catalogos/{$catalogo}/1/toggle")->assertForbidden();
            }
        }
    }
}
