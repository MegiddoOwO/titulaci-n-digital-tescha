@extends('mail.layout')
@section('title', 'Recuperación de contraseña')
@section('preheader', 'Restablece tu contraseña. El enlace es válido por 1 hora.')
@section('content')
<h1 style="margin:0 0 16px 0;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#1F2328;">Recuperación de contraseña</h1>
<p style="margin:0 0 16px 0;">Hola {{ $nombre }},</p>
<p style="margin:0 0 24px 0;">Recibimos una solicitud para restablecer tu contraseña de acceso al Sistema de Titulación. El enlace es válido por 1 hora.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;"><tr>
<td style="background:#1F2328;border-radius:8px;"><a href="{{ $resetLink }}" style="display:inline-block;height:44px;line-height:44px;padding:0 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">Restablecer contraseña</a></td>
</tr></table>
<p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#565E6C;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:0 0 24px 0;font-size:13px;line-height:20px;word-break:break-all;"><a href="{{ $resetLink }}" style="color:#1F2328;">{{ $resetLink }}</a></p>
<p style="margin:0;color:#565E6C;">Si no solicitaste este cambio, ignora este mensaje.</p>
@endsection
