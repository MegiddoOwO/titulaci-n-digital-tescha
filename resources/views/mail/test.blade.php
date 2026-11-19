@extends('mail.layout')
@section('title', 'Prueba de correo')
@section('preheader', 'Si recibes este mensaje, el envío de correo funciona.')
@section('content')
<h1 style="margin:0 0 16px 0;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#1F2328;">Prueba de correo</h1>
<p style="margin:0 0 16px 0;">Si recibes este mensaje, la configuración de correo de SCA-TESCHA funciona.</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#565E6C;">Enviado el {{ $enviadoEn }} con el transporte «{{ $transporte }}».</p>
@endsection
