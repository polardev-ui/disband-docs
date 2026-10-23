# 웹훅

웹훅은 비밀 URL를 통해 하나의 채널에 메시지를 게시합니다. 봇 코드, 게이트웨이 루프, `Authorization` 헤더가 필요하지 않습니다. HTTP 요청을 만들 수 있다면 Disband에 게시할 수 있습니다.

Webhooks는 봇과 별개입니다. CI, 모니터링, 게임 서버, 양식 또는 URL를 호출할 수 있는 기타 모든 곳에서 일방향 알림을 위해 웹훅을 사용하십시오. 이벤트를 읽거나 메시지를 처리해야 할 때 [봇](../bots/index.md)을 사용하십시오.

## 웹훅 생성하기

공간에서 **Webhooks** 관리 권한이 필요합니다.

1. **스페이스 설정 → 통합 → Webhooks**를 엽니다.
2. 채널을 선택하고 **새 웹훅**을 선택합니다.
3. 이름을 지어주고, 마음에 드시면 아바타를 추가하세요.
4. 웹훅 URL을 복사합니다.

URL는 다음과 같이 보입니다:

```text
https://disband.dev/webhook/12345678/01234567890123456789012345
```

| 부분 | 의미                                                        |
| ----------- | -------------------------------------------------------------- |
| 스페이스 키 | 스페이스 구분자를 식별하는 8자리 숫자. 비밀이 아니다.                |
| 토큰 | 이십육자리 숫자. 이것이 비밀이다. 암호처럼 취급하라. |

같은 엔드포인트는 또한 `https://disband.dev/api/webhooks/<space key>/<token>`에서 제공됩니다.

그 화면에서 웹휠을 이름을 변경하거나, 토큰을 재설정하거나, 삭제할 수 있습니다. 토큰을 재설정하면 기존 URL가 즉시 무효화됩니다. 웹휠을 삭제하면 게시가 중지되지만, 채널에 이미 보낸 메시지는 남습니다.

## 웹훅 실행하기

`POST`를 URL 웹훅으로 보내고 JSON 바디를 보내세요.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345' \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "Deploy finished — **v2.4.1** is live.",
    "username": "Deploy bot",
    "avatar_url": "https://example.com/deploy.png"
  }'
```

성공적인 요청은 `204 No Content`을 반환합니다. 대신 `?wait=true`을 추가하여 생성된 메시지 객체를 받으십시오.

```bash
curl -X POST 'https://disband.dev/webhook/12345678/01234567890123456789012345?wait=true' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Hello from the other side." }'
```

### 본인 필드

| 필드             | 유형    | 참고사항                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `content`         | 문자열 | 최대 2,000자까지. 최소 하나의 인포그래픽이 있는 경우 생략될 수 있습니다. |
| `username`        | 문자열 | 이 메시지의 웹훅 이름을 대체합니다. 최대 80자까지 가능합니다.         |
| `avatar_url`      | 문자열 | 이 메시지의 아바타를 대체합니다. 절대적인 `http` 또는 `https` URL.    |
| `embeds`          | 배열 | 최대 10개 [임베드](embeds.md).                                             |
| `embed`           | 객체 | 레거시 단수형. `embeds: [embed]`로 처리됨.                      |
| `allowed_mentions`| 객체 | 핑을 제어합니다. 아래를 참조하십시오.                                                |
| `tts`             | 논리형 | 호환성을 위해 승인됨; 현재 무시됨.                            |
| `flags`           | 번호 | 호환성을 위해 승인됨; 현재 무시됨.                            |

`username`는 `disband` 또는 `clyde`를 어떤 케이스로도 포함할 수 없습니다. 이는 플랫폼 직원을 사칭하는 웹훅을 방지합니다.

파일 첨부파일은 아직 지원되지 않습니다. 다중부 요청은 파싱할 수 있지만 파일은 저장되지 않습니다. 파일을 업로드해야 하는 경우 봇을 사용하세요.

### 제어 언급

기본적으로 웹훅은 사용자 언급과 `@everyone` / `@here`를 모두 파싱합니다. 이는 Discord와 동일합니다.

아무에게도 핑을 보내기 위해서:

```json
{ "content": "Build 184 finished.", "allowed_mentions": { "parse": [] } }
```

사용자가 언급할 수 있도록 허용하지만 모든 사람이 언급할 수는 없도록 하려면:

```json
{
  "content": "Thanks @polar.",
  "allowed_mentions": { "parse": ["users"] }
}
```

데이터베이스는 `@everyone`를 억제할 때 여전히 저장하지만 알림은 전송되지 않습니다. 필드가 완전히 누락되면 모든 것이 파싱됩니다.

## 메시지 객체

`?wait=true`로 응답은 Discord 모양의 메시지가 됩니다. Disband는 `id`에서 숫자 메시지 ID를 사용합니다.

```json
{
  "id": "4821",
  "type": 0,
  "content": "Deploy finished.",
  "channel_id": "…",
  "guild_id": "…",
  "author": {
    "id": "…",
    "username": "Deploy bot",
    "avatar": "https://example.com/deploy.png",
    "discriminator": "0000",
    "bot": true
  },
  "attachments": [],
  "embeds": [],
  "mentions": [],
  "mention_roles": [],
  "mention_everyone": false,
  "pinned": false,
  "tts": false,
  "timestamp": "2026-10-19T20:15:00.000Z",
  "edited_timestamp": null,
  "flags": 0,
  "components": [],
  "webhook_id": "…"
}
```

## 메시지 관리

웹훅은 게시한 메시지를 가져오거나, 편집하거나, 삭제할 수 있습니다. 실행 응답에서 숫자 메시지 ID를 사용합니다.

| 방법 | 엔드포인트                                      | 결과                         |
| -------- | --------------------------------------------- | ------------------------------ |
| `GET`    | `/webhook/<key>/<token>/messages/<id>`        | 메시지를 가져오세요.             |
| `PATCH` | `/webhook/<key>/<token>/messages/<id>` | `content` 및/또는 `embeds`을 편집합니다. |
| `DELETE` | `/webhook/<key>/<token>/messages/<id>`        | 메시지를 삭제합니다. `204`을 반환합니다. |

예제 편집:

```bash
curl -X PATCH 'https://disband.dev/webhook/12345678/01234567890123456789012345/messages/4821' \
  -H 'Content-Type: application/json' \
  -d '{ "content": "Deploy finished — rolled back." }'
