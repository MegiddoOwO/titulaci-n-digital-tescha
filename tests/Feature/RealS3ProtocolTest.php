<?php

namespace Tests\Feature;

use App\Models\Documento;
use App\Models\Tramite;
use App\Models\Usuario;
use App\Support\Uploads;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

/**
 * Opt-in check against a real S3-compatible endpoint (e.g. a throwaway local MinIO).
 * Skipped unless SCA_TEST_REAL_S3=1 and UPLOADS_DISK=s3 (AWS_*) or UPLOADS_DISK=r2 (R2_*, plus R2_ENDPOINT for MinIO) are exported on the command line.
 * Never run in CI or against production buckets; it creates and removes its own objects only.
 */
class RealS3ProtocolTest extends TestCase
{
    use DatabaseTransactions;

    private const PDF = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";

    protected function setUp(): void
    {
        if (! env('SCA_TEST_REAL_S3')) {
            $this->markTestSkipped('Opt-in: set SCA_TEST_REAL_S3=1 with UPLOADS_DISK=s3 (AWS_*) or r2 (R2_*) variables.');
        }

        parent::setUp();
    }

    public function test_upload_inline_zip_and_copy_over_s3_protocol(): void
    {
        $this->assertSame('s3', config('filesystems.disks.uploads.driver'));

        $disk = Uploads::disk();
        $client = $disk->getClient();
        $bucket = config('filesystems.disks.uploads.bucket');
        if (! $client->doesBucketExist($bucket)) {
            $client->createBucket(['Bucket' => $bucket]);
        }

        $user = Usuario::where('numero_control', '2021-0001')->firstOrFail();
        $tramite = Tramite::where('usuario_id', $user->id)->where('activo', 1)->firstOrFail();

        $response = $this->actingAs($user)->postJson("/tramites/{$tramite->id}/documentos", [
            'tipo_documento_id' => 11,
            'archivo' => UploadedFile::fake()->createWithContent('s3.pdf', self::PDF),
        ])->assertOk();

        $doc = Documento::findOrFail($response->json('documento_id'));
        $this->assertTrue($disk->exists($doc->archivo_url));
        $this->assertSame(strlen(self::PDF), $disk->size($doc->archivo_url));

        $inline = $this->actingAs($user)->get("/tramites/{$tramite->id}/documentos/{$doc->id}")->assertOk();
        $this->assertSame('application/pdf', $inline->headers->get('Content-Type'));
        $this->assertSame(self::PDF, $inline->streamedContent());

        $zipResponse = $this->actingAs(Usuario::where('numero_control', 'ADM-0001')->firstOrFail())
            ->get("/admin/expedientes/{$tramite->id}/descargar")->assertOk();
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($zipResponse->baseResponse->getFile()->getPathname()) === true);
        $this->assertSame(self::PDF, $zip->getFromName(basename($doc->archivo_url)));
        $zip->close();

        // local -> s3 copy of a fake source file referenced by a document.
        Storage::fake('src');
        $copyPath = "uploads/{$tramite->id}/copy_probe.pdf";
        Storage::disk('src')->put($copyPath, self::PDF);
        $other = Documento::where('tramite_id', $tramite->id)->where('id', '!=', $doc->id)->firstOrFail();
        Documento::query()->whereKey($other->id)->update(['archivo_url' => $copyPath]);
        Documento::query()->where('tramite_id', $tramite->id)->whereNotIn('id', [$other->id])->update(['archivo_url' => null]);

        $this->artisan('sca:uploads-copy', ['--from' => 'src'])->assertExitCode(0);
        $this->assertSame(self::PDF, $disk->get($copyPath));

        $disk->delete([$doc->archivo_url, $copyPath]);
    }
}
