# 主题

Disband **SUPER** 会员可以重新设计应用：选择其中一种已发货的皮肤，或编写你自己的 CSS，并上传你自己的图标。主题将保存到你的帐户中，因此当你在其他地方登录时，它已经打开了。

主题适用于**网络和桌面**。iOS和Android是原生构建的，没有主题可以应用的样式表，因此你的主题会同步，但不会在那里绘制。

## 已发货的皮肤

九个是内置的，它们改变的不只是颜色——还有角落、字体和控制器的绘制方式：

- **Minecraft**——像素类型，硬斜面，没有一个圆角。
- **使命召唤**——灰尘缭绕的卡其色，印花帽，所有东西上都有胶片纹理。
- **2000年代**——塔霍马，斜面控制，Windows XP蓝色。
- **Frutiger Aero**——光泽玻璃，从蓝色到绿色，光线在每个角落都闪耀。
- **终端**——黑色上方的绿色磷光，单行距，带有扫描线。
- **蒸汽浪潮**——紫色上加热粉色和青色，每个按钮上都有铬色。
- **纸张**——温暖的米白色和斜体字；看起来像打印的东西。
- **霓虹**——接近黑色，每条边缘都会有洋红色和青绿色的溢出。
- **粗糙派**——黑白相间，两像素边框，阴影是实心块。

在**设置→主题**中选择一个。皮肤和你自己的自定义CSS一起工作：首先应用皮肤，因此你的CSS可以调整它，而不是必须替换它。

## 颜色变量

这些是稳定的API。将它们设置在`:root`上，应用中的每个表面都会遵循，包括你编写主题后添加的屏幕。

| 变量                | 影响                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `--bg-primary`          | 聊天画布——应用中最大的表面。              |
| `--bg-secondary` | 旁边的小板块：频道列表、会员列表、卡片。 |
| `--bg-tertiary`         | 最外层的铬，包括服务器导轨。               |
| `--bg-accent`           | 嵌入表面：编程者、代码块、输入。             |
| `--interactive-hover` | 行和按钮悬停。                                          |
| `--interactive-selected`| 你当前所在的行。                                  |
| `--brand`               | 主按钮、链接、焦点环、你自己的口音。         |
| `--brand-hover`         | 相同，悬停。                                             |
| `--text-normal`         | 正文。                                                     |
| `--text-muted`          | 时间戳、二级标签、占位符。                    |
| `--text-link`           | 消息中的链接。                                         |
| `--status-online`       | 在线点，成功状态。                                    |
| `--status-idle`         | 空闲点，警告。                                            |
| `--status-dnd`          | 勿扰点、错误和破坏性操作。            |
| `--status-offline`      | 离线点。                                                   |
| `--divider`             | 应用中的每个发际线边框。                              |
| `--super`               | Disband SUPER口音。                                      |

## 形状和类型

Disband使用Tailwind的半径尺度绘制其角，该尺度从这些变量中读取。设置一个会同时更改产品中该尺寸的每个角——你无需找到组件。

|可变 | 影响                                              |
| ------------------ | ---------------------------------------------------- |
| `--skin-radius-sm` | Tailwind的`rounded-sm`。小芯片和标签。 |
| `--skin-radius-md` | `rounded-md` — 大多数按钮和输入。 |
| `--skin-radius-lg` | `rounded-lg` — 卡片和面板。                    |
| `--skin-radius-xl` | `rounded-xl` — 模态对话框，呼叫瓷砖。                  |
| `--skin-radius-2xl` | `rounded-2xl` — 大型叠加。                     |
| `--skin-radius-3xl` | `rounded-3xl` — 最大的表面。               |
| `--skin-font`       | 整个应用的UI字体。                  |

头像和状态点故意不在此列表中：它们是圆圈，因为方形头像会使成员列表难以阅读。你仍然可以通过直接定位它们来使其变为方形。

**如果你正在构建一个浅色主题**，请将`color-scheme: light`设置为`:root`，这样滚动条和原生控件就会随之翻转，请记住`--bg-tertiary`包含文本：它是服务器轨道，因此那里带有深色`--text-normal`的深色值使这些标签不可见，而不仅仅是对比度低。

## 选择器

Disband中的每个控件都是真正的`<button>`、`<input>`或`<textarea>`，因此元素选择器可以访问整个应用，并在其变化时继续工作：

```css
button { border-radius: 0; }
button:active { transform: translateY(1px); }
input, textarea { border: 1px solid var(--divider); }
```

布局类是Tailwind实用程序，`[class*="bg-brand"]`样式的选择器确实起作用——但它们不是受支持的API。当屏幕重新设计时，实用程序类会发生变化，基于它们的主题在某些版本中会崩溃。上述变量不会。

## 上传的图标

在**设置→主题**中上传一张图片，并给它起个名字。它将成为一个变量，存储一个现成的`url()`：

```css
/* An icon uploaded as "send" */
.some-target {
  background-image: var(--icon-send);
}
```

名称使用小写字母、数字和连字符，最多40个字符。主题最多可容纳100个图标，每次上传最多2 MB。

## 启动模板

将此粘贴到编辑器中，并更改你喜欢的内容：

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

## 什么是不允许的

你的CSS在应用之前会进行检查，任何被删除的内容都会为你列出，而不是无声地丢弃：

- `@import` — 每次启动时都会从另一个服务器加载样式表。
- `<`和`>`——CSS对它们没有用处，它们可以提前结束样式表。
- `expression()`和`url()`值不是`https:`或`data:`图像。
- 主题的限制为100 KB的CSS。

Web字体可以从`https:`地址或你上传的图标中加载`@font-face`。

## 如果你的订阅到期

主题是SUPER的功能，因此如果付款失败，你的主题将停止应用，Disband将恢复正常外观——并显示一个通知，说明原因，而不是无声地改变形状。

**什么都没有被删除。**你的皮肤、CSS和图标仍然留在你的帐户上；重新订阅，它们会完全如你离开时一样恢复。
