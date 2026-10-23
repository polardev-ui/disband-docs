# テーマ

Disband **SUPER**のメンバーは、アプリをリスタイリングできます。同梱のスキンから1つを選択するか、独自のCSSを書き込み、独自のアイコンをアップロードします。テーマはアカウントに保存されるため、他の場所でサインインしてもすでにインストールされています。

テーマは**ウェブとデスクトップ**に適用されます。iOSとAndroidはネイティブに構築されており、テーマが適用するスタイルシートがないため、テーマは同期されますが、そこに描かれません。

## 出荷されたスキン

9つは組み込まれており、色だけでなく、角、フォント、コントロールが描かれる方法などにも変化します。

- **Minecraft** — ピクセルタイプ、ハードベゼル、丸みのある角はありません。
- **コールオブデューティ** — ほこりっぽいカーキ色、ステンシルキャップ、すべてにフィルムグレイン。
- **2000年代** — タコマ、ベゼル付きコントロール、Windows XPブルー。
- **Frutiger Aero** — 光沢のあるガラス、青から緑へ、あらゆる隅に光が反射します。
- **端末** — 黒地に緑色の蛍光物質、単行スペース、スキャンライン付き。
- **Vaporwave** — ホットピンクとシアンをパープルの上に重ね、すべてのボタンにクロムが施されています。
- **紙** — 温かいオフホワイトとセリフ体；印刷物のように読めます。
- **ネオン** — ほぼ黒で、マゼンタとシアンがすべてのエッジから出血しています。
- **ブルートラリスト** — 白地に黒、2ピクセルの境界、ブロック状の影。

**設定→テーマ**で1つを選択します。スキンと独自のカスタムCSSが連携します。スキンは最初に適用されるため、CSSはそれを交換する代わりに調整できます。

## カラー変数

これらは安定したAPIです。`:root`に設定すると、テーマを書き込んだ後に追加された画面を含む、アプリ内のすべてのサーフェスもそれに従います。

| 変数                | 影響する                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | チャットキャンバス - アプリ内の最大のサーフェス。              |
| `--bg-secondary` | それに隣接するパネル：チャンネルリスト、メンバーリスト、カード。 |
| `--bg-tertiary`         | サーバーレールを含む最も外側のクローム。               |
| `--bg-accent`           | インセットサーフェス：コンポーザー、コードブロック、入力。             |
| `--interactive-hover` | 行とボタンのオーバーレイ。                                          |
| `--interactive-selected`| 現在お使いの行。                                  |
| `--brand`               | プライマリボタン、リンク、フォーカスリング、独自のアクセント。         |
| `--brand-hover`         | 同じ、ホバーされた。                                             |
| `--text-normal`         | ボディテキスト。                                                     |
| `--text-muted`          | タイムスタンプ、二次ラベル、プレースホルダー。                    |
| `--text-link`           | メッセージ内のリンク。                                         |
| `--status-online`       | オンラインドット、成功状態。                                    |
| `--status-idle`         | アイドルドット、警告。                                            |
| `--status-dnd`          | 邪魔しない点、エラー、破壊的な行動。            |
| `--status-offline`      | オフラインドット。                                                   |
| `--divider`             | アプリ内のすべての髪の毛ラインの境界。                              |
| `--super`               | Disband SUPERのアクセント。                                      |

## 形状とタイプ

Disbandは、Tailwindの半径スケールを使用して角を描画し、そのスケールはこれらの変数から読み取ります。 一方を設定すると、製品のそのサイズのすべての角が同時に変更されます。 コンポーネントを見つける必要はありません。

| 変数 | 影響する                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | Tailwindの`rounded-sm`。小さなチップとタグ。 |
| `--skin-radius-md` | `rounded-md` — ほとんどのボタンと入力。 |
| `--skin-radius-lg` | `rounded-lg` — カードとパネル。                    |
| `--skin-radius-xl` | `rounded-xl` — モーダル、コールタイル。                  |
| `--skin-radius-2xl` | `rounded-2xl` — 大型オーバーレイ。                     |
| `--skin-radius-3xl` | `rounded-3xl` — 最大の表面。               |
| `--skin-font`       | 全体のアプリのUIフォント。                  |

