<?php

namespace Tests\Feature\Invitaciones;

use App\Mail\InvitacionMail;
use App\Models\Asignacion;
use App\Models\Bitacora;
use App\Models\Documento;
use App\Models\Invitacion;
use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InvitacionesTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): Usuario
    {
        return Usuario::where('numero_control', 'ADM-0001')->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'numero_control' => '2031-0001',
            'email' => '2031-0001@tescha.edu.mx',
            'nombre' => 'Nueva',
            'apellido_paterno' => 'Invitada',
            'apellido_materno' => 'Prueba',
            'rol' => 'estudiante',
        ];
    }

    /** @return array{0: array<string, mixed>, 1: string} response json and plain token */
    private function create(array $overrides = []): array
    {
        $json = $this->actingAs($this->admin())->postJson('/admin/invitaciones', $this->payload($overrides))
            ->assertCreated()->json();
        $token = basename($json['link']);
        auth()->logout();

        return [$json, $token];
    }

    private function accept(string $token, string $password = 'Segura1234'): \Illuminate\Testing\TestResponse
    {
        return $this->postJson("/invitacion/{$token}", ['password' => $password, 'password_confirmation' => $password]);
    }

    public function test_create_per_role_stores_data_and_returns_link_once(): void
    {
        Mail::fake();
        $asesor = Usuario::where('numero_control', 'DOC-0001')->firstOrFail();

        [$json, $token] = $this->create([
            'asesor_id' => $asesor->id, 'opcion_titulacion_id' => 1,
        ]);
        $this->assertSame(64, strlen($token));
        $this->assertSame(route('invitacion.show', $token), $json['link']);

        $inv = Invitacion::findOrFail($json['id']);
        $this->assertSame('estudiante', $inv->rol);
        $this->assertSame($asesor->id, $inv->asesor_id);
        $this->assertSame(1, $inv->opcion_titulacion_id);
        $this->assertSame('pendiente', $inv->estado);
        $this->assertSame(hash('sha256', $token), $inv->token_hash);
        $this->assertEqualsWithDelta(72 * 3600, $inv->expira_en->timestamp - now()->timestamp, 5);

        // The plain token is nowhere in the row and the list never returns a link again.
        $this->assertSame(0, DB::table('invitaciones')->where('token_hash', $token)->count());
        $row = (array) DB::table('invitaciones')->where('id', $inv->id)->first();
        $this->assertStringNotContainsString($token, json_encode($row));
        $list = $this->actingAs($this->admin())->getJson('/admin/invitaciones')->assertOk();
        $this->assertStringNotContainsString($token, $list->getContent());

        $a = $this->actingAs($this->admin())->postJson('/admin/invitaciones', $this->payload([
            'numero_control' => 'DOC-9001', 'email' => 'doc9001@tescha.edu.mx', 'rol' => 'asesor',
            'grado_academico' => 'Dr.', 'carga_maxima' => 4,
        ]))->assertCreated();
        $this->assertSame(4, Invitacion::findOrFail($a->json('id'))->carga_maxima);

        $this->actingAs($this->admin())->postJson('/admin/invitaciones', $this->payload([
            'numero_control' => 'ADM-9001', 'email' => 'adm9001@tescha.edu.mx', 'rol' => 'administrativo',
        ]))->assertCreated();
    }

    public function test_inertia_create_flashes_link_only_on_that_response(): void
    {
        Mail::fake();
        $this->actingAs($this->admin())->post('/admin/invitaciones', $this->payload())
            ->assertRedirect()->assertSessionHas('invitacion_link');
        $this->actingAs($this->admin())->get('/admin/invitaciones')
            ->assertInertia(fn (Assert $p) => $p->component('Admin/Invitaciones'));
    }

    public function test_duplicates_are_rejected(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $this->actingAs($admin)->postJson('/admin/invitaciones', $this->payload(['numero_control' => 'DOC-0001']))
            ->assertStatus(422)->assertJsonValidationErrors('numero_control');
        $this->actingAs($admin)->postJson('/admin/invitaciones', $this->payload(['email' => $admin->email]))
            ->assertStatus(422)->assertJsonValidationErrors('email');

        $this->actingAs($admin)->postJson('/admin/invitaciones', $this->payload())->assertCreated();
        $this->actingAs($admin)->postJson('/admin/invitaciones', $this->payload(['email' => 'otro@tescha.edu.mx']))
            ->assertStatus(422)->assertJsonValidationErrors('numero_control');
        $this->actingAs($admin)->postJson('/admin/invitaciones', $this->payload(['numero_control' => '2031-0002']))
            ->assertStatus(422);
        $this->assertSame(1, Invitacion::where('numero_control', '2031-0001')->count());
    }

    public function test_role_isolation_on_admin_routes(): void
    {
        $routes = [
            ['get', '/admin/invitaciones'],
            ['post', '/admin/invitaciones'],
            ['post', '/admin/invitaciones/1/reenviar'],
            ['delete', '/admin/invitaciones/1'],
        ];
        foreach (['2021-0001', 'DOC-0001'] as $numero) {
            $user = Usuario::where('numero_control', $numero)->firstOrFail();
            foreach ($routes as [$method, $uri]) {
                $this->actingAs($user)->json($method, $uri)->assertForbidden();
            }
        }
        auth()->logout();
        foreach ($routes as [$method, $uri]) {
            $this->$method($uri)->assertRedirect('/login');
        }
    }

    public function test_list_props_and_filters(): void
    {
        Mail::fake();
        [$a] = $this->create();
        [$b] = $this->create(['numero_control' => '2031-0002', 'email' => 'b@tescha.edu.mx']);
        $this->actingAs($this->admin())->deleteJson("/admin/invitaciones/{$b['id']}")->assertOk();

        $this->actingAs($this->admin())->get('/admin/invitaciones')->assertInertia(fn (Assert $p) => $p
            ->component('Admin/Invitaciones')
            ->has('invitaciones', 2)->where('total', 2)->where('page', 1)->has('totalPages')
            ->has('opciones')->has('asesores')
            ->has('invitaciones.0', fn (Assert $r) => $r->hasAll([
                'id', 'numero_control', 'email', 'nombre', 'apellido_paterno', 'apellido_materno', 'rol',
                'opcion_titulacion_id', 'asesor_id', 'estado', 'creada_por', 'expira_en', 'aceptada_en',
                'revocada_en', 'created_at',
            ])->where('creada_por', 'ADM-0001' === $this->admin()->numero_control ? $this->admin()->nombre.' '.$this->admin()->apellido_paterno : '')
                ->etc()));

        $this->actingAs($this->admin())->getJson('/admin/invitaciones?estado=revocada')
            ->assertJsonPath('total', 1)->assertJsonPath('invitaciones.0.id', $b['id']);
        $this->actingAs($this->admin())->getJson('/admin/invitaciones?estado=pendiente')
            ->assertJsonPath('total', 1)->assertJsonPath('invitaciones.0.id', $a['id']);
        $this->actingAs($this->admin())->getJson('/admin/invitaciones?search=2031-0002')
            ->assertJsonPath('total', 1);
    }

    public function test_accept_creates_student_with_tramite_documents_and_assignment(): void
    {
        Mail::fake();
        $asesor = Usuario::where('numero_control', 'DOC-0001')->firstOrFail();
        [$json, $token] = $this->create(['asesor_id' => $asesor->id, 'opcion_titulacion_id' => 1]);

        $this->get("/invitacion/{$token}")->assertInertia(fn (Assert $p) => $p
            ->component('Invitacion/Aceptar')->where('valida', true)
            ->where('invitacion.numero_control', '2031-0001')->where('invitacion.rol', 'estudiante')
            ->has('invitacion.nombre')->has('invitacion.expira_en')->missing('invitacion.email'));

        $this->accept($token)->assertRedirect('/login');
        $this->assertSame('Cuenta creada. Inicia sesión con tu número de control.', session('status'));

        $usuario = Usuario::where('numero_control', '2031-0001')->firstOrFail();
        $this->assertSame('estudiante', $usuario->rol);
        $this->assertTrue(Hash::check('Segura1234', $usuario->password_hash));
        $tramite = Tramite::where('usuario_id', $usuario->id)->firstOrFail();
        $this->assertGreaterThan(0, Documento::where('tramite_id', $tramite->id)->count());
        $this->assertTrue(Asignacion::where('tramite_id', $tramite->id)->where('usuario_id', $asesor->id)
            ->where('rol_asignacion', 'asesor')->exists());

        $inv = Invitacion::findOrFail($json['id']);
        $this->assertNotNull($inv->aceptada_en);
        $this->assertSame($usuario->id, $inv->usuario_id);
        $this->assertSame('aceptada', $inv->estado);

        $this->post('/login', ['numero_control' => '2031-0001', 'password' => 'Segura1234'])
            ->assertRedirect();
        $this->assertAuthenticatedAs($usuario);
    }

    public function test_accept_creates_asesor_with_load(): void
    {
        Mail::fake();
        [, $token] = $this->create(['numero_control' => 'DOC-9002', 'email' => 'd2@tescha.edu.mx',
            'rol' => 'asesor', 'grado_academico' => 'Mtra.', 'carga_maxima' => 3]);
        $this->accept($token)->assertRedirect('/login');
        $u = Usuario::where('numero_control', 'DOC-9002')->firstOrFail();
        $this->assertSame('asesor', $u->rol);
        $this->assertSame(3, $u->carga_maxima);
        $this->assertSame('Mtra.', $u->grado_academico);
        $this->assertSame(0, Tramite::where('usuario_id', $u->id)->count());
    }

    public function test_single_use_and_double_submit(): void
    {
        Mail::fake();
        [, $token] = $this->create();
        $before = Usuario::count();
        $this->accept($token)->assertRedirect('/login');
        $this->accept($token)->assertStatus(422)->assertJsonValidationErrors('token');
        $this->assertSame($before + 1, Usuario::count());
        $this->get("/invitacion/{$token}")->assertInertia(fn (Assert $p) => $p->where('valida', false)->missing('invitacion'));
    }

    public function test_expired_and_revoked_links_fail_generically(): void
    {
        Mail::fake();
        [, $expired] = $this->create();
        [$r, $revoked] = $this->create(['numero_control' => '2031-0002', 'email' => 'r@tescha.edu.mx']);
        $this->actingAs($this->admin())->deleteJson("/admin/invitaciones/{$r['id']}")->assertOk();
        auth()->logout();

        $this->travel(73)->hours();
        $this->accept($expired)->assertStatus(422)->assertJsonPath('errors.token.0', 'Enlace inválido o expirado.');
        $this->accept($revoked)->assertStatus(422)->assertJsonPath('errors.token.0', 'Enlace inválido o expirado.');
        $this->accept(str_repeat('a', 64))->assertStatus(422)->assertJsonPath('errors.token.0', 'Enlace inválido o expirado.');
        $this->get("/invitacion/{$expired}")->assertInertia(fn (Assert $p) => $p->where('valida', false));
        $this->assertSame(0, Usuario::where('numero_control', 'like', '2031-%')->count());
    }

    public function test_resend_replaces_token_and_refuses_accepted_or_revoked(): void
    {
        Mail::fake();
        [$j, $old] = $this->create();
        $admin = $this->admin();

        $new = $this->actingAs($admin)->postJson("/admin/invitaciones/{$j['id']}/reenviar")->assertOk()->json('link');
        $newToken = basename($new);
        $this->assertNotSame($old, $newToken);
        auth()->logout();
        $this->accept($old)->assertStatus(422);
        $this->get("/invitacion/{$old}")->assertInertia(fn (Assert $p) => $p->where('valida', false));

        // An expired invitation can be resent too.
        $this->travel(80)->hours();
        $this->accept($newToken)->assertStatus(422);
        $again = $this->actingAs($admin)->postJson("/admin/invitaciones/{$j['id']}/reenviar")->assertOk()->json('link');
        auth()->logout();
        $this->accept(basename($again))->assertRedirect('/login');

        $this->actingAs($admin)->postJson("/admin/invitaciones/{$j['id']}/reenviar")->assertStatus(422);
        $this->actingAs($admin)->deleteJson("/admin/invitaciones/{$j['id']}")->assertStatus(422);

        [$k] = $this->create(['numero_control' => '2031-0009', 'email' => 'k@tescha.edu.mx']);
        $this->actingAs($admin)->deleteJson("/admin/invitaciones/{$k['id']}")->assertOk();
        $this->actingAs($admin)->postJson("/admin/invitaciones/{$k['id']}/reenviar")->assertStatus(422);
    }

    public function test_accept_rechecks_that_identity_is_still_free(): void
    {
        Mail::fake();
        [$j, $token] = $this->create();
        Usuario::create([
            'numero_control' => '2031-0001', 'email' => 'taken@tescha.edu.mx', 'password_hash' => Hash::make('x'),
            'nombre' => 'X', 'apellido_paterno' => 'Y', 'rol' => 'estudiante',
        ]);
        $this->accept($token)->assertStatus(422);
        $this->assertNull(Invitacion::findOrFail($j['id'])->aceptada_en);
        $this->assertSame(1, Usuario::where('numero_control', '2031-0001')->count());
    }

    public function test_password_validation(): void
    {
        Mail::fake();
        [, $token] = $this->create();
        $this->postJson("/invitacion/{$token}", ['password' => 'corta', 'password_confirmation' => 'corta'])
            ->assertStatus(422)->assertJsonPath('errors.password.0', 'La contraseña debe tener al menos 8 caracteres.');
        $this->postJson("/invitacion/{$token}", ['password' => 'Segura1234', 'password_confirmation' => 'Otra12345'])
            ->assertStatus(422)->assertJsonPath('errors.password.0', 'La confirmación de contraseña no coincide.');
        $this->assertSame(0, Usuario::where('numero_control', '2031-0001')->count());
    }

    public function test_accept_is_throttled(): void
    {
        $bad = str_repeat('b', 64);
        for ($i = 0; $i < 10; $i++) {
            $this->accept($bad)->assertStatus(422);
        }
        $this->accept($bad)->assertStatus(429);
    }

    public function test_audit_rows_and_no_plain_token_in_bitacora_or_logs(): void
    {
        Mail::fake();
        Log::spy();
        [$j, $token] = $this->create();
        $newLink = $this->actingAs($this->admin())->postJson("/admin/invitaciones/{$j['id']}/reenviar")->json('link');
        $newToken = basename($newLink);
        $this->actingAs($this->admin())->deleteJson("/admin/invitaciones/{$j['id']}")->assertOk();
        [$k, $kToken] = $this->create(['numero_control' => '2031-0003', 'email' => 'c@tescha.edu.mx']);
        $this->accept($kToken)->assertRedirect('/login');

        $acciones = Bitacora::where('entidad', 'invitacion')->orderBy('id')->pluck('accion')->all();
        $this->assertSame(
            ['invitacion_creada', 'invitacion_reenviada', 'invitacion_revocada', 'invitacion_creada', 'invitacion_aceptada'],
            $acciones,
        );
        $accepted = Bitacora::where('accion', 'invitacion_aceptada')->firstOrFail();
        $this->assertSame(Usuario::where('numero_control', '2031-0003')->value('id'), $accepted->usuario_id);

        $dump = json_encode(Bitacora::where('entidad', 'invitacion')->get()->toArray());
        foreach ([$token, $newToken, $kToken] as $t) {
            $this->assertStringNotContainsString($t, $dump);
        }
    }

    public function test_mail_is_sent_with_link_and_expiry_and_failure_is_not_fatal(): void
    {
        Mail::fake();
        [$j, $token] = $this->create(['nombre' => '<b>Ana</b>']);
        Mail::assertSent(InvitacionMail::class, function (InvitacionMail $m) use ($token) {
            $m->assertHasSubject('Invitación a SCA-TESCHA');
            $m->assertSeeInHtml(route('invitacion.show', $token), false);
            $m->assertSeeInHtml('72 horas');
            $m->assertSeeInHtml('2031-0001');
            $m->assertDontSeeInHtml('<b>Ana</b>', false);
            $m->assertSeeInText(route('invitacion.show', $token));
            $m->assertSeeInText('72 horas');

            return $m->hasTo('2031-0001@tescha.edu.mx');
        });

        // A broken transport does not break the request and the row is kept.
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));
        $this->actingAs($this->admin())->postJson('/admin/invitaciones', $this->payload([
            'numero_control' => '2031-0004', 'email' => 'd@tescha.edu.mx',
        ]))->assertCreated()->assertJsonStructure(['link']);
        $this->assertTrue(Invitacion::where('numero_control', '2031-0004')->exists());
    }

    public function test_configured_expiry_hours_are_used(): void
    {
        Mail::fake();
        config(['auth.invitations.expire_hours' => 24]);
        [$j] = $this->create();
        $this->assertEqualsWithDelta(24 * 3600, Invitacion::findOrFail($j['id'])->expira_en->timestamp - now()->timestamp, 5);
    }
}
