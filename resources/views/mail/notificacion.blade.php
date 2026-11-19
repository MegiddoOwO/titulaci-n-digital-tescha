@extends('mail.layout')
@section('title', $titulo)
@section('preheader', $mensaje)
@section('content')
<p style="margin:0 0 16px 0;">Hola {{ $nombre }},</p>
<h1 style="margin:0 0 12px 0;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#1F2328;">{{ $titulo }}</h1>
<p style="margin:0;white-space:pre-line;">{{ $mensaje }}</p>
@endsection
