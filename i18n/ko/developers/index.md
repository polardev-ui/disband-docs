# 개발자

Disband 위에 구축하세요: 외부에서 공간과 대화하는 봇, 통합 및 도구들. 여기 있는 모든 것은 자체 호스팅됩니다. Disband는 절대 귀하의 코드를 실행하지 않습니다.

## 당신이 만들 수 있는 것

- **봇** - 메시지를 읽고 쓰고, 채널을 관리하는 자체 호스팅 계정,
  그리고 장기적인 여론 조사 게이트웨이를 통해 이벤트에 반응합니다. [봇](../bots/index.md)를 참조하세요.
- **Webhooks** - 비밀 URL를 통해 게시된 일방 통지, 봇 없음
  코드 또는 토큰. [웹훅](webhooks.md)을 참조하세요.
- **내장된 카드** - 구조화된 릴리스 노트, 알림 및 상태 업데이트.
  [임베드](embeds.md)를 참조하세요.
- **사용자 정의 클라이언트** - 언어가 필요한 경우 HTTP API에 직접 문의하세요.
  배송된 클라이언트는 보장하지 않습니다. [API 참조](../bots/api-reference.md)는
  계약.
- **상태 통합** - RSS를 통해 Disband 인시던트를 따르거나 어떻게 하는지 읽어보세요.
  [상태 시스템](status.md)은 점검을 기록하고 인시던트를 열습니다.

## 여기서 시작하세요

1. **[시작하기](../bots/getting-started.md)** - 봇을 만들고, 그 봇을 가져오세요.
   토큰, 그것을 공간에 초대하세요. 약 2분 정도 소요됩니다.
2. **[나만의 봇 호스팅](../bots/hosting-your-own-bot.md)** - 실행할 위치
   클라이언트를 어디에서 실행하고 어떻게 유지하는지.
3. **[JavaScript](../bots/clients/javascript.md)** 또는
   **[Python](../bots/clients/python.md)**.
4. 정확한 엔드포인트를 위한 **[API 참조](../bots/api-reference.md)**.
5. **[웹훅](webhooks.md)** 또는 **[임베드](embeds.md)**만 필요한 경우
   일방 통지.
6. **공개 상태 페이지와 RSS 피드에 대한 [상태 시스템](status.md)**.

## Disband를 게임이나 앱에 구현하기

Disband는 봇 토큰으로 인증된 일반 HTTP API를 노출합니다. 연결할 수 있는 기본 SDK나 RPC 런타임이 없습니다. HTTPS 요청을 수행할 수 있는 모든 스택이 작동합니다. 일반적인 통합은 다음과 같습니다.

1. **설정 → 봇**에서 봇을 생성하고 `messages.write`를 부여합니다 (그리고
   `channels.manage` 채널을 생성해야 하는 경우).
2. 게시할 공간에 봇을 초대하세요.
3. 토큰을 게임이나 앱의 비밀 저장소에 저장하세요 - 클라이언트 측에는 절대 저장하지 마세요.
   플레이어에게 배송되는 코드.
4. 백엔드에서 스코프 지정된 엔드포인트를 호출합니다.

   ```bash
   curl -X POST https://www.disband.dev/api/v1/channels/CHANNEL_ID/messages \
     -H "Authorization: Bot $DISBAND_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Server restarted — 12 players online."}'
   ```

5. 게임 내에서 채팅에 반응하려면 게이트웨이를 길게 대기하고 발송하세요.
   `messageCreate` 이벤트는 당신의 게임 로직에 적용됩니다.

### 보안 메모

- 봇 토큰은 휴지 상태에서 해시되며 한 번만 표시됩니다. 하나 있으면 즉시 취소하세요.
  누출.
- 토큰을 당신이 통제하는 서버에 보관하세요. 게임 클라이언트에서 토큰을 배송하면
  누군가가 당신의 봇을 사칭하는 사람.
- 스코프를 그들이 필요로 하는 최소한의 권한으로 제한하세요. 게시만 하는 봇은 필요하지 않습니다.
  `members.read` 또는 `channels.manage`.

## 개발자를 위한 테마들

브랜드 클라이언트나 스킨을 구축하는 경우, [테마](../themes/index.md)의 CSS 변수는 안정적인 스타일링 API입니다.

## 질문들

- 버그 보고서: 문제를 열거나 팀에 이메일을 보내세요.
- 계정별 문제의 경우 앱 내 지원을 사용합니다.
