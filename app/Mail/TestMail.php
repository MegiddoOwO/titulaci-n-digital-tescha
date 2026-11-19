<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Message sent by `php artisan sca:mail-test`. */
class TestMail extends Mailable
{
    public function __construct(public string $transporte, public string $enviadoEn) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Prueba de correo - SCA TESCHA');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.test', text: 'mail.text.test');
    }
}
