<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Dictamen de Titulación</title>
<style>
    @page { margin: 0; size: 612pt 792pt; }
    * { margin: 0; padding: 0; }
    body { font-family: Helvetica, sans-serif; color: #333; width: 612pt; height: 792pt; position: relative; }
    .abs { position: absolute; }
    .center { text-align: center; left: 50pt; width: 512pt; }
    .rule { position: absolute; border-top: 0.5pt solid #CCC; }
</style>
</head>
<body>
    {{-- Header --}}
    <div class="abs" style="top:0; left:0; width:612pt; height:130pt; background:#8A2036;"></div>
    <div class="abs center" style="top:15pt; font-size:28pt; font-weight:bold; color:#BC955B;">TESCHA</div>
    <div class="abs center" style="top:62pt; font-size:15pt; font-weight:bold; color:#FFFFFF;">TECNOLÓGICO DE ESTUDIOS SUPERIORES DE CHALCO</div>
    <div class="abs center" style="top:82pt; font-size:10pt; color:#BC955B;">INGENIERÍA EN SISTEMAS COMPUTACIONALES</div>
    <div class="abs" style="top:129pt; left:50pt; width:512pt; border-top:2pt solid #56212F;"></div>

    {{-- Title --}}
    <div class="abs center" style="top:165pt; font-size:16pt; font-weight:bold; color:#56212F;">DICTAMEN DE TITULACIÓN</div>

    {{-- Data rows --}}
    @foreach ($campos as $i => $campo)
        @php $y = 210 + $i * 28; @endphp
        <div class="abs" style="top:{{ $y }}pt; left:50pt; font-size:11pt; color:#333;">{{ $campo['label'] }}</div>
        <div class="abs" style="top:{{ $y + 2 }}pt; left:200pt; width:362pt; font-size:11pt; color:#333;">{{ $campo['value'] }}</div>
        <div class="rule" style="top:{{ $y + 16 }}pt; left:200pt; width:362pt;"></div>
    @endforeach

    {{-- Result box --}}
    @php $resultY = 210 + count($campos) * 28 + 20; @endphp
    <div class="abs" style="top:{{ $resultY }}pt; left:50pt; width:509pt; height:42pt; border:1.5pt solid #56212F; background:{{ $aprobado ? '#ECFDF5' : '#FFF1F2' }};"></div>
    <div class="abs" style="top:{{ $resultY + 12 }}pt; left:60pt; font-size:13pt; font-weight:bold; color:#333;">RESULTADO:</div>
    <div class="abs" style="top:{{ $resultY + 12 }}pt; left:160pt; font-size:13pt; font-weight:bold; color:{{ $aprobado ? '#065F46' : '#9B1C1C' }};">{{ $aprobado ? 'APROBADO' : 'RECHAZADO' }}</div>

    {{-- Observations --}}
    @php $obsY = $resultY + 45 + 30; @endphp
    <div class="abs" style="top:{{ $obsY }}pt; left:50pt; font-size:11pt; font-weight:bold; color:#333;">Observaciones:</div>
    @for ($i = 0; $i < 5; $i++)
        <div class="rule" style="top:{{ $obsY + 18 + $i * 16 }}pt; left:50pt; width:512pt;"></div>
    @endfor
    @if ($observaciones)
        <div class="abs" style="top:{{ $obsY + 18 }}pt; left:50pt; width:512pt; height:70pt; overflow:hidden; font-size:10pt; color:#555;">{{ $observaciones }}</div>
    @endif

    {{-- Signature --}}
    @php $firmaY = $obsY + 130; @endphp
    <div class="abs" style="top:{{ $firmaY }}pt; left:330pt; width:232pt; border-top:0.5pt solid #333;"></div>
    <div class="abs" style="top:{{ $firmaY + 5 }}pt; left:330pt; width:232pt; text-align:center; font-size:9pt; color:#555;">Firma del Administrativo</div>

    {{-- Footer --}}
    <div class="abs center" style="top:740pt; font-size:7pt; color:#56212F;">Tecnológico de Estudios Superiores de Chalco  —  SCA-TESCHA  —  Sistema de Titulación ISC</div>
</body>
</html>
