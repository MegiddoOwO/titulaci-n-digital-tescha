<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#8A2036">Recuperación de contraseña</h2>
  <p>Hola {{ $nombre }},</p>
  <p>Recibimos una solicitud para restablecer tu contraseña de acceso al Sistema de Titulación.</p>
  <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
  <p><a href="{{ $resetLink }}" style="color:#8A2036;font-weight:bold">{{ $resetLink }}</a></p>
  <p>Si no solicitaste este cambio, ignora este mensaje.</p>
  <hr style="border-color:#efe1ca">
  <p style="color:#666;font-size:12px">SCA-TESCHA — Sistema de Control y Administración de Titulación</p>
</div>