アバターとステータスドットは意図的にこのリストには含まれていません。それは、正方形のアバターはメンバーリストを読みにくくするため、円形であるからです。それでも、直接ターゲットにすることで正方形にすることができます。

**ライトテーマを構築している場合**、`color-scheme: light`を`:root`に設定して、スクロールバーとネイティブコントロールがそれに合わせて回転するようにします。また、`--bg-tertiary`にはテキストが含まれていることを覚えておいてください。これはサーバーレールなので、そこにダークな値とダークな`--text-normal`を合わせると、そのラベルは単にコントラストが低いだけでなく、非表示になります。

## セレクタ

Disbandのすべてのコントロールは、実際の`<button>`、`<input>`、または`<textarea>`であるため、要素セレクタはアプリ全体にアクセスし、変更に応じて引き続き機能します。

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

レイアウトクラスはTailwindユーティリティであり、`[class*="bg-brand"]`スタイルのセレクタは機能しますが、それらはサポートされているAPIではありません。ユーティリティクラスは画面が再設計されたときに変更され、それらに基づいて構築されたテーマは、あるリリースで壊れます。上記の変数は壊れません。

## アップロードされたアイコン

**設定→テーマ**で画像をアップロードし、名前を付けます。それは、既製の`url()`を保持する変数になります。

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

名前は小文字、数字、ダッシュで、最大40文字まで使用できます。テーマには最大100個のアイコンを含めることができ、各アップロードは2MBまで制限されています。

## スタートアップテンプレート

これをエディタに貼り付けて、好きなものを変更してください。

```css
/* ---------------------------------------------------------------
   A Disband theme. Everything here is optional — delete what you
   do not want to change.
   --------------------------------------------------------------- */

:root {
  /* Colours. These reach every surface in the app. */
  --bg-primary: #1b1b1f;
  --bg-secondary: #16161a;
  --bg-tertiary: #101013;
  --bg-accent: #131316;
  --interactive-hover: #26262c;
  --interactive-selected: #2f2f37;
  --brand: #7c5cff;
  --brand-hover: #6647e0;
  --text-normal: #ececf0;
  --text-muted: #9a9aa5;
  --divider: #2a2a31;

  /* Shape. One value here squares (or rounds) every matching
     corner in the product at once. */
  --skin-radius-md: 4px;
  --skin-radius-lg: 6px;

  /* Type. Any font already on the system, or one you name below. */
  --skin-font: "Inter", system-ui, sans-serif;
}

/* Buttons are ordinary <button> elements, so this reaches all of
   them — the composer, the toolbar, dialogs, everything. */
button {
  transition: transform 80ms ease;
}

button:active {
  transform: translateY(1px);
}

/* An icon you uploaded, referenced by the name you gave it. */
.my-custom-send::before {
  content: "";
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: var(--icon-send);
  background-size: contain;
}
```

## 禁止されていることは何ですか

あなたのCSSは適用される前にチェックされ、削除されたものは静かにドロップされるのではなく、あなたのためにリストアップされます。

- `@import` — 起動するたびに別のサーバーからスタイルシートを読み込みます。
- `<`と`>` - CSSはそれらには使用されず、スタイルシートを早期に終了できます。
- `expression()`、および`https:`または`data:`画像ではない`url()`値。
- テーマはCSSで100KBまで制限されています。

Webフォントは、`https:`アドレスから`@font-face`でロードしたり、アップロードしたアイコンからロードしたりできます。

## サブスクリプションが終了した場合

テーマはSUPERの機能であるため、支払いが失敗した場合、テーマが適用されなくなり、Disbandは静かに形を変えるのではなく、なぜかを示す通知とともに通常の外観に戻ります。

**何も削除されません。** あなたのスキン、CSS、アイコンはアカウントに残ります。再度購読すると、最初と同じように戻ってきます。
