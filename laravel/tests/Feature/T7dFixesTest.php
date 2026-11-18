<?php

namespace Tests\Feature;

use App\Models\Tramite;
use App\Models\Usuario;
use App\Support\ServerUploadLimit;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class T7dFixesTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    // B1: server upload limits

    public function test_ini_size_error_returns_clear_422_on_archivo(): void
    {
        Storage::fake('local');
        $student = $this->user('2021-0001');
        $tramite = Tramite::where('usuario_id', $student->id)->where('activo', 1)->firstOrFail();
        $tmp = tempnam(sys_get_temp_dir(), 'up');
        $broken = new UploadedFile($tmp, 'big.pdf', 'application/pdf', UPLOAD_ERR_INI_SIZE, true);

        $limit = rtrim(rtrim(number_format(ServerUploadLimit::toBytes(ini_get('upload_max_filesize')) / 1048576, 1, '.', ''), '0'), '.');

        $this->actingAs($student)->postJson("/tramites/{$tramite->id}/documentos", [
            'tipo_documento_id' => 11,
            'archivo' => $broken,
        ])->assertStatus(422)
            ->assertJsonPath('errors.archivo.0', "El archivo excede el tamaño máximo permitido por el servidor ({$limit} MB).")
            ->assertJsonCount(1, 'errors.archivo');

        @unlink($tmp);
    }

    public function test_post_body_over_post_max_size_returns_422(): void
    {
        $student = $this->user('2021-0001');
        $tramite = Tramite::where('usuario_id', $student->id)->where('activo', 1)->firstOrFail();
        $tooBig = ServerUploadLimit::toBytes(ini_get('post_max_size')) + 1024;

        $this->actingAs($student)->call('POST', "/tramites/{$tramite->id}/documentos", [], [], [], [
            'CONTENT_LENGTH' => $tooBig,
            'HTTP_ACCEPT' => 'application/json',
        ])->assertStatus(422)->assertJsonPath('errors.archivo.0', ServerUploadLimit::message(
            ServerUploadLimit::toBytes(ini_get('post_max_size')),
        ));
    }

    public function test_violation_helper_detects_both_cases_and_ignores_normal_requests(): void
    {
        $postMax = ServerUploadLimit::toBytes(ini_get('post_max_size'));

        $oversized = Request::create('/x', 'POST', [], [], [], ['CONTENT_LENGTH' => $postMax + 1]);
        $this->assertSame(ServerUploadLimit::message($postMax), ServerUploadLimit::violation($oversized));

        $normal = Request::create('/x', 'POST', [], [], [], ['CONTENT_LENGTH' => 100]);
        $this->assertNull(ServerUploadLimit::violation($normal));

        $this->assertSame(2 * 1048576, ServerUploadLimit::toBytes('2M'));
        $this->assertSame(1024, ServerUploadLimit::toBytes('1K'));
        $this->assertSame(PHP_INT_MAX, ServerUploadLimit::toBytes('-1'));
        $this->assertStringContainsString('(25 MB)', ServerUploadLimit::message(25 * 1048576));
    }

    // B9: timezone

    public function test_app_timezone_is_mexico_city_and_matches_database_clock(): void
    {
        $this->assertSame('America/Mexico_City', config('app.timezone'));
        $this->assertSame('America/Mexico_City', now()->getTimezone()->getName());

        $dbNow = DB::selectOne('select now() as n')->n;
        $diff = abs(strtotime($dbNow) - strtotime(now()->format('Y-m-d H:i:s')));

        $this->assertLessThanOrEqual(5, $diff, 'PHP now() and the DB default clock must agree.');
    }

    // B8: self-deactivation guard

    public function test_admin_cannot_deactivate_self_but_can_toggle_others(): void
    {
        $admin = $this->user('ADM-0001');
        $student = $this->user('2021-0003');

        $this->actingAs($admin)->putJson("/admin/usuarios/{$admin->id}/toggle")
            ->assertStatus(422)->assertJsonPath('message', 'No puede desactivarse a sí mismo.');
        $this->assertSame(1, (int) $admin->fresh()->activo);

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}/toggle")
            ->assertOk()->assertJsonPath('activo', 0);
        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}/toggle")
            ->assertOk()->assertJsonPath('activo', 1);
    }
}
