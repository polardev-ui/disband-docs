# 봇 API 참조

봇이 대화하는 HTTP API. 두 클라이언트 라이브러리 모두 정확히 이러한 엔드포인트에 대한 얇은 래퍼이므로 이 페이지는 다른 언어로 클라이언트를 작성하는 레시피이기도 합니다.

## 베이스 URL 및 인증

```
https://www.disband.dev
```

모든 요청은 다음과 같이 전송됩니다.

| 머리글          | 값                    |
| --------------- | ------------------------ |
| `Authorization` | `Bot <token>`            |
| `Content-Type` | `application/json`       |

실종되거나 유효하지 않은 토큰은 `401 { "error": "Invalid bot token" }`을 반환합니다. 취소된 봇도 동일한 결과를 반환하므로 `401`은 "토큰 확인"을 의미하며 "재시도"는 아닙니다.

모든 엔드포인트는 스코프가 지정되어 있습니다: 봇은 스코프(및 서버별 권한 부여)가 허용하는 내용만 읽거나 쓸 수 있습니다. 4xx/5xx 응답은 JSON으로 시작하며 `error` 필드가 있습니다.

## 쓰기 전에 읽는다

- `messages.write` / `channels.manage`를 부여하지 않는 한 봇은 **읽기 스코프**입니다.
- `channels.manage` 작업에는 봇 계정이 보유해야 하는 것도 필요합니다.
  `manage_channels` **그 서버에서의 역할**.
- 두 클라이언트 모두 메시지 이벤트별 스코프에 대한 정보를 보유하고 있습니다: API에는 아무 내용이 없습니다.
  봇이 부여받지 못한 데이터를 반환합니다.

## 게이트웨이(이벤트 장기 대기)

```
GET /api/v1/gateway?timeout=20
```

게이트웨이는 웹소켓이 아니라 장기 대기입니다. 요청은 이벤트가 사용 가능하거나 시간 초과가 만료될 때까지 서버 측을 차단한 다음 도착한 내용을 반환합니다. 클라이언트는 이에 대해 반복합니다. 시간 초과는 1~20초로 제한됩니다.

응답:

```json
{
  "events": [
    {
      "bot_id": "…",
      "type": "messageCreate",
      "payload": { "id": "…", "channel_id": "…", "server_id": "…", "content": "…" }
    }
  ]
}
```

`type`는 `messageCreate`, `messageUpdate` 또는 `messageDelete`입니다. 배송은 **최소 한 번**입니다. 가져오기와 처리 사이에 충돌하는 봇은 동일한 이벤트를 다시 볼 수 있습니다. idempotently 처리하십시오(`payload.id`로).

### 이벤트 페일로드

| 유형             | 페일로드 필드                                        |
| ---------------- | ----------------------------------------------------- |
| `messageCreate` | 전체 메시지 객체(아래).                      |
| `messageUpdate` | `id`, `channel_id`, `server_id`, `content`, `edited_at` |
| `messageDelete` | `id`, `channel_id`, `server_id`                       |

메시지 객체:

```json
{
  "id": "…",
  "channel_id": "…",
  "server_id": "…",
  "author": { "id": "…", "username": "…", "display_name": "…", "avatar_url": "…", "is_bot": false },
  "content": "Deploy finished",
  "reply_to_id": null,
  "mentions": [],
  "embeds": [],
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-01-01T00:00:00Z",
  "edited_at": null,
  "display_id": 1234
}
```

`messages.read`가 있는 봇만(봇 계정 **및** 해당 서버에서 부여된 경우 모두) 이벤트에 수신됩니다.

## 엔드포인트

### 메시지

**POST `/api/v1/channels/:id/messages`** - 메시지를 전송합니다(`messages.write`).

```json
{
  "content": "Deploy finished",
  "reply_to_id": null,
  "embeds": [
    { "title": "Build 1842", "description": "All 412 tests passed.", "color": 5793266 }
  ]
}
```

`content`는 `embeds`가 있는 경우 생략될 수 있습니다. 포함물은 Discord의 모양과 제한을 사용합니다. 각 필드와 정확한 제한 사항은 [임베드](../developers/embeds.md)을 참조하십시오. 콘텐츠나 포함물이 없는 메시지는 `400`로 거부됩니다.

`201`와 `{ "message": { … } }`를 함께 반환합니다.

**`/api/v1/channels/:id/messages`를 얻으세요** - 메시지를 읽습니다(`messages.read`).

질문: `limit` (1-100, 기본값 50), `before` (메시지 ID, 역페이징용).

