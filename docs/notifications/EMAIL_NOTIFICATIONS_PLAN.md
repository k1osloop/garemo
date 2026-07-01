# Garemo Email Notifications Plan

Estado actual: pendiente de configurar proveedor de email. Las notificaciones internas ya estan implementadas para moderacion, reportes y cambios de estado del negocio.

## Eventos Recomendados

- Negocio aprobado: avisar que el emprendimiento ya puede aparecer en directorio y mapa.
- Negocio rechazado: incluir observacion admin y pasos de correccion.
- Negocio suspendido temporalmente: informar que esta en revision por reportes o verificacion.
- Reporte resuelto: avisar al emprendedor que el admin reviso el caso.

## Proveedor Recomendado

- Resend para emails transaccionales.
- Alternativa: Supabase Edge Functions conectadas a un proveedor SMTP seguro.

## Variables Necesarias

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO` si se necesita responder a soporte.

Nunca exponer estas variables en frontend, `NEXT_PUBLIC_*`, logs, commits ni reportes.

## Arquitectura Sugerida

1. Mantener la tabla `user_notifications` como fuente interna de eventos.
2. Crear una Edge Function o endpoint server-side que lea eventos pendientes.
3. Enviar email solo desde entorno servidor con secretos protegidos.
4. Guardar estado de envio para evitar duplicados.
5. Mantener in-app notification aunque falle email.

## Plantillas

### Aprobacion

Asunto: Tu negocio fue aprobado en Garemo

Mensaje: Tu emprendimiento ya esta visible en Garemo. Los compradores pueden encontrarte en el directorio y mapa.

### Rechazo o Correccion

Asunto: Tu negocio necesita correcciones

Mensaje: El administrador reviso tu negocio y encontro observaciones. Revisa Garemo para corregir la informacion y volver a revision.

### Suspension Temporal

Asunto: Tu negocio esta en revision

Mensaje: Tu negocio fue suspendido temporalmente mientras revisamos reportes o informacion pendiente.

### Reporte Resuelto

Asunto: Un reporte fue revisado

Mensaje: El administrador reviso un reporte relacionado con tu negocio. Entra a Garemo para revisar si hay observaciones.
