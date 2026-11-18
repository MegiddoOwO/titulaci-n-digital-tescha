<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ResetPasswordMail extends Mailable
{
    public function __construct(public string $nombre, public string $resetLink) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Recuperación de contraseña - SCA TESCHA');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.reset-password');
    }
}