`200`와 `{ "messages": [ … ] }`를 함께 반환합니다.

### 채널들

**`/api/v1/servers/:id/channels`를 얻으세요** - 채널 목록(`messages.read`).

`{ "channels": [ … ] }`를 반환합니다.

**POST `/api/v1/servers/:id/channels`** - 채널(`channels.manage` + `manage_channels` 역할)을 생성합니다.

```json
{ "name": "deploys", "type": "text", "category_id": null }
```

`201`와 `{ "channel_id": "…" }`를 함께 반환합니다.

**패치 `/api/v1/channels/:id`** - 채널(`channels.manage`)의 이름을 변경합니다.

```json
{ "name": "deploys-2" }
```

`{ "success": true }`를 반환합니다.

**`/api/v1/channels/:id` 삭제** - 채널(`channels.manage`)을 삭제합니다.

`{ "success": true }`를 반환합니다.

### 회원들

**`/api/v1/servers/:id/members`를 얻으세요** - 회원 목록(`members.read`).

`{ "members": [ … ] }`를 반환합니다.

### 남은 것

**POST `/api/v1/servers/:id/leave`** - 봇을 서버에서 제거합니다.

`{ "success": true }`를 반환합니다.

### 초대

**POST `/api/v1/bots/:botId/invites`** - 봇이 서버에 가입할 수 있는 초대장을 생성합니다.

```json
{ "server_id": "…", "scopes": ["messages.read", "messages.write"] }
```

서버 소유자에게 보낼 초대장을(`invite_url` 포함) 반환합니다. 소유자만 승인할 수 있습니다. 초대장은 7일 후에 만료됩니다.

### 아이디(시동 시 사용)

**`/api/bot/me`를 얻으세요** - 클라이언트가 `ready`를 발사하는 데 사용하는 봇 계정을 반환합니다. 버전화된 `v1` 서피스의 일부가 아닙니다.

## 오류

| 상태 | 의미                                                        | `error` 필드 예시                              |
| ------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `401` | 누락/유효하지 않음/취소된 토큰.                                 | `"Invalid bot token"`                               |
| `403` | 스코프 또는 역할 권한이 누락되었습니다.                              | `"This bot does not have messages.write in that server"` |
| `404` | 채널/서버가 찾을 수 없거나 봇에 표시되지 않음.            | `"Channel not found"`                               |
| `429` | 속도 제한.                                                  | `Retry-After` 헤더가 포함되어 있습니다.                    |
| `503` | 백업 스토어 이용 불가(게이트웨이 펌핑).                   | `"Event delivery unavailable."`                     |
| `5xx` | 서버 오류. 백오프 후 다시 시도하세요.                              | `"Internal server error"`                           |

## 제한

- 계정당 **최대 5개의 봇**; 봇의 토큰은 취소 시 즉시 종료됩니다.
- **4,000자**까지 메시지; `@everyone`는 `mention_everyone`가 필요합니다.
  역할 권한.
- 웹훅과 동일한 필드 제한을 가진 **메시지당 최대 **10개의 포함 콘텐츠**. 보다
  [임베드](../developers/embeds.md).
- 속도 제한은 봇 토큰당 적용됩니다. `429`를 입력하면 `Retry-After`를 존중합니다.

## 자신의 클라이언트를 작성하기

1. `GET /api/bot/me`와 `Authorization: Bot <token>`를 사용하여 신원을 확인합니다.
2. `GET /api/v1/gateway?timeout=20`에서 루프를 돌리고, `type`로 이벤트를 처리합니다.
3. 위의 엔드포인트를 동일한 인증 헤더와 함께 사용하세요; `401` → "잘못된 토큰"으로 매핑하세요,
   `403` → "권한 없음", `429` → "`Retry-After` 이후에 속도를 늦추고 다시 시도하세요".

## Webhooks는 다른 표면입니다

봇 API는 `Authorization: Bot <token>`와 인증하고 게이트웨이를 통해 이벤트를 읽을 수 있습니다. [웹훅](../developers/webhooks.md)은 일방향 비밀 URL입니다: 봇 계정이 없음, 인증 헤더 없음, 메시지 읽기 기능 없음. 알림을 위해 웹훅을 사용하고 채팅에 반응해야 할 때는 봇을 사용하세요.

공식 클라이언트는 `@disband/bot`(JavaScript)와 `disband-bot`(Python)입니다. [JavaScript](clients/javascript.md) 및 [Python](clients/python.md) 페이지를 참조하세요.
