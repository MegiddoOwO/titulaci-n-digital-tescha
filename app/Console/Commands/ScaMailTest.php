<?php

namespace App\Console\Commands;

use App\Mail\TestMail;
use App\Support\MailFailure;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Diagnoses the outgoing mail configuration: prints the effective settings (never the password)
 * and sends one short test message through the configured default mailer.
 */
class ScaMailTest extends Command
{
    protected $signature = 'sca:mail-test {email : Address that receives the test message}';

    protected $description = 'Show the effective mail settings and send a test message';

    public function handle(): int
    {
        $email = (string) $this->argument('email');

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $this->error('Invalid e-mail address.');

            return self::FAILURE;
        }

        $name = (string) config('mail.default');
        $mailer = (array) config("mail.mailers.{$name}");

        $this->table(['Setting', 'Value'], [
            ['mailer', $name],
            ['transport', (string) ($mailer['transport'] ?? '-')],
            ['host', (string) ($mailer['host'] ?? '-')],
            ['port', (string) ($mailer['port'] ?? '-')],
            ['scheme', $this->scheme($mailer)],
            ['username', $this->mask($mailer['username'] ?? null)],
            ['from', sprintf('%s <%s>', config('mail.from.name'), config('mail.from.address'))],
            ['always_to', (string) (config('mail.always_to') ?: '(unset)')],
            ['timeout', isset($mailer['timeout']) ? $mailer['timeout'].'s' : '-'],
        ]);

        if (config('mail.always_to')) {
            $this->warn('MAIL_ALWAYS_TO is set: the message will be delivered to it, not to '.$email.'.');
        }

        try {
            Mail::to($email)->send(new TestMail($name, now()->format('Y-m-d H:i:s')));
        } catch (Throwable $e) {
            $this->error('Send failed: '.MailFailure::scrub($e->getMessage()));

            return self::FAILURE;
        }

        $this->info('Test message handed to the transport.');

        return self::SUCCESS;
    }

    /** @param array<string, mixed> $mailer */
    private function scheme(array $mailer): string
    {
        if (($mailer['transport'] ?? null) !== 'smtp') {
            return '-';
        }

        return (string) ($mailer['scheme'] ?? '') !== ''
            ? (string) $mailer['scheme']
            : (((int) ($mailer['port'] ?? 0)) === 465 ? 'smtps (auto)' : 'smtp (auto, STARTTLS if offered)');
    }

    private function mask(mixed $username): string
    {
        $username = (string) $username;

        if ($username === '') {
            return '(none)';
        }

        $at = strpos($username, '@');
        $local = $at === false ? $username : substr($username, 0, $at);
        $domain = $at === false ? '' : substr($username, $at);

        return substr($local, 0, 2).str_repeat('*', max(strlen($local) - 2, 1)).$domain;
    }
}
