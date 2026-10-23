# Disband ドキュメント

Disbandを構築するために必要なすべて。

## ボット

Disbandボットは**自己ホストされた統合**です。あなたはコードを実行し、Disbandはそのコードとの間でメッセージを中継します。Disbandは決してあなたのボットをホストしたり実行したりしません。

- **[はじめに](bots/getting-started.md)** — ボットを作成してトークンを取得し、サーバーに招待します。約2分で完了します。
- **[ボット](bots/index.md)** — スコープ、招待、制限、セキュリティ。
- **[独自のボットをホストする](bots/hosting-your-own-bot.md)** — クライアントをどこで実行し、どのように動かし続けるか。
- **[JavaScript](bots/clients/javascript.md)** — `@disband/bot`。
  依存関係ゼロ。Node.js 18+、Deno、Bun、およびブラウザで動作します。
- **[Python](bots/clients/python.md)** — `disband-bot`。
  標準ライブラリのみ。Python 3.9+で動作します。
- **[APIリファレンス](bots/api-reference.md)** — 両方のクライアントが通信する HTTP API です。

## 開発者

ボットを構築し、HTTP APIを使用して、Disbandをゲームやアプリに統合します。

- **[開発者](developers/index.md)** - 概要、ここから開始、セキュリティ
  ゲーム/アプリ統合のためのメモ。
- **[ボット](bots/index.md)** — スコープ、招待、制限、セキュリティ。
- **[APIリファレンス](bots/api-reference.md)** — 両方のクライアントが通信する HTTP API です。
- **[テンプレート](bots/templates.md)** — すぐに使えるウェルカムボット、チケットマネージャーなど。
- **[Webhook](developers/webhooks.md)** — CI、監視、またはゲームサーバーから秘密の URL 経由で投稿できます。ボットは不要です。
- **[埋め込み](developers/embeds.md)** — リリース、アラート、ステータス更新向けの Discord スタイルのカード。
- **[ステータスシステム](developers/status.md)** — 公開ステータスページがサービスを確認し、稼働時間を記録し、インシデントを処理する方法。

## テーマ

SUPERのメンバーは、カスタムCSS、同梱のスキン、アップロードされたアイコンを使用して、アプリ全体をリスタイリングできます。

- **[テーマ](themes/index.md)** — 安定した API である CSS 変数、
  安全に指定できるセレクタと、スターターテンプレート。

## クライアントをダウンロードする

- **[@disband/bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-0.1.0.tgz)** — JavaScript クライアント
  (`npm install ./disband-bot-0.1.0.tgz`)。
- **[disband-bot](https://raw.githubusercontent.com/polardev-ui/disband-docs/main/zips/disband-bot-python-0.1.0.tar.gz)** — Python クライアント
  (`pip install ./disband-bot-python-0.1.0.tar.gz`)。
