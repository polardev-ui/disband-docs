# 시작하기: 첫 번째 봇

이 페이지는 봇을 생성하고, 토큰을 얻고, 서버에 초대하는 과정을 안내합니다. 약 2분이 소요됩니다.

## 1. 봇을 생성하다

Disband에서 **설정 → 봇**을 열고 **새 봇**을 클릭하세요.

- 이름을 지어주세요. 이름은 회원 목록과 메시지에 나타나는 이름입니다.
- 필요한 **스코프**를 선택하세요. 작게 시작하세요 - 언제든지 다른 봇을 만들 수 있습니다.
  더 많은 스코프를 가지고. 전체 목록은 [봇](index.md)에 있습니다.
- **생성**을 클릭하세요.

Disband은 **토큰**을 반환하며, 한 번만 표시됩니다. 지금 안전한 곳에 복사하세요: 다시는 표시되지 않으며 나중에 복구할 수 없습니다. 분실하면 봇을 취소하고 새 봇을 생성하세요.

토큰은 당신의 코드가 인증하는 데 사용하는 것입니다.

```
Authorization: Bot <token>
```

## 2. 봇을 서버에 초대하세요

**설정 → 봇**에서 방금 만든 봇을 열십시오.

1. **초대장 생성**을 클릭합니다.
2. 대상 서버와 부여할 스코프를 선택합니다.
3. 결과 링크는 해당 서버의 **소유자**에게 보내세요.

봇 초대장을 승인할 수 있는 사람은 소유자뿐입니다. 초대장은 7일 후에 만료됩니다.

## 3. 소유자가 승인합니다

소유자는 링크를 열고 **승인**을 클릭합니다. 봇은 승인된 스코프만 제한된 서버의 멤버가 됩니다. (승인된 스코프는 봇 계정의 스코프와 소유자가 부여한 스코프의 교차점입니다. 봇이 생성된 것보다 더 많은 스코프를 승인할 수는 없습니다.)

## 4. 고객과 연결하기

토큰을 환경 변수에 저장하고 클라이언트 중 하나를 실행합니다.

```javascript
// JavaScript — install with: npm install /path/to/packages/bot
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (message.content !== "!ping") return;
  await message.reply("pong");
});

await client.connect();
```

```python
# Python — install with: pip install ./packages/disband-bot-python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    if message.content == "!ping":
        message.reply("pong")

client.run()
```

클라이언트는 게이트웨이에 연결하고, `ready`를 발사한 다음 메시지 이벤트를 스트리밍합니다. 전체 API는 [JavaScript](clients/javascript.md) 및 [Python](clients/python.md)를 참조하십시오.

## 다음은 뭐야

- 만약 봇이 영구적으로 계속 실행되어야 한다면, 참조하세요
  **[나만의 봇 호스팅](hosting-your-own-bot.md)**.
- API와 직접 대화하고 싶다면 (curl, 다른 언어, 웹훅),
  **[API 참조](api-reference.md)**를 참조하세요.
