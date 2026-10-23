# Aloja tu propio bot

Disband no hospeda ni ejecuta tu bot. Ejecutas el cliente donde quieras, y habla con Disband a través de una puerta de enlace de polling largo utilizando el token del bot. Esta página cubre el lado práctico de mantener un bot vivo.

## Dónde ejecutarlo

Cualquier máquina que pueda hacer solicitudes HTTPS salientes funciona. Dado que el gateway realiza consultas periódicas (su código mantiene abierta una conexión y Disband devuelve eventos cuando llegan), no necesita una dirección pública, puertos entrantes ni un websocket.

Buenas opciones, las más baratas primero:

| Anfitrión                       | Notas                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| Un ordenador portátil / de sobremesa | Perfecto para un bot personal que esté en línea cuando tú lo estés. |
| Un pequeño VPS (1 GB de RAM) | ~4-6 $/mes; el cliente JavaScript necesita casi nada. |
| Una función/trabajador en la nube | El trabajo sin servidor funciona si la plataforma permite un proceso de larga duración; los clientes son lo suficientemente estáticos como para reiniciarse de forma barata. |
| Un contenedor / Pterodáctilo | Los clientes no tienen dependencias de tiempo de ejecución, por lo que cualquier imagen funciona. |

## Lo que realmente necesitas

- **JavaScript**: Node.js 18+, o Deno, o Bun. Cero dependencias de tiempo de ejecución.
- **Python**: Python 3.9+. Solo biblioteca estándar (threading + `urllib`).

No hay base de datos, no hay cola y no hay marco para instalar.

## Manteniéndolo vivo

El gateway se ejecuta en bucle indefinidamente por sí solo; se vuelve a conectar y vuelve a intentarlo automáticamente. Tres cosas tienden a matar a los bots reales:

1. **Bucles de fallos.** Envuelva al cliente en un supervisor y reinicie en caso de fallo:
   ```bash
   # systemd
   [Unit]
   Description=disband-bot
   After=network-online.target

   [Service]
   ExecStart=/usr/local/bin/node /opt/my-bot/index.js
   Restart=always
   RestartSec=3
   Environment=DISBAND_BOT_TOKEN=…

   [Install]
   WantedBy=multi-user.target
   ```

2. **Tokens caducados.** Si el bot es revocado (o una invitación caduca antes de que se
   Aprobado), el gateway de la API devuelve `401`. Manejelo: registre claramente y detenga,
   En lugar de volver a intentarlo para siempre. Ambos clientes lo manifiestan como un evento `error` —
   JavaScript de `AuthError` / Python de `AuthError` — y el bucle se detiene en su lugar
   De martilleo.

3. **Drift de configuración silenciosa.** Mantenga el token en una variable de entorno o secreto
   Almacenar, no en la fuente. Si rota el token, reinicie el proceso con
   El nuevo valor.

## Lectura y escritura de datos

Los bots solo hablan con la API HTTP de alcance limitado. Para consultar o persistir el estado, use cualquier almacenamiento que ya esté operando, ya sea un archivo, una base de datos, Redis, el cliente no se importa.

## Bots multiservers

Un bot puede ser invitado a muchos servidores. Los ámbitos aprobados son por servidor, por lo que un bot que pueda leer mensajes en todas partes solo escribirá en el lugar donde el propietario ha concedido `messages.write`. Su código puede ramificarse en `message.server_id` si el comportamiento necesita diferir por servidor.

## Avanzando más allá

- Consulte la **[Referencia de la API](api-reference.md)** para los puntos finales exactos que
  Los clientes utilizan - útil si quieres escribir tu propio cliente en otro idioma.
- El **[JavaScript](clients/javascript.md)** y **[Python](clients/python.md)**
  Las páginas de referencia incluyen todos los métodos y eventos.
