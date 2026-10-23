# Disband 문서

Disband에서 만들 수 있는 모든 것.

## 봇

Disband 봇은 **셀프 호스팅 통합**입니다: 당신은 코드를 실행하고, Disband는 메시지를 중계합니다. Disband는 당신의 봇을 호스팅하거나 실행하지 않습니다.

- **[시작하기](bots/getting-started.md)** - 봇을 만들고, 그 봇의 토큰을 가져오세요,
  그리고 서버로 초대하세요. 약 2분 걸립니다.
- **[봇](bots/index.md)** - 스코프, 초대, 제한 및 보안.
- **[나만의 봇 호스팅](bots/hosting-your-own-bot.md)** - 클라이언트를 어디에서 실행하고 어떻게 유지하는지.
- **[JavaScript](bots/clients/javascript.md)** — `@disband/bot`.
  의존성 없음; Node.js 18+, Deno, Bun 및 브라우저에서 작동합니다.
- **[Python](bots/clients/python.md)** — `disband-bot`.
  표준 라이브러리만 사용합니다; Python 3.9 이상에서 작동합니다.
- **[API 참조](bots/api-reference.md)** - 두 클라이언트가 통신하는 HTTP API입니다.

## 개발자

봇을 구축하고 HTTP API를 사용하여 Disband를 게임과 앱에 통합하세요.

- **[개발자](developers/index.md)** - 개요, 여기서 시작하고 보안
  게임/앱 통합을 위한 참고 사항.
- **[봇](bots/index.md)** - 스코프, 초대, 제한 및 보안.
- **[API 참조](bots/api-reference.md)** - 두 클라이언트가 통신하는 HTTP API입니다.
- **[템플릿](bots/templates.md)** - 바로 적용할 수 있는 환영 봇, 티켓 관리자 등을 제공합니다.
- **[웹훅](developers/webhooks.md)** - CI, 모니터링 또는 게임 서버에서 비밀 URL을 통해 게시할 수 있습니다. 봇이 필요하지 않습니다.
- **[임베드](developers/embeds.md)** - 릴리즈, 알림, 상태 업데이트를 위한 Discord 스타일 카드.
- **[상태 시스템](developers/status.md)** - 공개 상태 페이지가 서비스를 확인하고 가동 시간을 기록하며 인시던트를 처리하는 방법.

## 테마

SUPER 회원은 사용자 정의 CSS, 포함된 스킨, 업로드한 아이콘으로 앱 전체의 스타일을 바꿀 수 있습니다.

- **[테마](themes/index.md)** - 안정적인 API인 CSS 변수, 안전하게 지정할 수 있는 선택자, 스타터 템플릿.

## 클라이언트를 다운로드하세요

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** - JavaScript 클라이언트
  (`npm install ./disband-bot-0.1.0.tgz`).
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** - Python 클라이언트
  (`pip install ./disband-bot-python-0.1.0.tar.gz`).
