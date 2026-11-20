<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class InvitacionMail extends Mailable
{
    public function __construct(
        public string $nombre,
        public string $rol,
        public string $numeroControl,
        public string $link,
        public int $horas,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Invitación a SCA-TESCHA');
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.invitacion',
            text: 'mail.text.invitacion',
            with: ['rolTexto' => $this->rolTexto()],
        );
    }

    private function rolTexto(): string
    {
        return match ($this->rol) {
            'estudiante' => 'estudiante',
            'asesor' => 'asesor(a)',
            default => 'personal administrativo',
        };
    }
}