```

그 웹훅이 작성한 메시지만 변경할 수 있습니다. 다른 웹훅은 `404 Unknown Message`를 받습니다.

## 웹훅 자체를 관리하다

| 방법 | 엔드포인트                            | 결과                                      |
| -------- | ----------------------------------- | ------------------------------------------- |
| `GET` | `/webhook/<key>/<token>` | Webhook 객체(이름, 아바타, 채널, URL). |
| `PATCH` | `/webhook/<key>/<token>` | `{ "name": "New name" }`로 이름을 바꾸세요. |
| `DELETE` | `/webhook/<key>/<token>`            | 삭제합니다. `204`를 반환합니다.                   |

URL를 통해 삭제하는 것은 영구적이며 통합 화면에서 삭제하는 것과 동일합니다.

## 속도 제한

각 웹훅은 **2초당 5개의 요청**으로 제한됩니다. 제한은 토큰에 의해 결정되므로 소음 많은 웹훅이 다른 웹훅을 늦추지 않습니다.

제한된 요청은 `429`을 반환합니다:

```json
{
  "message": "You are being rate limited.",
  "retry_after": 1.34,
  "global": false
}
```

응답에는 `Retry-After`(전체 초)와 일반적인 `X-RateLimit-*` 헤더가 포함되어 있습니다. 지연 시간을 기다린 다음 다시 시도하십시오.

## 오류

오류는 Discord의 모양을 사용합니다:

```json
{ "message": "Unknown Webhook", "code": 10015 }
```

| 상태 | 코드 | 의미                                                    |
| ------ | ------- | ---------------------------------------------------------- |
| `400` | `50006` | 빈 메시지: 콘텐츠와 포함물이 없습니다.                   |
| `400` | `50035` | 유효하지 않은 본문, 잘못된 인포그래픽 또는 2,000자 이상의 콘텐츠. |
| `404` | `10015` | 알 수 없는 웹핫스팟: 잘못된 스페이스 키, 잘못된 토큰 또는 삭제됨. |
| `404` | `10008` | 알 수 없는 메시지.                                           |
| `429` | —       | 평가 제한. `Retry-After`를 존중하십시오.                        |
| `500` | —       | 서버 오류입니다. 백오프 후 다시 시도하십시오.                          |

`404 Unknown Webhook`는 의도적으로 스페이스 키인지 토큰인지 잘못되었는지 말하지 않는다.

## 안전

- URL를 가진 사람은 누구나 게시할 수 있습니다. 공개 저장소에 저장하거나 넣지 마십시오.
  클라이언트 측 코드에 있습니다.
- URL를 API 키를 사용하는 것과 동일한 비밀 저장소에 저장하십시오.
- 토큰이 유출되면 즉시 재설정하십시오. 오래된 URL는 즉시 작동을 중지합니다.
- 웹훅은 구성된 채널에만 쓰기를 합니다. 메시지 읽기는 할 수 없습니다,
  멤버 목록을 나열하거나 공간 설정을 변경하세요.

## 관계가 있는

- [임베드](embeds.md) - 임베드 객체와 그 제한 사항.
- [봇](../bots/index.md) - 양방향 통합 및 이벤트 전달.
- [API 참조](../bots/api-reference.md) - 봇 HTTP API, 포함
  통합 지원.
