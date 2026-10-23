# Documentación de Disband

Todo lo que necesitas para construir en Disband.

## Bots

Los bots de Disband son **integraciones alojadas por sí mismos**: tú ejecutas el código, Disband transmite mensajes desde y hacia él. Disband nunca aloja ni ejecuta tu bot.

- **[Primeros pasos](bots/getting-started.md)** — crea un bot, obtén su token,
  y ábralo a un servidor. Tarda unos dos minutos.
- **[Bots](bots/index.md)** — ámbitos, invitaciones, límites y seguridad.
- **[Aloja tu propio bot](bots/hosting-your-own-bot.md)** — dónde ejecutar el
  Cliente y cómo mantenerlo vivo.
- **[JavaScript](bots/clients/javascript.md)** — `@disband/bot`.
  Cero dependencias; funciona en Node.js 18+, Deno, Bun y el navegador.
- **[Python](bots/clients/python.md)** — `disband-bot`.
  Solo biblioteca estándar; funciona en Python 3.9+.
- **[Referencia de la API](bots/api-reference.md)** — la API HTTP con la que hablan ambos clientes.

## Desarrolladores

Crea bots e integra Disband en sus juegos y aplicaciones utilizando la API HTTP.

- **[Desarrolladores](developers/index.md)** — descripción general, comienza aquí y seguridad
  Notas para integraciones de juegos/aplicaciones.
- **[Bots](bots/index.md)** — ámbitos, invitaciones, límites y seguridad.
- **[Referencia de la API](bots/api-reference.md)** — la API HTTP con la que hablan ambos clientes.
- **[Plantillas](bots/templates.md)** — bots de bienvenida, gestores de tickets y más listos para adaptarse.
- **[Webhooks](developers/webhooks.md)** — publica desde CI, monitorización o un servidor de juego a través de una URL secreta. No se necesita ningún bot.
- **[Embeds](developers/embeds.md)** — Tarjetas con estilo de Discord para lanzamientos,
  alertas y actualizaciones de estado.
- **[Estado del sistema](developers/status.md)** — cómo la página pública de estado comprueba los servicios, registra el tiempo de actividad y gestiona los incidentes.

## Temas

Los miembros de SUPER pueden reestilizar toda la aplicación con CSS personalizado, temas incluidos e iconos subidos.

- **[Temas](themes/index.md)** — las variables CSS que son una API estable, los selectores que son seguros para apuntar y una plantilla de inicio.

## Descargar los clientes

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** — el cliente JavaScript
  (`npm install ./disband-bot-0.1.0.tgz`).
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** — el cliente Python
  (`pip install ./disband-bot-python-0.1.0.tar.gz`).
