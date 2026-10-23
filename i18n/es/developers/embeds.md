# Embeds

Un embed es una tarjeta estructurada adjunta a un mensaje: una franja de color, un título, texto enriquecido, campos, imágenes y un pie de página. Disband utiliza la forma y los límites de embed de Discord, por lo que un embed construido para un webhook o bot Discord normalmente funciona sin cambios.

Los enlaces pueden enviarse por:

- [Webhooks](webhooks.md), con `embeds` en el cuerpo de ejecución;
- [Referencia de la API](../bots/api-reference.md), con `embeds` en el cuerpo del mensaje de envío.

Los mensajes del lado del cliente no pueden establecer integraciones directamente. Esto evita que un miembro forje un webhook o una tarjeta de incorporación.

## Un ejemplo completo

```json
{
  "content": "A new release is ready.",
  "embeds": [
    {
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "url": "https://disband.dev/changelog",
      "color": 5793266,
      "timestamp": "2026-10-19T20:15:00.000Z",
      "author": {
        "name": "Release bot",
        "url": "https://disband.dev",
        "icon_url": "https://disband.dev/logo.png"
      },
      "thumbnail": {
        "url": "https://disband.dev/logo.png"
      },
      "fields": [
        { "name": "Channel", "value": "stable", "inline": true },
        { "name": "Build", "value": "1842", "inline": true },
        { "name": "Rollout", "value": "100% of spaces", "inline": false }
      ],
      "footer": {
        "text": "Disband releases",
        "icon_url": "https://disband.dev/logo.png"
      }
    }
  ]
}
```

`5793266` es `0x5865F2`, el color azul de la marca de Disband.

## El objeto de incorporación

| Campo | Tipo | Notas                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | cadena | Hasta 256 caracteres. Renderizado como un enlace cuando se establece `url`. |
| `description` | cadena | Hasta 4.096 caracteres. Soporta Markdown.                  |
| `url`         | cadena | Hace que el título sea clicable. `http` o `https` URL absoluto. |
| `color`       | número | `0xRRGGBB` como entero. También funciona una cadena `"#5865F2"`.  |
| `timestamp` | cadena | ISO 8601 fecha y hora. Mostrada en el pie de página.                |
| `footer` | objeto | `{ "text": "…", "icon_url": "…" }`. Texto hasta 2.048 caracteres. |
| `author` | objeto | `{ "name": "…", "url": "…", "icon_url": "…" }`. Nombre hasta 256 caracteres. |
| `fields` | arreglo | Hasta 25 objetos de campo. Ver a continuación.                          |
| `image`       | objeto | `{ "url": "…" }`. Mostrarado debajo de la descripción.          |
| `thumbnail` | objeto | `{ "url": "…" }`. Mostrado a la derecha.                   |
| `video`       | objeto | Aceptado para compatibilidad; aún no se ha renderizado.              |
| `provider` | objeto | Aceptado para compatibilidad; aún no se ha renderizado. |

Todos los campos URL deben ser `http` o `https` URLs absolutos. Los URLs que contengan un nombre de usuario o contraseña se descartan. Las imágenes URLs inseguras son descartadas tanto por el cliente como por el servidor.

### campo

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| Propiedad | Tipo | Notas                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | cadena | Obligatorio. Hasta 256 caracteres. |
| `value` | cadena | Obligatorio. Hasta 1.024 caracteres. Markdown funciona. |
| `inline` | booleano | `true` coloca los campos uno al lado del otro donde el espacio lo permita. |

Un campo con un `name` o `value` faltante o vacío es un error duro. Si puede que tenga datos vacíos, omita el campo o sustituya por un guión.

## Markdown

Las descripciones y los valores de campo respaldan el Disband de Markdown: negrita, cursiva, tachada, código en línea, bloques de código, enlaces y emojis personalizados. Los títulos, los nombres de los autores y el texto del pie de página son texto plano.

Las menciones dentro del texto incorporado se muestran, pero no crean un ping. Utilice `content` si necesita una notificación de mención real.

## Límites

| Límite                              | Valor |
| ---------------------------------- | ----- |
| Integraciones por mensaje                 | 10 |
| Título                              | 256 |
| Descripción                        | 4.096 |
| Campos por inserción                   | 25    |
| Nombre del campo                     | 256 |
| Valor del campo                    | 1.024 |
| Texto del pie de página                        | 2.048 |
| Nombre del autor                    | 256 |
| Total de caracteres en todos los enlaces | 6.000 |

El total incluye títulos, descripciones, texto del pie de página, nombres de autores, nombres de campos y valores de campos. URLs y los metadatos de la imagen no cuentan.

## Cómo se normaliza la entrada

La API valida cada incorporación antes de que llegue a la base de datos:

- Se eliminan las propiedades desconocidas.
- El texto se recorta. El texto demasiado largo se corta al límite en lugar de ser rechazado.
- Se eliminan los colores inválidos.
- Se eliminan los URLs inválidos. Se conservan los campos URL válidos.
- Se eliminan los tiempos de inicio de sesión inválidos.
- Un embed vacío es rechazado con `Embed is empty`.
- Un campo sin nombre o valor se rechaza.
- Se rechaza más de 10 integraciones, o más de 6.000 caracteres en total.

Los guiones cuadrados en un nombre de error identifican el elemento exacto, por ejemplo:

```text
embeds.0.fields.2: name and value are required
```

## Enviando integraciones

### Desde un webhook

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "A new release is ready.",
    "embeds": [{
      "title": "Disband 2.4.1",
      "description": "Fixes the **role picker** and improves uploads.",
      "color": 5793266
    }]
  }'
```

### De un bot

```bash
curl -X POST 'https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages' \
  -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "embeds": [{
      "title": "Nightly build",
      "description": "All 412 tests passed.",
      "color": 5793266
    }]
  }'
```

Cuando se envían solo enlaces incorporados, `content` puede omitirse. Un mensaje que no contenga ni contenido ni enlaces incorporados será rechazado.

## relacionado

- [Webhooks](webhooks.md) — ejecutar y administrar mensajes webhook.
- [Referencia de la API](../bots/api-reference.md) - los puntos finales de mensajes del bot.
