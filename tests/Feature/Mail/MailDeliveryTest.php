<?php

namespace Tests\Feature\Mail;

use App\Listeners\RedirectOutgoingMail;
use App\Mail\NotificacionMail;
use App\Mail\ResetPasswordMail;
use App\Mail\TestMail;
use App\Models\Usuario;
use App\Services\NotificacionService;
use App\Support\MailFailure;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class MailDeliveryTest extends TestCase
{
    use DatabaseTransactions;

    public function test_mail_test_refuses_invalid_address(): void
    {
        Mail::fake();

        $this->artisan('sca:mail-test', ['email' => 'no-es-correo'])
            ->expectsOutputToContain('Invalid e-mail address')
            ->assertExitCode(1);

        Mail::assertNothingSent();
    }

    public function test_mail_test_sends_and_never_prints_the_password(): void
    {
        Mail::fake();
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.example.test',
            'mail.mailers.smtp.username' => 'demo.user@example.test',
            'mail.mailers.smtp.password' => 'SuperSecretPassw0rd',
        ]);

        $this->artisan('sca:mail-test', ['email' => 'alguien@example.test'])
            ->expectsOutputToContain('smtp.example.test')
            ->expectsOutputToContain('de*******@example.test')
            ->expectsOutputToContain('Test message handed to the transport.')
            ->doesntExpectOutputToContain('SuperSecretPassw0rd')
            ->assertExitCode(0);

        Mail::assertSent(TestMail::class, fn (TestMail $m) => $m->hasTo('alguien@example.test'));
    }

    public function test_mail_test_reports_failure_with_exit_code_1(): void
    {
        config(['mail.mailers.smtp.password' => 'SuperSecretPassw0rd']);

        Mail::shouldReceive('to')->once()->andReturnSelf();
        Mail::shouldReceive('send')->once()->andThrow(new RuntimeException('Connection refused for bob@example.test'));

        $this->artisan('sca:mail-test', ['email' => 'bob@example.test'])
            ->expectsOutputToContain('Send failed: Connection refused for ***@example.test')
            ->doesntExpectOutputToContain('SuperSecretPassw0rd')
            ->assertExitCode(1);
    }

    public function test_always_to_redirects_and_keeps_the_original_recipient_visible(): void
    {
        config(['mail.always_to' => 'demo@example.test']);

        $message = (new Email)->from('a@example.test')->to('real@tescha.edu.mx')->cc('x@example.test')->subject('Hola')->text('x');
        (new RedirectOutgoingMail)->handle(new MessageSending($message));

        $this->assertSame(['demo@example.test'], array_map(fn ($a) => $a->getAddress(), $message->getTo()));
        $this->assertSame([], $message->getCc());
        $this->assertSame('[Para: real@tescha.edu.mx, x@example.test] Hola', $message->getSubject());
        $this->assertSame('real@tescha.edu.mx, x@example.test', $message->getHeaders()->get('X-Original-To')->getBodyAsString());
    }

    public function test_always_to_unset_or_invalid_leaves_the_message_untouched(): void
    {
        foreach ([null, 'no-valido'] as $value) {
            config(['mail.always_to' => $value]);
            $message = (new Email)->from('a@example.test')->to('real@tescha.edu.mx')->subject('Hola')->text('x');
            (new RedirectOutgoingMail)->handle(new MessageSending($message));

            $this->assertSame('real@tescha.edu.mx', $message->getTo()[0]->getAddress());
            $this->assertSame('Hola', $message->getSubject());
        }
    }

    public function test_mailables_render_html_and_plain_text_with_escaping(): void
    {
        $notificacion = new NotificacionMail('Ana <b>', 'Documento <i>aprobado</i>', "Linea 1\nLinea 2 & fin");
        $html = $notificacion->render();
        $this->assertStringContainsString('SCA-TESCHA', $html);
        $this->assertStringContainsString('Ana &lt;b&gt;', $html);
        $this->assertStringNotContainsString('<i>aprobado</i>', $html);
        $this->assertStringContainsString('Este mensaje fue generado automáticamente', $html);

        $reset = new ResetPasswordMail('Ana', 'https://app.test/reset-password/abc');
        $this->assertStringContainsString('href="https://app.test/reset-password/abc"', $reset->render());
        $this->assertStringContainsString('Si no solicitaste este cambio', $reset->render());

        $reset->assertSeeInText('https://app.test/reset-password/abc');
        $notificacion->assertSeeInText('Linea 2 & fin');
        $notificacion->assertDontSeeInText('&amp;');
    }

    public function test_notification_mail_failure_is_logged_with_domain_only_and_does_not_break(): void
    {
        $user = Usuario::where('numero_control', '2021-0004')->firstOrFail();

        Log::spy();
        Mail::shouldReceive('to')->once()->andReturnSelf();
        Mail::shouldReceive('send')->once()->andThrow(new RuntimeException('550 rejected '.$user->email));

        $n = app(NotificacionService::class)->create($user->id, 'T', 'M', 'ambos');
        $this->assertNotNull($n->id);

        Log::shouldHaveReceived('error')->withArgs(function ($msg, $ctx) use ($user) {
            $json = json_encode($ctx);

            return $msg === 'Mail delivery failed'
                && $ctx['recipient_domain'] === MailFailure::domain($user->email)
                && ! str_contains($json, $user->email);
        })->once();
    }

    public function test_password_reset_survives_a_mail_failure(): void
    {
        Mail::shouldReceive('to')->once()->andReturnSelf();
        Mail::shouldReceive('send')->once()->andThrow(new RuntimeException('smtp down'));

        $this->post('/forgot-password', ['numero_control' => '2021-0004'])
            ->assertSessionHas('status');
    }
}
