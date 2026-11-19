<?php

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Email;

/**
 * Demo safety: when `mail.always_to` is a valid address, every outgoing message goes to it.
 *
 * Laravel's own Mail::alwaysTo() discards the original recipients before any hook runs, so the
 * redirect is done here instead: the originals are kept in an X-Original-To header and in the
 * subject ("[Para: user@host]"), so the redirected mailbox can tell who the mail was meant for.
 */
class RedirectOutgoingMail
{
    public function handle(MessageSending $event): void
    {
        $target = config('mail.always_to');

        if (! is_string($target) || filter_var($target, FILTER_VALIDATE_EMAIL) === false) {
            return;
        }

        $message = $event->message;

        if (! $message instanceof Email) {
            return;
        }

        $originals = array_map(
            fn ($address) => $address->getAddress(),
            [...$message->getTo(), ...$message->getCc(), ...$message->getBcc()]
        );

        // Already redirected (for example a retried send): do not stack prefixes.
        if ($message->getHeaders()->has('X-Original-To')) {
            return;
        }

        $message->getHeaders()->addTextHeader('X-Original-To', implode(', ', $originals));
        $message->subject('[Para: '.implode(', ', $originals).'] '.$message->getSubject());
        $message->to($target);
        $message->cc();
        $message->bcc();
    }
}
