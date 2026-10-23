# Python 클라이언트 — `disband-bot`

공식적인 Python 클라이언트. 표준 라이브러리만 사용하므로 클라이언트 자체를 제외하고 설치할 것이 없습니다. Python 3.9 이상에서 작동합니다.

## 설치하다

```bash
pip install disband-bot
```

또는, 이 단일 저장소에서:

```bash
pip install ./packages/disband-bot-python
```

## 빠른 시작

```python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("ready")
def on_ready(me):
    print(f"Logged in as {me['name']} ({', '.join(me['scopes'])})")

@client.on("messageCreate")
def on_message(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()  # connects and blocks forever
```

핸들러는 일반 또는 `async def`일 수 있으며, 둘 다 지원됩니다.

## 건설자

### `Client(token, base_url="https://www.disband.dev", gateway_timeout=20)`

| 인수         | 기본값                      | 설명                                  |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `token`          | *(필수)*                 | **설정 → 봇**에서 가져온 봇 토큰.      |
| `base_url`       | `"https://www.disband.dev"`  | API 루트(사용자 지정 도메인을 위해 변경).       |
| `gateway_timeout`| `20`                         | 게이트웨이 펌프당 초수(1–20).             |

## 수명주기

| 방법 | 설명                                                        |
| -------- | ------------------------------------------------------------------ |
| `run()` | 연결, `ready`를 방출, 백그라운드 스레드에서 게이트웨이 루프를 시작하고 영원히 차단합니다. |
| `close()`| 루프를 멈춥니다.                                                    |

## 이벤트

`client.on("name", handler)`로 등록하세요 - 장식가 또는 일반 호출로 - 그리고 단일 샷 처리기용 `once`도 등록하세요.

| 이벤트           | 인수     | 참고                                                                |
| --------------- | -------- | -------------------------------------------------------------------|
| `ready`         | `user`   | `user["id"]`, `user["name"]`, `user["scopes"]`, 등.               |
| `messageCreate` | `message`| 봇이 볼 수 있는 서버에 새 메시지가 있습니다.                          |
| `messageUpdate` | `message`| 메시지가 편집되었습니다(`content`, `edited_at` 업데이트됨).             |
| `messageDelete` | `message`| 메시지가 삭제되었습니다(`content` 비어 있음; `id`/`channel_id` 유효함). |
| `error`         | `error`  | 게이트웨이 오류. 토큰이 유효하지 않은 경우를 제외하고 루프는 자동으로 재시도하며, 이 경우 중지됩니다. |

### `Message`

| 필드         | 유형             | 설명                                        |
| ------------- | ---------------- | -------------------------------------------------- |
| `id`          | `str`            | 메시지 아이디.                                        |
| `channel_id` | `str`            | 채널 아이디.                                        |
| `server_id` | `str \| None` | 서버 ID.                                         |
| `author`      | `dict \| None`   | `{ "id", "username", "display_name", "avatar_url", "is_bot" }`. |
| `content`     | `str`            | 메시지 텍스트.                                      |
| `reply_to_id` | `str \| None` | 이에 답하는 메시지, 만약 있는 경우.                |
| `mentions` | `list` | 언급된 사용자.                                   |
| `attachment` | `dict \| None` | 메시지에 파일이 있을 때 `{ "url", "type" }`. |
| `created_at` | `str \| None` | ISO 타임 스탬프.                                     |
| `edited_at` | `str \| None` | 마지막 편집의 ISO 타임 스탬프.                    |
| `display_id` | `int \| None` | 순차적인 디스플레이 번호.                     |
| `author_is_bot` | `bool`          | 발신자가 봇이었을 때(재산) 참입니다.         |

**방법** - `message.reply(content)`는 같은 채널에서 회신합니다.

## 방법들

```python
client.send_message(channel_id, "Deploy finished")            # send
message.reply("pong")                                          # reply to a received message

messages = client.list_messages(channel_id, limit=25, before="…")
channels = client.list_channels(server_id)
members  = client.list_members(server_id)

channel_id = client.create_channel(server_id, "deploys")
client.rename_channel(channel_id, "deploys-2")
client.delete_channel(channel_id)

client.leave_server(server_id)

invite = client.create_invite(server_id, ["messages.read", "messages.write"])
# invite["invite_url"] -> send to the server owner
```

## 오류

클라이언트는 `.status` 및 `.body`로 `DisbandError`의 하위 클래스를 생성합니다.

| 오류            | 언제                                          |
| ---------------- | --------------------------------------------- |
| `AuthError` | `401` - 유효하지 않거나 취소된 토큰입니다. 게이트웨이 루프가 여기서 멈춥니다. |
| `PermissionError`| `403` — 스코프 또는 역할 권한이 누락되었습니다. |
| `RateLimitError` | `429` - `retry_after` 초를 포함합니다. |
| `HttpError`      | 2xx 이외의 다른 상태.                     |

내부적으로 클라이언트는 [API 참조](../api-reference.md) 위에 있는 얇은 래퍼입니다: `REST.get/post/patch/delete`와 `Authorization: Bot <token>`이 있습니다.
