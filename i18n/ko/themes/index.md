# 테마

Disband **SUPER** 회원들은 앱을 다시 스타일링할 수 있습니다: 배송된 스킨 중 하나를 선택하거나 자신만의 CSS를 작성하고 자신만의 아이콘을 업로드하세요. 테마는 계정에 저장되므로 다른 곳에서 로그인할 때 이미 활성화되어 있습니다.

테마는 **웹 및 데스크탑**에 적용됩니다. iOS 및 Android는 기본적으로 구축되었으며 테마에 적용할 스타일시트가 없으므로 테마가 동기화되지만 거기에 그려지지 않습니다.

## 배송된 스킨들

네 개는 내장되어 있으며, 색상이 아니라 모서리, 글꼴 및 컨트롤이 그려지는 방식도 더 많이 변경됩니다.

- **마인크래프트** - 픽셀 타입, 단단한 베벨, 둥근 모서리가 하나도 없다.
- **콜 오브 듀티** - 먼지가 묻은 카키색, 스텐실 프린트 모자, 모든 것에 필름 그라인이 묻어 있습니다.
- **2000년대** - 타호마, 베벨된 컨트롤, Windows XP 블루.
- **Frutiger Aero** - 광택 있는 유리, 파란색에서 녹색으로, 각 구석마다 빛이 반사됩니다.
- **터미널** - 검은색에 녹색의 전광판, 단일 간격, 스캔라인이 있는 것.
- **발포웨이브** - 보라색 위에 뜨거운 분홍색과 시안색, 모든 버튼에 크롬이 적용되어 있습니다.
- **종이** - 따뜻한 off-white와 세리프; 인쇄된 것처럼 읽힌다.
- **니온** - 거의 검정색, 마젠타와 시안색이 모든 가장자리에 새겨져 있습니다.
- **브루탈리즘** - 흰색에 검은색, 두 픽셀 경계, 단단한 블록인 그림자.

**설정 → 테마**에서 하나를 선택하세요. 스킨과 귀하의 사용자 정의 CSS가 함께 작동합니다. 스킨이 먼저 적용되므로 CSS가 교체할 필요가 없이 조정할 수 있습니다.

## 색상 변수들

이것은 안정적인 API입니다. `:root`에 설정하면 테마를 작성한 후 추가된 화면을 포함하여 앱의 모든 표면이 따라갑니다.

| 변수                | 영향을 미친다                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | 채팅 캔버스 - 앱에서 가장 큰 표면입니다.              |
| `--bg-secondary`        | 그 옆에 있는 패널들: 채널 목록, 회원 목록, 카드들.            |
| `--bg-tertiary`         | 서버 레일을 포함한 가장 바깥쪽 크롬.                |
| `--bg-accent`           | 삽입 표면: 작곡가, 코드 블록, 입력.             |
| `--interactive-hover` | 행과 버튼을 마우스 오버합니다.                                          |
| `--interactive-selected`| 당신이 현재 있는 행.                                  |
| `--brand`               | 기본 버튼, 링크, 초점 링, 당신만의 악센트.         |
| `--brand-hover`         | 동일, 마우스 오버 상태.                                             |
| `--text-normal`         | 본문 텍스트.                                                     |
| `--text-muted`          | 타임스탬프, 보조 레이블, 대입 공간.                    |
| `--text-link`           | 메시지 내부의 링크.                                         |
| `--status-online`       | 온라인 점, 성공 상태.                                    |
| `--status-idle`         | 비활성 점, 경고.                                            |
| `--status-dnd`          | 방해하지 말자 점은, 오류와 파괴적인 행동.            |
| `--status-offline`      | 오프라인 도트.                                                   |
| `--divider`             | 앱의 모든 이마 라인의 경계.                              |
| `--super`               | Disband SUPER 억양.                                      |

## 형태와 유형

Disband는 Tailwind의 반지름 스케일로 모서리를 그립니다. 이 스케일은 이러한 변수에 따라 읽습니다. 하나를 설정하면 해당 크기의 제품의 모든 모서리가 동시에 변경됩니다. 구성 요소를 찾을 필요가 없습니다.

