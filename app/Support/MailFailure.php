<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Logs a failed delivery without leaking personal data: only the recipient domain is kept and any
 * address inside the exception message is masked. Delivery failures never break the request.
 */
class MailFailure
{
    public static function log(Throwable $e, ?string $recipient, string $context): void
    {
        Log::error('Mail delivery failed', [
            'context' => $context,
            'recipient_domain' => self::domain($recipient),
            'exception' => $e::class,
            'message' => self::scrub($e->getMessage()),
        ]);
    }

    public static function domain(?string $email): string
    {
        $at = $email === null ? false : strrpos($email, '@');

        return $at === false ? 'unknown' : strtolower(substr((string) $email, $at + 1));
    }

    /** Masks e-mail addresses and long opaque tokens, and keeps the text short. */
    public static function scrub(string $message): string
    {
        $message = preg_replace('/[^\s<>"\']+@([^\s<>"\']+)/', '***@$1', $message) ?? $message;
        $message = preg_replace('/\b[A-Za-z0-9+\/_=-]{32,}\b/', '[redacted]', $message) ?? $message;
        $message = trim(preg_replace('/\s+/', ' ', $message) ?? $message);

        return mb_substr($message, 0, 300);
    }
}
