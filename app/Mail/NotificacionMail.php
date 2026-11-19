<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * E-mail copy of a notification (Express NotificacionService.sendEmail): the subject is the
 * notification title and the body greets the user and repeats the message.
 */
class NotificacionMail extends Mailable
{
    public function __construct(
        public readonly string $nombre,
        public readonly string $titulo,
        public readonly string $mensaje,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->titulo);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.notificacion', text: 'mail.text.notificacion');
    }
}
