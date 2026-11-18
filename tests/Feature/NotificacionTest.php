<?php

namespace Tests\Feature;

use App\Models\Notificacion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class NotificacionTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function notify(Usuario $user, string $titulo, bool $read = false): Notificacion
    {
        return Notificacion::create([
            'usuario_id' => $user->id, 'titulo' => $titulo, 'mensaje' => 'm', 'leida' => $read ? 1 : 0,
        ]);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/notificaciones')->assertUnauthorized();
        $this->putJson('/notificaciones/1/leida')->assertUnauthorized();
        $this->putJson('/notificaciones/leer-todas')->assertUnauthorized();
    }

    public function test_lists_only_own_notifications_with_unread_count(): void
    {
        $a = $this->user('2021-0004');
        $b = $this->user('2021-0005');
        Notificacion::where('usuario_id', $a->id)->delete();
        $one = $this->notify($a, 'Una');
        $two = $this->notify($a, 'Dos', read: true);
        $foreign = $this->notify($b, 'Ajena');

        $res = $this->actingAs($a)->getJson('/notificaciones')->assertOk()
            ->assertJsonStructure(['notificaciones' => [['id', 'usuario_id', 'tipo', 'titulo', 'mensaje', 'leida', 'fecha_lectura', 'tramite_id', 'created_at']], 'noLeidas'])
            ->assertJsonPath('noLeidas', 1);
        $ids = array_column($res->json('notificaciones'), 'id');
        $this->assertEqualsCanonicalizing([$one->id, $two->id], $ids);
        $this->assertNotContains($foreign->id, $ids);

        $unread = $this->actingAs($a)->getJson('/notificaciones?no_leidas=true')->json('notificaciones');
        $this->assertSame([$one->id], array_column($unread, 'id'));
    }

    public function test_list_is_capped_at_50_newest_first(): void
    {
        $user = $this->user('2021-0004');
        Notificacion::where('usuario_id', $user->id)->delete();
        for ($i = 1; $i <= 55; $i++) {
            $this->notify($user, "N{$i}");
        }

        $res = $this->actingAs($user)->getJson('/notificaciones')->assertJsonPath('noLeidas', 55);
        $this->assertCount(50, $res->json('notificaciones'));
        $this->assertSame('N55', $res->json('notificaciones.0.titulo'));
    }

    public function test_mark_one_read_is_scoped_to_owner(): void
    {
        $a = $this->user('2021-0004');
        $b = $this->user('2021-0005');
        $mine = $this->notify($a, 'Mía');
        $theirs = $this->notify($b, 'Suya');

        $this->actingAs($a)->putJson("/notificaciones/{$mine->id}/leida")->assertOk()
            ->assertExactJson(['message' => 'Notificación marcada como leída.']);
        $this->assertTrue($mine->fresh()->leida);
        $this->assertNotNull($mine->fresh()->fecha_lectura);

        // Someone else's id: success answer (Express parity) but nothing changes.
        $this->actingAs($a)->putJson("/notificaciones/{$theirs->id}/leida")->assertOk();
        $this->assertFalse($theirs->fresh()->leida);
    }

    public function test_mark_all_read_only_affects_current_user(): void
    {
        $a = $this->user('2021-0004');
        $b = $this->user('2021-0005');
        $this->notify($a, 'A1');
        $this->notify($a, 'A2');
        $other = $this->notify($b, 'B1');

        $this->actingAs($a)->putJson('/notificaciones/leer-todas')->assertOk()
            ->assertExactJson(['message' => 'Todas las notificaciones marcadas como leídas.']);

        $this->assertSame(0, Notificacion::where('usuario_id', $a->id)->where('leida', 0)->count());
        $this->assertFalse($other->fresh()->leida);
        $this->actingAs($a)->getJson('/notificaciones')->assertJsonPath('noLeidas', 0);
    }

    public function test_every_role_can_use_notifications(): void
    {
        foreach (['2021-0001', 'DOC-0001', 'ADM-0001'] as $numero) {
            $this->actingAs($this->user($numero))->getJson('/notificaciones')->assertOk();
        }
    }

    public function test_admin_bell_flow_marks_all_read_without_touching_other_users(): void
    {
        $admin = $this->user('ADM-0001');
        $student = $this->user('2021-0005');
        $mine = $this->notify($admin, 'Admin 1');
        $this->notify($admin, 'Admin 2');
        $theirs = $this->notify($student, 'Student 1');

        $before = $this->actingAs($admin)->getJson('/notificaciones')->json('noLeidas');
        $this->assertGreaterThanOrEqual(2, $before);

        $this->actingAs($admin)->putJson('/notificaciones/leer-todas')->assertOk();

        $this->actingAs($admin)->getJson('/notificaciones')->assertJsonPath('noLeidas', 0);
        $this->assertTrue($mine->fresh()->leida);
        $this->assertFalse($theirs->fresh()->leida);
    }
}
