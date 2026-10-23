# Estado del sistema

La página de estado de Disband es autohostada. No depende de un servicio de estado de terceros, por lo que aún puede informar con precisión cuando el alojador web principal, API, o la entrega de activos estáticos tengan problemas.

- Página pública: [disband.dev/status](https://www.disband.dev/status)
- Feed RSS: [disband.dev/status/feed.xml](https://www.disband.dev/status/feed.xml)
- Administrador del propietario: [disband.dev/status/admin](https://www.disband.dev/status/admin)

## Lo que muestra la página pública

La página de grupos de monitores por servicio muestra, para cada monitor:

- el estado actual desde el último chequeo;
- el estado HTTP y el tiempo de respuesta de ese cheque;
- una barra de tiempo de actividad de 90 días, un segmento por día;
- la última vez que se ejecutó un cheque.

Debajo de los monitores se encuentran incidentes, mantenimiento programado y anuncios. Cada uno abre una página de detalles con la cronología completa de la actualización. El feed publica los últimos 25 incidentes, ventanas de mantenimiento y anuncios publicados como RSS 2.0.

## Cheques

Una función Supabase Edge llamada `status-probe` se ejecuta cada minuto bajo `pg_cron`. Probará cada monitor habilitado en paralelo y registrará una fila por comprobación.

Cada monitor tiene:

| Contexto | Significado                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Nombre | La etiqueta pública, por ejemplo **Sitio web**.                             |
| Grupo | La sección bajo la que aparece, por ejemplo **Disband**. |
| URL             | El `http` o `https` URL absoluto para solicitar.                         |
| Método | `GET` o `HEAD`. Por defecto es `GET`.                                    |
| Estado esperado | El estado exacto de HTTP que cuenta como saludable. Por defecto es `200`. |
| Palabra clave | Texto opcional que debe aparecer en el cuerpo de la respuesta.                   |
| Tiempo de espera | 1-30 segundos. Por defecto es de 10 segundos.                                  |
| Cabeceras | Cabeceras de solicitud opcionales, almacenadas en el lado del servidor.                          |
| Activado | Ya sea que la sonda lo solicite o no.                                  |
| Público | Ya sea que contribuya a la instantánea pública.                         |

Un monitor es saludable solo cuando el código de estado coincide **y** la palabra clave opcional está presente. Se siguen las redirecciones. Se registra un tiempo de espera excedido, un error de red, un estado incorrecto o la ausencia de la palabra clave como una comprobación fallida con la razón.

La sonda funciona de forma independiente de la aplicación web. Un fallo en el servidor web no detiene la grabación de las comprobaciones.

## Historia y tiempo de actividad

Cada cheque se almacena en `status_checks`. Un desencadenante de base de datos dobla cada cheque en `status_daily`, por lo que la barra de 90 días es una lectura barata en lugar de una agregación sobre millones de filas.

- Los cheques brutos se conservan durante **90 días**.
- Los volúmenes diarios se conservan durante **180 días**.
- La página pública muestra los últimos **90 días**.
- El segmento de cada día es el porcentaje de cheques exitosos ese día.

Una brecha, un día sin cheques, se muestra como sin datos, no como tiempo de inactividad.

## Incidentes automáticos

La sonda abre un incidente automáticamente cuando un monitor ha fallado **tres comprobaciones seguidas**. El incidente es un **incidente grave**, vinculado a ese monitor, y comienza en **Investigando** con una actualización automatizada que contiene el último error.

Cuando el siguiente cheque tenga éxito, el incidente se mueve a **Resuelto** y una actualización registra aproximadamente cuánto tiempo duró la interrupción. El incidente permanece en la página y en el feed con su historial completo.

Si un servicio está funcionando pero no falla tres veces consecutivas, no se abre ningún incidente automático. El propietario aún puede agregar una actualización manual a un incidente automático mientras este está abierto.

## Incidentes manuales, mantenimiento y anuncios

El propietario puede publicar tres tipos de entrada:

| Tipo | Uso para                                                         |
| ------------- | --------------------------------------------------------------- |
| `incident` | Un problema no planeado.                                           |
| `maintenance` | Trabajo planificado, opcionalmente con un inicio y un final de tiempo. |
| `announcement`| Un aviso general de servicio que no es una interrupción.                 |

Un incidente puede afectar a uno, varios o todos los monitores. Su impacto es uno de `none`, `minor`, `major` o `critical`.

Los estados de actualización son:

- `investigating`
- `identified`
- `monitoring`
- `resolved`
- `scheduled`
- `in_progress`
- `completed`
- `published`

Cada actualización agrega una entrada con fecha y hora a la línea de tiempo del incidente y establece el estado actual del incidente. Marcar una actualización `resolved` o `completed` también establece el tiempo resuelto. Publicar una actualización posterior con otro estado la reabre.

## Estado general

El banner se decide en este orden:

1. Una ventana de mantenimiento activo dice **Mantenimiento en progreso**, o
   **Mantenimiento programado** antes de que comience.
2. Un incidente crítico o importante activo dice **Cierre importante**.
3. Un incidente menor activo dice **Parcialmente degradado**.
4. Los monitores fallidos dicen **Parcialmente degradado** o **Cierre importante** cuando cada
   El monitor público está fallando.
5. Sin fallos y al menos con un resultado, dice **Todos los sistemas operativos**.
6. Antes de que lleguen los primeros cheques, dice **Esperando los primeros cheques**.

Los incidentes resueltos no afectan al banner.

## intimidad

El camino de lectura público es una función de base de datos, no un acceso directo a la tabla. Devuelve nombres de monitores, grupos, estados, latencia, tiempo de actividad y incidentes. Omite deliberadamente:

- monitorear URLs;
- encabezados de la solicitud;
- texto de error de la sonda;
- identificadores de comprobación internos;
- las identidades detrás de las actualizaciones de incidentes.

Las tablas básicas tienen la seguridad a nivel de fila habilitada sin políticas públicas. Solo el rol de servicio y la función de sondeo pueden leerlas directamente.

## administración

`/status/admin` está restringido al **propietario de la plataforma** que haya iniciado sesión. No es un rol de espacio y no se puede conceder a otro miembro. Las solicitudes no autenticadas reciben `401`; otras cuentas iniciadas sesión reciben `403`.

La pantalla de administración puede:

- crear, editar, habilitar, deshabilitar, publicar o eliminar monitores;
- ver el URL, los encabezados y el último resultado de cada monitor;
- publicar incidentes, ventanas de mantenimiento y anuncios;
- agregar actualizaciones de la línea de tiempo y cambiar el impacto o los servicios afectados de un incidente;
- eliminar un monitor y su historial.

### Administrador API

La pantalla utiliza estas rutas solo para los propietarios:

| Método                 | Punto final                                       |
| ---------------------- | ---------------------------------------------- |
| `GET`, `POST`          | `/api/status-admin/monitors`                   |
| `PATCH`, `DELETE`      | `/api/status-admin/monitors/{id}`              |
| `GET`, `POST`          | `/api/status-admin/incidents`                  |
| `PATCH`, `DELETE`      | `/api/status-admin/incidents/{id}`             |
| `POST`                 | `/api/status-admin/incidents/{id}/updates`     |

Aceptan el token de acceso de Supabase del propietario como `Authorization: Bearer <token>`. Son detalles de implementación de la pantalla de administrador, no una API público; la forma puede cambiar.

## Notas operativas

- La sonda se autentica con un secreto almacenado en Supabase Vault bajo
  `status_probe_key`. El secreto se compara dentro de la base de datos y no es
  Regresó a la función.
- El trabajo `pg_cron` se llama `status-probe`. Lee el secreto de Vault en
  Cada ejecución, por lo que rotar el secreto no requiere editar el trabajo.
- La función Edge se despliega con la verificación JWT desactivada, porque
  Autenticarse con el secreto del Vault en su lugar.
- Si la propia sonda deja de funcionar, la página mostrará que está desactualizada
  **últimas veces comprobadas**. Ese es el señal para inspeccionar el trabajo cron y Edge
  Registros de funciones.

## relacionado

- [Webhooks](webhooks.md) — envía notificaciones de interrupciones a un canal.
- [Embeds](embeds.md) — formatea esas notificaciones.
