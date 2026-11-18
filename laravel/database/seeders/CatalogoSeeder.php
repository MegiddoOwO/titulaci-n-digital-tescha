<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Catalogs: opciones, tipos de documento, normativa, directorio, requisitos de fotografia.
 * Mirrors the legacy database/seed.sql (same ids and values).
 */
class CatalogoSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('opciones_titulacion')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Tesis', 'descripcion' => 'Desarrollo de un proyecto de investigación aplicada bajo la dirección de un asesor.'],
            ['id' => 2, 'nombre' => 'Residencias Profesionales', 'descripcion' => 'Memoria de residencia profesional más carta de aceptación de la empresa.'],
            ['id' => 3, 'nombre' => 'Excelencia Académica', 'descripcion' => 'Promedio sobresaliente (≥ 9.5) cursando el total de créditos en la institución.'],
            ['id' => 4, 'nombre' => 'Examen General de Egreso (EGEL)', 'descripcion' => 'Acreditación del EGEL-CENEVAL con testimonio de desempeño sobresaliente.'],
            ['id' => 5, 'nombre' => 'Créditos de Posgrado', 'descripcion' => 'Acreditación de al menos 2 asignaturas de un programa de posgrado afín.'],
        ]);

        DB::table('tipos_documento')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Certificado Total de Estudios', 'descripcion' => 'Certificado oficial de estudios de licenciatura emitido por Control Escolar.', 'opcion_titulacion_id' => null, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 1],
            ['id' => 2, 'nombre' => 'Constancia de Liberación de Lenguas Extranjeras', 'descripcion' => 'Constancia emitida por la Coordinación de Lenguas Extranjeras que acredita el nivel de inglés.', 'opcion_titulacion_id' => null, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 2],
            ['id' => 3, 'nombre' => 'Fotografía tamaño miñón', 'descripcion' => '5 fotografías tamaño miñón con especificaciones oficiales: saco oscuro, camisa blanca, fondo mate, sin maquillaje.', 'opcion_titulacion_id' => null, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'JPEG,PNG', 'tamaño_max_mb' => '5.00', 'orden' => 3],
            ['id' => 4, 'nombre' => 'Comprobante de Pago de Derechos de Titulación', 'descripcion' => 'Línea de captura o comprobante de pago del portal estatal (18 dígitos de referencia).', 'opcion_titulacion_id' => null, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 4],
            ['id' => 5, 'nombre' => 'Solicitud de Titulación', 'descripcion' => 'Formato oficial de solicitud de titulación firmado.', 'opcion_titulacion_id' => null, 'obligatorio' => 1, 'prerrequisito_id' => 1, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 10],
            ['id' => 10, 'nombre' => 'Documento de Tesis', 'descripcion' => 'Documento completo de tesis en formato PDF.', 'opcion_titulacion_id' => 1, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '15.00', 'orden' => 5],
            ['id' => 11, 'nombre' => 'Carta de Aceptación de Asesor de Tesis', 'descripcion' => 'Carta firmada por el asesor aceptando dirigir la tesis.', 'opcion_titulacion_id' => 1, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 6],
            ['id' => 20, 'nombre' => 'Memoria de Residencias Profesionales', 'descripcion' => 'Documento que describe el proyecto realizado durante la residencia.', 'opcion_titulacion_id' => 2, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '15.00', 'orden' => 5],
            ['id' => 21, 'nombre' => 'Carta de Aceptación de la Empresa', 'descripcion' => 'Carta membretada de la empresa que acredita la residencia profesional.', 'opcion_titulacion_id' => 2, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 6],
            ['id' => 30, 'nombre' => 'Constancia de Promedio', 'descripcion' => 'Constancia oficial del promedio general emitida por Control Escolar.', 'opcion_titulacion_id' => 3, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 5],
            ['id' => 31, 'nombre' => 'Carta de No Adeudo', 'descripcion' => 'Carta que acredita que el alumno no tiene adeudos en ninguna área.', 'opcion_titulacion_id' => 3, 'obligatorio' => 1, 'prerrequisito_id' => null, 'formato_permitido' => 'PDF', 'tamaño_max_mb' => '10.00', 'orden' => 6],
        ]);

        DB::table('normativa')->insertOrIgnore([
            ['id' => 1, 'titulo' => 'Requisitos Generales de Titulación', 'contenido' => '## Requisitos Generales

Para iniciar el trámite de titulación, el egresado deberá cumplir con los siguientes requisitos:

1. Haber acreditado el 100% de los créditos del plan de estudios.
2. Haber cumplido con el Servicio Social.
3. No tener adeudos en ninguna área del plantel (Biblioteca, Centro de Información, Finanzas, etc.).
4. Tener liberado el idioma inglés por la Coordinación de Lenguas Extranjeras.', 'categoria' => 'Requisitos Generales', 'modalidad_id' => null, 'orden' => 1],
            ['id' => 2, 'titulo' => 'Modalidades de Titulación', 'contenido' => '## Modalidades de Titulación

El TESCHA ofrece las siguientes opciones para obtener el título profesional:

1. **Tesis** — Desarrollo de un proyecto de investigación.
2. **Residencias Profesionales** — Memoria de proyecto en empresa.
3. **Excelencia Académica** — Promedio ≥ 9.5.
4. **EGEL-CENEVAL** — Testimonio sobresaliente.
5. **Créditos de Posgrado** — Al menos 2 asignaturas acreditadas.', 'categoria' => 'Opciones de Titulación', 'modalidad_id' => null, 'orden' => 2],
            ['id' => 3, 'titulo' => 'Documentación: Original vs Digital', 'contenido' => '## Documentos Originales vs Copias

| Documento | Formato de entrega |
|-----------|-------------------|
| Certificado Total de Estudios | Original físico + copia digital PDF |
| Constancia de Inglés | Original físico + copia digital PDF |
| Fotografías | Original físico (5 fotos miñón) + escaneo digital |
| Comprobante de pago | Copia digital PDF |
| Tesis/Memoria | Digital PDF + CD empastado (entrega física) |', 'categoria' => 'Docs Original vs Digital', 'modalidad_id' => null, 'orden' => 3],
            ['id' => 4, 'titulo' => 'Especificaciones Técnicas de Documentos', 'contenido' => '## Especificaciones Técnicas

### Fotografías
- Tamaño miñón (4.5 × 3.5 cm)
- 5 fotografías idénticas
- Fondo blanco mate (sin brillos)
- Camisa blanca y saco oscuro
- Sin maquillaje, sin patillas, sin lentes
- Frente completamente descubierta
- Sin retoques digitales
- Iluminación uniforme
- Pose frontal
- Papel fotográfico mate (no brillante)

### Documentos PDF
- Resolución mínima: 300 ppp
- Tamaño máximo: 10 MB por archivo
- No se aceptan archivos corruptos
- No se aceptan PDFs protegidos con contraseña', 'categoria' => 'Especificaciones Técnicas', 'modalidad_id' => null, 'orden' => 4],
            ['id' => 5, 'titulo' => 'Lineamientos Específicos para Tesis', 'contenido' => '## Tesis

### Requisitos adicionales
1. Documento de tesis completo en formato PDF.
2. Carta de aceptación del asesor de tesis.
3. El asesor debe ser un docente activo de la división ISC.
4. Se requieren 3 sinodales para el examen profesional.
5. El documento debe seguir el formato institucional de tesis.', 'categoria' => 'Opciones de Titulación', 'modalidad_id' => 1, 'orden' => 5],
            ['id' => 6, 'titulo' => 'Lineamientos para Residencias Profesionales', 'contenido' => '## Residencias Profesionales

### Requisitos adicionales
1. Memoria de residencias profesionales en PDF.
2. Carta membretada de aceptación de la empresa.
3. La residencia debe tener una duración mínima de 500 horas.
4. El proyecto debe estar relacionado con el perfil de egreso de ISC.', 'categoria' => 'Opciones de Titulación', 'modalidad_id' => 2, 'orden' => 6],
        ]);

        DB::table('directorio')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Dr. Juan Carlos Pérez Hernández', 'cargo' => 'Director General', 'departamento' => 'Dirección General', 'email' => 'direccion@tescha.edu.mx', 'extension' => '1001', 'orden' => 1],
            ['id' => 2, 'nombre' => 'Mtra. Ana Laura Sánchez Morales', 'cargo' => 'Directora Académica', 'departamento' => 'Dirección Académica', 'email' => 'academica@tescha.edu.mx', 'extension' => '1002', 'orden' => 2],
            ['id' => 3, 'nombre' => 'Mtra. Niza Lucero Alpízar Martínez', 'cargo' => 'Jefa de División ISC', 'departamento' => 'Jefatura de Ingeniería en Sistemas', 'email' => 'niza.alpizar@tescha.edu.mx', 'extension' => '1010', 'orden' => 3],
            ['id' => 4, 'nombre' => 'Mtra. Gabriela Hernández López', 'cargo' => 'Coordinadora de Lenguas Extranjeras', 'departamento' => 'Coordinación de Lenguas Extranjeras', 'email' => 'lenguas@tescha.edu.mx', 'extension' => '1020', 'orden' => 4],
            ['id' => 5, 'nombre' => 'Lic. Roberto Manuel Ávila Castro', 'cargo' => 'Jefe de Control Escolar', 'departamento' => 'Control Escolar', 'email' => 'control.escolar@tescha.edu.mx', 'extension' => '1030', 'orden' => 5],
            ['id' => 6, 'nombre' => 'Lic. Sandra López García', 'cargo' => 'Encargada del Centro de Información', 'departamento' => 'Centro de Información', 'email' => 'biblioteca@tescha.edu.mx', 'extension' => '1040', 'orden' => 6],
        ]);

        DB::table('requisitos_fotografia')->insertOrIgnore([
            ['id' => 1, 'descripcion' => 'Tamaño miñón (4.5 × 3.5 cm)', 'orden' => 1],
            ['id' => 2, 'descripcion' => 'Fondo blanco mate (sin brillos ni sombras)', 'orden' => 2],
            ['id' => 3, 'descripcion' => 'Camisa blanca formal', 'orden' => 3],
            ['id' => 4, 'descripcion' => 'Saco oscuro (negro o azul marino)', 'orden' => 4],
            ['id' => 5, 'descripcion' => 'Sin maquillaje visible', 'orden' => 5],
            ['id' => 6, 'descripcion' => 'Sin patillas largas (corte escolar)', 'orden' => 6],
            ['id' => 7, 'descripcion' => 'Sin lentes (ni oscuros ni de aumento)', 'orden' => 7],
            ['id' => 8, 'descripcion' => 'Frente completamente descubierta (sin fleco sobre cejas)', 'orden' => 8],
            ['id' => 9, 'descripcion' => 'Sin retoques digitales ni filtros', 'orden' => 9],
            ['id' => 10, 'descripcion' => 'Iluminación uniforme (sin sombras en el rostro)', 'orden' => 10],
            ['id' => 11, 'descripcion' => 'Pose frontal (mirando directamente a la cámara)', 'orden' => 11],
            ['id' => 12, 'descripcion' => 'Papel fotográfico mate (no brillante)', 'orden' => 12],
        ]);
    }
}