| 변수           | 영향을 미친다                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | Tailwind의 `rounded-sm`. 작은 칩과 태그. |
| `--skin-radius-md` | `rounded-md` - 대부분의 버튼과 입력. |
| `--skin-radius-lg` | `rounded-lg` - 카드 및 패널.                    |
| `--skin-radius-xl` | `rounded-xl` - 모달, 콜 타일.                  |
| `--skin-radius-2xl` | `rounded-2xl` — 큰 오버레이.                     |
| `--skin-radius-3xl` | `rounded-3xl` — 가장 큰 표면들.               |
| `--skin-font`       | 전체 앱의 UI 폰트입니다.                  |

애바타와 상태 점은 의도적으로 이 목록에 포함되지 않습니다. 왜냐하면 사각형 애바타는 회원 목록을 읽기 어렵게 하기 때문입니다. 애바타를 직접 타겟팅하여 사각형으로 만들 수 있습니다.

**만약 당신이 밝은 테마를 만들고 있다면**, `color-scheme: light`를 `:root`에 설정하여 스크롤바와 네이티브 컨트롤이 함께 뒤집히도록 하고, `--bg-tertiary`가 텍스트를 포함한다는 것을 기억하세요: 그것은 서버 레일이기 때문에, 어두운 `--text-normal`와 함께 어두운 값을 사용하면 그 레이블이 단순히 대비가 낮은 것이 아니라 보이지 않게 됩니다.

## 선택자

Disband의 모든 컨트롤은 실제 `<button>`, `<input>` 또는 `<textarea>`이므로 요소 선택기는 전체 앱에 도달하고 변경될 때 계속 작동합니다.

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

배치 클래스는 Tailwind 유틸리티이며, `[class*="bg-brand"]` 스타일의 선택기는 작동하지만 지원되는 API가 아닙니다. 유틸리티 클래스는 화면이 재설계될 때 변경되며, 그것들을 기반으로 구축된 테마는 어떤 릴리스에서든 충돌할 것입니다. 위의 변수는 그렇지 않습니다.

## 업로드된 아이콘

**설정 → 테마**에서 이미지를 업로드하고 이름을 지정하세요. 이는 미리 만들어진 `url()`를 저장하는 변수로 변합니다.

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

이름은 소문자, 숫자 및 대시를 사용하여 최대 40자까지 사용할 수 있습니다. 테마는 최대 100개의 아이콘을 저장할 수 있으며 각 업로드는 2MB로 제한됩니다.

## 시작 템플릿

이를 편집기로 붙여넣고 원하는 대로 변경하세요:

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

## 무엇이 허용되지 않는가

당신의 CSS은 적용되기 전에 확인되며, 제거된 모든 항목은 조용히 삭제되는 것이 아니라 귀하에게 나열됩니다.

- `@import` - 매번 실행할 때마다 다른 서버에서 스타일시트를 로드합니다.
- `<` 및 `>` - CSS는 그것들에 대해 사용되지 않으며, 그들은 스타일시트를 일찍 종료할 수 있습니다.
- `expression()`, 그리고 `url()` 값은 `https:` 또는 `data:` 이미지가 아닌 값입니다.
- 테마는 CSS의 100KB로 제한됩니다.

웹 글꼴은 `@font-face`에서 `https:` 주소에서, 또는 업로드한 아이콘에서 로드할 수 있습니다.

## 만약 당신의 구독이 종료된다면

테마는 SUPER 기능이기 때문에, 만약 결제가 실패하면 귀하의 테마가 적용되지 않게 되고 Disband은 왜 그런지 알리는 메시지와 함께 조용히 모양을 바꾸는 대신 정상적인 모습으로 돌아갑니다.

**아무것도 삭제되지 않습니다.** 귀하의 피부, CSS 및 아이콘은 귀하의 계정에 남아 있습니다. 다시 구독하면 그대로 복원됩니다.
