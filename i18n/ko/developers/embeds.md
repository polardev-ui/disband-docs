# 임베드

인베드는 메시지에 부착된 구조화된 카드입니다: 컬러 스트라이프, 제목, 풍부한 텍스트, 필드, 이미지 및 하단 여백입니다. Disband는 Discord의 인베드 모양과 제한을 사용하므로 Discord 웹훅 또는 봇을 위해 구축된 인베드는 일반적으로 변경 없이 작동합니다.

인포그래픽은 다음과 같이 보낼 수 있습니다.

- [웹훅](webhooks.md), 실행 본문에 `embeds`이 있음;
- [API 참조](../bots/api-reference.md), 메시지 본문에 `embeds`이 포함되어 있습니다.

클라이언트 측 메시지는 직접 포함물을 설정할 수 없습니다. 이는 회원이 웹훅이나 포함물 카드를 위조하는 것을 방지합니다.

## 완전한 예

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

`5793266`는 `0x5865F2`, Disband의 브랜드 블루입니다.

## 인제어 객체

| 필드         | 유형   | 참고                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | 문자열 | 최대 256자. `url`가 설정되면 링크로 렌더링됩니다. |
| `description` | 문자열 | 최대 4,096자. Markdown를 지원합니다.                  |
| `url`         | 문자열 | 제목이 클릭할 수 있도록 합니다. 절대 `http` 또는 `https` URL.  |
| `color`       | 숫자 | `0xRRGGBB`을 정수로 나타내세요. `"#5865F2"` 문자열도 작동합니다. |
| `timestamp` | 문자열 | ISO 8601 날짜 및 시간. 하단에 표시됩니다.                |
| `footer`      | 객체 | `{ "text": "…", "icon_url": "…" }`. 최대 2,048자를 입력하세요.       |
| `author`      | 객체 | `{ "name": "…", "url": "…", "icon_url": "…" }`. 최대 256개의 이름을 지정할 수 있습니다. |
| `fields`      | 배열  | 최대 25개의 필드 객체. 아래를 참조하세요.                          |
| `image`       | 객체 | `{ "url": "…" }`. 설명 아래에 표시됩니다.          |
| `thumbnail` | 객체 | `{ "url": "…" }`. 오른쪽에 표시됩니다.                   |
| `video`       | 객체 | 호환성을 위해 승인됨; 아직 렌더링되지 않았습니다.              |
| `provider` | 객체 | 호환성을 위해 승인됨; 아직 렌더링되지 않았습니다. |

모든 URL 필드는 절대적인 `http` 또는 `https` URLs여야 합니다. 사용자 이름이나 암호를 포함하는 URLs은 버려집니다. 보안되지 않은 이미지 URLs은 클라이언트 및 서버 모두에서 삭제합니다.

### 필드

```json
{
  "name": "Uptime",
  "value": "99.98% over 90 days",
  "inline": true
}
```

| 재산 | 유형 | 참고 사항                                            |
| -------- | ------- | ------------------------------------------------ |
| `name` | 문자열 | 필수. 최대 256자.                  |
| `value` | 문자열 | 필수. 최대 1,024자. Markdown이 작동합니다. |
| `inline` | 논리형 | `true`는 공간이 허용하는 경우 필드를 나란히 배치합니다. |

`name` 또는 `value`이 누락되거나 비어 있는 필드는 하드 오류입니다. 빈 데이터가 있을 수 있으므로 필드를 생략하거나 대시를 대체하십시오.

## Markdown

설명 및 필드 값은 Disband의 Markdown을 지원합니다: 초록색, 기울임꼴, 밑줄, 인라인 코드, 코드 블록, 링크 및 사용자 정의 이모티콘. 제목, 저자 이름 및 하단 텍스트는 일반 텍스트입니다.

인포에 포함된 텍스트는 표시되지만 핑은 생성되지 않습니다. 실제 언급 알림을 원하시면 `content`를 사용하세요.

## 제한

| 제한                              | 값 |
| ---------------------------------- | ----- |
| 메시지에 포함된 포함물 수                 | 10    |
| 제목                              | 256   |
| 설명                        | 4,096 |
| 각 인포그래픽에 대한 필드 수                   | 25    |
| 필드 이름                         | 256   |
| 필드 값                        | 1,024 |
| 하단 텍스트                        | 2,048 |
| 저자 이름                        | 256   |
| 모든 포함 콘텐츠의 총 문자 수 | 6,000 |

총액에는 제목, 설명, 하단 텍스트, 저자 이름, 필드 이름 및 필드 값이 포함됩니다. URLs 및 이미지 메타데이터는 포함되지 않습니다.

## 입력이 어떻게 정규화되는가

API는 데이터베이스에 도달하기 전에 모든 임베드를 검증합니다:

- 알 수 없는 속성은 삭제됩니다.
- 텍스트가 잘려집니다. 너무 길어진 텍스트는 거부하는 대신 제한치에 맞게 자릅니다.
- 유효하지 않은 색상은 삭제됩니다.
- 유효하지 않은 URLs은 삭제됩니다. 유효한 URL 필드는 유지됩니다.
- 유효하지 않은 타임 스탬프는 삭제됩니다.
- 빈 인베드는 `Embed is empty`로 거부됩니다.
- 이름이나 값이 없는 필드는 거부됩니다.
- 10개 이상의 포함 콘텐츠 또는 총 6,000개 이상의 문자가 거부됩니다.

오류 이름에 있는 사각괄호는 정확한 항목을 식별합니다. 예를 들어:

```text
embeds.0.fields.2: name and value are required
```

## 임베드 보내기

### 웹훅으로부터

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

### 봇으로부터

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

만약에 임베드만 보내면, `content`를 생략할 수 있습니다. 콘텐츠나 임베드 없이 있는 메시지는 거부됩니다.

## 관계가 있는

- [웹훅](webhooks.md) — 웹훅 메시지를 실행하고 관리합니다.
- [API 참조](../bots/api-reference.md) - 봇 메시지 엔드포인트.
