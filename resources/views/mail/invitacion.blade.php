@extends('mail.layout')
@section('title', 'Invitación a SCA-TESCHA')
@section('preheader', 'Crea tu cuenta del Sistema de Titulación. El enlace es válido por '.$horas.' horas.')
@section('content')
<h1 style="margin:0 0 16px 0;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#1F2328;">Te invitaron a SCA-TESCHA</h1>
<p style="margin:0 0 16px 0;">Hola {{ $nombre }},</p>
<p style="margin:0 0 16px 0;">Se creó una invitación para que accedas al Sistema de Titulación como {{ $rolTexto }}. Tu número de control es <strong>{{ $numeroControl }}</strong>.</p>
<p style="margin:0 0 24px 0;">Abre el enlace y elige tu contraseña para activar tu cuenta. El enlace es válido por {{ $horas }} horas y solo puede usarse una vez.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;"><tr>
<td style="background:#1F2328;border-radius:8px;"><a href="{{ $link }}" style="display:inline-block;height:44px;line-height:44px;padding:0 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">Crear mi cuenta</a></td>
</tr></table>
<p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#565E6C;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:0 0 24px 0;font-size:13px;line-height:20px;word-break:break-all;"><a href="{{ $link }}" style="color:#1F2328;">{{ $link }}</a></p>
<p style="margin:0;color:#565E6C;">Si no esperabas esta invitación, ignora este mensaje.</p>
@endsection
