# Bots

Los bots de Disband son integraciones alojadas por sí mismos. Usted ejecuta el código, Disband transmite mensajes desde y hacia él. Disband nunca aloja ni ejecuta el código de su bot.

## Cómo funciona

1. **Crea un bot** en **Configuración → Bots** y elige los escenarios que necesita. Obtienes
   Un token de vuelta, se muestra **una vez**.
2. En **Configuración → Bots**, genera un **enlace de invitación** para el servidor que quieras
   El bot para unirse y enviarlo al **propietario** de ese servidor.
3. El propietario abre el enlace y aprueba. El bot se convierte en miembro del servidor.
4. Ejecutas una de las bibliotecas de clientes en algún lugar (un servidor, una función en la nube,
   tu portátil) y se conecta a Disband con el token.

## ámbito

El alcance de un bot en un servidor es la **intersección** de los ámbitos que solicitaste al crearlo y los ámbitos que el propietario aprobó para ese servidor específico:

| Alcance                 | Descripción                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `messages.read` | Recibir eventos de mensajes en el gateway y leer mensajes/canales. |
| `messages.write` | Enviar y responder a mensajes en canales que el bot pueda ver. |
| `members.read` | Lista los miembros de los servidores a los que se ha unido el bot.                      |
| `channels.manage` | Crear, renombrar y eliminar canales, también necesita el rol `manage_channels` en el servidor. |

## Autenticación con token

Cada llamada API se autentica con el token del bot:

```
Authorization: Bot <token>
```

Los tokens de bot están **hashados en reposo**: el token bruto nunca se almacena ni se recupera. Si se filtran (o ya no necesitas el bot), revócalo en **Configuración → Bots**; la revocación mata el token inmediatamente.

## Límites y seguridad

- Hasta **5 bots por cuenta**. Un bot puede ser revocado en cualquier momento, lo que mata su
  Token.
- Mensajes de hasta **4.000 caracteres**. Los bots necesitan el rol `mention_everyone`
  Permiso para usar `@everyone`.
- Solo el **propietario** de un servidor puede aprobar una invitación de bot. Las invitaciones caducan después de
  **7 días**.
- Los tokens de bot se han hashado en reposo; el token bruto nunca se almacena ni se recupera.
- Los bots nunca pueden acceder directamente a la base de datos, cada acción pasa por un escopado.
  Puntos finales API.

## Elige un camino

- **[Primeros pasos](getting-started.md)** — crea un bot e invita a él.
- **[Aloja tu propio bot](hosting-your-own-bot.md)** — dónde ejecutar el cliente.
- **[JavaScript](clients/javascript.md)** / **[Python](clients/python.md)**.
- **[Referencia de la API](api-reference.md)** si quieres hablar con la API directamente.
- **[Plantillas](templates.md)** — bienvenidos, gestores de boletos y más listos para adaptarse.
