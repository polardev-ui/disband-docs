# 봇 템플릿

일반 봇을 위한 적응 가능한 시작점들. 각 항목은 파일로 붙여넣어서 JavaScript 또는 Python 클라이언트와 함께 실행할 수 있는 작고 독립적인 스크립트입니다.

## 환영자

누군가가 공간에 가입할 때마다 환영 메시지를 게시합니다. `messages.write` 및 `members.read`가 필요합니다.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const WELCOME_CHANNEL = process.env.WELCOME_CHANNEL_ID;

client.on("memberJoin", async (member) => {
  await client.channels.send(WELCOME_CHANNEL, `Welcome to the space, ${member.display_name ?? member.username}!`);
});

await client.connect();
```

> 게이트웨이는 오늘 `messageCreate`, `messageUpdate` 및 `messageDelete`를 방출합니다;
> 회원 이벤트는 당신의 봇의 스코프가 허용하는 것과 동일한 이벤트 스트림을 통해 도착합니다.

## 티켓 관리자

지원 요청당 개인 채널을 생성하고 직원 역할을 ping합니다. `channels.manage`(`manage_channels` 역할 포함) 및 `messages.write`가 필요합니다.

```javascript
import { Client } from "@disband/bot";

const client = new Client({ token: process.env.DISBAND_BOT_TOKEN });
const SUPPORT_CATEGORY = process.env.SUPPORT_CATEGORY_ID;
const STAFF_ROLE = process.env.STAFF_ROLE_ID;

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (!message.content.startsWith("!ticket")) return;

  const subject = message.content.slice("!ticket".length).trim() || "support";
  const channel = await client.channels.create({
    name: `ticket-${subject}`.slice(0, 32),
    parent_id: SUPPORT_CATEGORY,
  });
  await client.channels.send(channel.id, `<@&${STAFF_ROLE}> new ticket: ${subject}`);
  await message.reply(`Created ${channel.name}.`);
});

await client.connect();
```

## 자동 응답자

소수의 FAQ에 대한 답변을 제공합니다. `messages.read` 및 `messages.write`가 필요합니다.

```python
from disband_bot import Client

client = Client(token=DISBAND_BOT_TOKEN)
FAQS = {
    "hours": "We're open Monday to Friday, 9 to 5.",
    "invite": "Ask an admin for an invite link.",
}

@client.on("messageCreate")
def handle(message):
    if message.author_is_bot:
        return
    key = message.content.strip().lower().lstrip("!")
    if key in FAQS:
        message.reply(FAQS[key])

client.run()
```

## 감시 도움말

금지된 단어가 포함된 메시지를 삭제하고 로그를 남깁니다. `messages.read`, `messages.write` 및 `manage_messages` 역할을 필요로 합니다.

```javascript
const BANNED = ["spamword"];

client.on("messageCreate", async (message) => {
  if (message.author?.is_bot) return;
  if (BANNED.some((w) => message.content.toLowerCase().includes(w))) {
    await client.messages.delete(message.channel_id, message.id);
    await client.channels.send(message.channel_id, "A message was removed by the bot.");
  }
});
```

## 팁

- 가장 작은 스코프 세트로 시작하고 하나의 봇 대신 더 많은 봇을 추가하세요.
  모든 것.
- 토큰을 환경 변수에 저장하고, 소스에서 절대 저장하지 마십시오.
- `AuthError`(401)를 영원히 다시 시도하는 대신 중지하여 처리하십시오.
- 이 도움말이 사용하는 모든 엔드포인트에 대한 [API 참조](api-reference.md)를 참조하십시오.
