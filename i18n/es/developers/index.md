# Desarrolladores

Construye sobre Disband: bots, integraciones y herramientas que hablan con tus espacios desde el exterior. Todo aquí es alojado de forma independiente: Disband nunca ejecuta tu código.

## Lo que puedes construir

- **Bots** — cuentas alojadas por sí mismas que leen y escriben mensajes, administran canales,
  Y reaccionar a eventos a través de un gateway de long-polling. Consulte la [Bots](../bots/index.md).
- **Webhooks** — notificaciones de un solo sentido publicadas a través de una URL secreta, sin bot
  Código o token. Consulte [Webhooks](webhooks.md).
- **Tarjetas incorporadas**: notas de lanzamiento estructuradas, alertas y actualizaciones de estado.
  Ver [Embeds](embeds.md).
- **Clientes personalizados** — hable directamente con la API HTTP si necesita un idioma el
  Los clientes enviados no cubren. La referencia [Referencia de la API](../bots/api-reference.md) es
  El contrato.
- **Integraciones de estado** - siga los incidentes de Disband a través de RSS, o lea cómo el
  [Estado del sistema](status.md) registra comprobaciones y abre incidentes.

## Empieza aquí

1. **[Primeros pasos](../bots/getting-started.md)** — crea un bot, consigue su
   Token, invítalo a un espacio. Alrededor de dos minutos.
2. **[Aloja tu propio bot](../bots/hosting-your-own-bot.md)** — dónde ejecutarlo
   El cliente y cómo mantenerlo vivo.
3. **[JavaScript](../bots/clients/javascript.md)** o
   **[Python](../bots/clients/python.md)**.
4. **[Referencia de la API](../bots/api-reference.md)** para los puntos finales exactos.
5. **[Webhooks](webhooks.md)** o **[Embeds](embeds.md)** si solo necesitas
   notificaciones de un solo sentido.
6. **[Estado del sistema](status.md)** para la página de estado público y el feed RSS.

## Implementando Disband en un juego o aplicación

Disband expone una API HTTP sin cifrar autenticado con un token de bot. No hay SDK nativo ni tiempo de ejecución RPC para vincular, cualquier pila que pueda realizar solicitudes HTTPS funciona. Una integración típica se ve así:

1. Crea un bot en **Configuración → Bots** y otorgale `messages.write` (y
   `channels.manage` si debería crear canales).
2. Invita al bot al espacio en el que quieres publicar.
3. Guarde el token en la tienda secreta de su juego o aplicación, nunca en el lado del cliente.
   Código que se envía a los jugadores.
4. Desde tu backend, llama a los puntos finales con alcance:

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. Para responder al chat desde dentro de tu juego, consulta el gateway con frecuencia y envía
   Eventos `messageCreate` a su lógica de juego.

### Notas de seguridad

- Los tokens de bot se han hashado en reposo y solo se muestran una vez. Revocarlo inmediatamente si uno
  fugas.
- Mantenga los tokens en un servidor que controle. Enviar un token en un cliente de juego permite
  Cualquiera que se haga pasar por tu bot.
- Limite los bots a los mínimos privilegios que necesiten. Un bot que solo publique no necesita
  `members.read` o `channels.manage`.

## Temas para desarrolladores

Si estás construyendo un cliente o skin de marca, las variables CSS en la [Temas](../themes/index.md) son el estilo estable API.

## Preguntas

- Informes de errores: abra un problema o envíe un correo electrónico al equipo.
- Para problemas específicos de la cuenta, utilice el soporte de la aplicación.
