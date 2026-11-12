// Builds the Disband docs website: markdown in this repo → static HTML in dist/.
//
//   npm run build
//
// The on-disk URL scheme is:
//   index.md                      →  /
//   bots/index.md                 →  /docs/bots/
//   bots/getting-started.md       →  /docs/bots/getting-started/
//   bots/clients/javascript.md    →  /docs/bots/clients/javascript/
//   bots/api-reference.md         →  /docs/bots/api-reference/
//   bots/changelog.md             →  /docs/bots/changelog/
//   developers/webhooks.md        →  /docs/developers/webhooks/
//   themes/index.md               →  /docs/themes/
//
// Relative `foo.md` links are resolved per page and rewritten to the real
// absolute URL of the target page, so links work whatever directory the page
// is served from. dist/zips/* is copied through so download links work.
//
// Every page gets the same shell: a header with search, a sidebar (a drawer
// on phones), an "On this page" outline, copy buttons on code, and links to
// the previous and next pages. Search runs in the browser over
// /search-index.json (one per language), built here from each page's sections.

import { rm, mkdir, copyFile, readFile, writeFile, readdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/common";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://docs.disband.dev";
const PORTAL_URL = "https://www.disband.dev/developers/applications";

const LOCALIZED_UI = JSON.parse(readFileSync(resolve(ROOT, "i18n", "ui.json"), "utf8"));

const LOCALES = [
  { code: "en", path: "", label: "English" },
  { code: "es", path: "es", label: "Español" },
  { code: "fr", path: "fr", label: "Français" },
  { code: "de", path: "de", label: "Deutsch" },
  { code: "pt-BR", path: "pt-br", label: "Português (Brasil)" },
  { code: "ja", path: "ja", label: "日本語" },
  { code: "ko", path: "ko", label: "한국어" },
  { code: "zh-CN", path: "zh-cn", label: "简体中文" },
];

function ui(locale, key) {
  return LOCALIZED_UI[locale.code]?.[key] ?? LOCALIZED_UI.en?.[key] ?? key;
}

const PAGES = [
  { src: "index.md",                     out: "index.html",                                label: "Docs home" },
  { src: "bots/index.md",                out: "docs/bots/index.html",                      label: "Overview" },
  { src: "bots/getting-started.md",      out: "docs/bots/getting-started/index.html",      label: "Getting started" },
  { src: "bots/hosting-your-own-bot.md", out: "docs/bots/hosting-your-own-bot/index.html", label: "Hosting your own bot" },
  { src: "bots/clients/javascript.md",   out: "docs/bots/clients/javascript/index.html",   label: "JavaScript" },
  { src: "bots/clients/python.md",       out: "docs/bots/clients/python/index.html",       label: "Python" },
  { src: "bots/api-reference.md",        out: "docs/bots/api-reference/index.html",        label: "API reference" },
  { src: "bots/templates.md",            out: "docs/bots/templates/index.html",            label: "Templates" },
  { src: "bots/changelog.md",            out: "docs/bots/changelog/index.html",            label: "Changelog" },
  { src: "themes/index.md",              out: "docs/themes/index.html",                    label: "Themes" },
  { src: "developers/index.md",          out: "docs/developers/index.html",                label: "Developers" },
  { src: "developers/webhooks.md",       out: "docs/developers/webhooks/index.html",       label: "Webhooks" },
  { src: "developers/extended-api.md",   out: "docs/developers/extended-api/index.html",   label: "Extended API" },
  { src: "developers/embeds.md",         out: "docs/developers/embeds/index.html",         label: "Embeds" },
  { src: "developers/status.md",         out: "docs/developers/status/index.html",         label: "Status system" },
];

// Each page appears once, in reading order; previous/next follow this order.
const NAV = [
  {
    label: "Get started",
    items: [
      { href: "/", label: "Docs home" },
      { href: "/docs/bots/", label: "Overview" },
      { href: "/docs/bots/getting-started/", label: "Getting started" },
      { href: "/docs/bots/hosting-your-own-bot/", label: "Hosting your own bot" },
    ],
  },
  {
    label: "Bots",
    items: [
      { href: "/docs/bots/api-reference/", label: "API reference" },
      { href: "/docs/bots/clients/javascript/", label: "JavaScript" },
      { href: "/docs/bots/clients/python/", label: "Python" },
      { href: "/docs/bots/templates/", label: "Templates" },
      { href: "/docs/bots/changelog/", label: "Changelog" },
    ],
  },
  {
    label: "Developers",
    items: [
      { href: "/docs/developers/", label: "Developers" },
      { href: "/docs/developers/extended-api/", label: "Extended API" },
      { href: "/docs/developers/webhooks/", label: "Webhooks" },
      { href: "/docs/developers/embeds/", label: "Embeds" },
      { href: "/docs/developers/status/", label: "Status system" },
    ],
  },
  { label: "Themes", items: [{ href: "/docs/themes/", label: "Themes" }] },
];
const NAV_ORDER = NAV.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));

// The cards on the home page.
const HOME_CARDS = [
  { href: "/docs/bots/getting-started/", label: "Getting started", body: "Create a bot, connect it and answer your first message." },
  { href: "/docs/bots/api-reference/", label: "API reference", body: "Every endpoint, gateway event, scope and limit." },
  { href: "/docs/bots/clients/javascript/", label: "JavaScript", body: "@disband/bot for Node.js, Deno, Bun and the browser." },
  { href: "/docs/bots/clients/python/", label: "Python", body: "disband-bot, standard library only." },
  { href: "/docs/developers/webhooks/", label: "Webhooks", body: "Post into channels from anything that can send HTTP." },
  { href: "/docs/themes/", label: "Themes", body: "Restyle the app with CSS variables and skins." },
];

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function escapeHTML(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Headings of the page being rendered, in order, with ids made unique.
let pageHeadings = [];
let usedIds = new Map();
function uniqueId(base) {
  const id = base || "section";
  const n = usedIds.get(id) ?? 0;
  usedIds.set(id, n + 1);
  return n === 0 ? id : `${id}-${n + 1}`;
}

const renderer = {
  heading({ tokens, depth, text }) {
    const id = uniqueId(slugify(text));
    const inner = this.parser.parseInline(tokens);
    pageHeadings.push({ depth, id, text: inner.replace(/<[^>]*>/g, "") });
    return `<h${depth} id="${id}"><a href="#${id}" class="anchor" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
  },
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const safeTitle = title ? ` title="${escapeHTML(title)}"` : "";
    if (/^https?:\/\//.test(href)) {
      return `<a href="${href}"${safeTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    return `<a href="${href}"${safeTitle}>${text}</a>`;
  },
  table({ header, rows }) {
    let head = "";
    for (const cell of header) head += this.tablecell(cell);
    let body = "";
    for (const row of rows) {
      let cells = "";
      for (const cell of row) cells += this.tablecell(cell);
      body += this.tablerow({ text: cells });
    }
    return `<div class="table-wrap"><table><thead>${this.tablerow({ text: head })}</thead>${
      body ? `<tbody>${body}</tbody>` : ""
    }</table></div>`;
  },
};
marked.use({ renderer });

// Code blocks get a bar with the language and a copy button.
function decorateCode(html, locale) {
  const copy = escapeHTML(ui(locale, "Copy"));
  const copied = escapeHTML(ui(locale, "Copied"));
  return html.replace(/<pre><code(?: class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g, (_m, found, code) => {
    const cls = found || "hljs";
    const lang = (cls.match(/language-([\w+#-]+)/)?.[1] ?? "").replace("plaintext", "");
    const label = { js: "JavaScript", javascript: "JavaScript", ts: "TypeScript", typescript: "TypeScript", py: "Python", python: "Python", bash: "Shell", sh: "Shell", json: "JSON", html: "HTML", css: "CSS", http: "HTTP", sql: "SQL" }[lang] ?? lang;
    return `<div class="code-block"><div class="code-bar"><span>${escapeHTML(label)}</span><button type="button" class="copy" data-label="${copy}" data-done="${copied}">${copy}</button></div><pre><code class="${cls}">${code}</code></pre></div>`;
  });
}

function extractMeta(md) {
  const titleMatch = md.match(/^# (.+)$/m);
  const firstParagraph = md
    .split(/\n\s*\n/)
    .find((p) => !p.startsWith("#") && !p.startsWith("```") && !p.startsWith("|") && p.trim().length > 0);
  const description = firstParagraph
    ? plainText(firstParagraph).slice(0, 160)
    : "The Disband documentation.";
  return { title: titleMatch ? plainText(titleMatch[1]).trim() : undefined, description };
}

// Markdown to searchable text: no fences, markup, or table pipes.
function plainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_`#>|]/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The page's sections, split at h2/h3 outside code fences, in the same order
// the renderer saw them, so each lines up with its heading id.
function sections(md) {
  const out = [];
  let current = null;
  let fenced = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      current = { depth: heading[1].length, lines: [] };
      out.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return out;
}

function localePrefix(locale) {
  return locale.path ? `/${locale.path}` : "";
}

// Absolute URL for a source markdown file. "index.md" at the root is the home
// page; anything else lives under /docs/ mirroring the source directory.
function srcToUrl(srcPath, locale = LOCALES[0]) {
  const prefix = localePrefix(locale);
  if (srcPath === "index.md") return `${prefix}/`;
  if (srcPath.endsWith("/index.md")) return `${prefix}/docs/${posix.dirname(srcPath)}/`;
  return `${prefix}/docs/${srcPath.replace(/\.md$/, "")}/`;
}

function pageUrl(page, locale = LOCALES[0]) {
  const base = page.out === "index.html" ? "/" : "/" + posix.dirname(page.out) + "/";
  return localePrefix(locale) + base;
}

// Rewrites relative link targets in rendered HTML. `foo.md` (and `foo.md#sec`)
// are resolved against the current page's source directory so relative links
// turn into the correct absolute URL for the target page.
function rewriteLinks(html, currentSrc, locale = LOCALES[0]) {
  const fromDir = posix.dirname(currentSrc);
  return html.replace(/href="([^"]+?\.md)(#[\w-]+)?"/g, (_m, path, hash) => {
    if (path.startsWith("/") || /^https?:/.test(path)) return _m;
    const resolved = posix.normalize(posix.join(fromDir, path));
    const url = srcToUrl(resolved, locale);
    return `href="${url}${hash ? hash : ""}"`;
  });
}

function navHTML(currentUrl, locale) {
  const prefix = localePrefix(locale);
  const groups = NAV.map((group) => {
    const items = group.items
      .map((item) => {
        const href = item.href === "/" ? `${prefix}/` : `${prefix}${item.href}`;
        const active = href === currentUrl;
        return `<a href="${href}"${active ? ' class="active" aria-current="page"' : ""}>${ui(locale, item.label)}</a>`;
      })
      .join("");
    return `<div class="nav-group"><p class="nav-label">${ui(locale, group.label)}</p>${items}</div>`;
  }).join("");
  return `<nav class="sidebar-nav" aria-label="${escapeHTML(ui(locale, "Documentation"))}">${groups}<a class="nav-portal" href="${PORTAL_URL}" target="_blank" rel="noopener">${ui(locale, "Developer portal")} ↗</a></nav>`;
}

function tocHTML(headings, locale) {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  if (items.length < 2) return "";
  return `<p class="toc-label">${ui(locale, "On this page")}</p><nav aria-label="${escapeHTML(ui(locale, "On this page"))}">${items
    .map((h) => `<a href="#${h.id}" class="toc-${h.depth}">${escapeHTML(h.text)}</a>`)
    .join("")}</nav>`;
}

function pagerHTML(currentUrl, locale) {
  const prefix = localePrefix(locale);
  const urls = NAV_ORDER.map((item) => (item.href === "/" ? `${prefix}/` : `${prefix}${item.href}`));
  const i = urls.indexOf(currentUrl);
  if (i === -1) return "";
  const link = (j, dir) => {
    if (j < 0 || j >= NAV_ORDER.length) return "<span></span>";
    const item = NAV_ORDER[j];
    return `<a class="pager-${dir}" href="${urls[j]}"><span class="pager-dir">${ui(locale, dir === "prev" ? "Previous" : "Next")}</span><span class="pager-title">${ui(locale, item.label)}</span></a>`;
  };
  return `<nav class="pager" aria-label="${escapeHTML(ui(locale, "Pages"))}">${link(i - 1, "prev")}${link(i + 1, "next")}</nav>`;
}

function homeCardsHTML(locale) {
  const prefix = localePrefix(locale);
  return `<div class="cards">${HOME_CARDS.map(
    (c) => `<a class="card" href="${prefix}${c.href}"><span class="card-title">${ui(locale, c.label)} <span aria-hidden="true">→</span></span><span class="card-body">${escapeHTML(ui(locale, c.body))}</span></a>`,
  ).join("")}</div>`;
}

const ICONS = {
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  theme: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path class="i-moon" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/><g class="i-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>',
};

const STYLES = `
:root {
  --bg: #0e0f11;
  --bg-elev: #15161a;
  --bg-soft: #1c1d22;
  --border: #26282e;
  --text: #d6d9de;
  --muted: #959ba6;
  --bright: #f4f5f7;
  --brand: #5865f2;
  --brand-hover: #4752c4;
  --brand-soft: rgba(88, 101, 242, 0.14);
  --link: #8fa2ff;
  --code-bg: #121317;
  --inline-code: #b6bff8;
  --header-bg: rgba(14, 15, 17, 0.82);
  --shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  --hl-comment: #7d8590; --hl-keyword: #ff7b72; --hl-string: #a5d6ff; --hl-number: #79c0ff;
  --hl-title: #d2a8ff; --hl-attr: #79c0ff; --hl-built-in: #ffa657; --hl-meta: #8b949e; --hl-deletion: #ffa198; --hl-addition: #7ee787;
  --sidebar-w: 256px;
  --toc-w: 220px;
  color-scheme: dark;
}
:root[data-theme="light"] {
  --bg: #ffffff;
  --bg-elev: #f7f8fa;
  --bg-soft: #eff1f4;
  --border: #e2e5ea;
  --text: #2a2f37;
  --muted: #646c78;
  --bright: #0e1116;
  --brand-soft: rgba(88, 101, 242, 0.1);
  --link: #4352e0;
  --code-bg: #f6f7f9;
  --inline-code: #3a45c0;
  --header-bg: rgba(255, 255, 255, 0.85);
  --shadow: 0 12px 40px rgba(15, 20, 30, 0.14);
  --hl-comment: #6e7781; --hl-keyword: #cf222e; --hl-string: #0a3069; --hl-number: #0550ae;
  --hl-title: #8250df; --hl-attr: #0550ae; --hl-built-in: #953800; --hl-meta: #57606a; --hl-deletion: #82071e; --hl-addition: #116329;
  color-scheme: light;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #ffffff; --bg-elev: #f7f8fa; --bg-soft: #eff1f4; --border: #e2e5ea; --text: #2a2f37; --muted: #646c78;
    --bright: #0e1116; --brand-soft: rgba(88, 101, 242, 0.1); --link: #4352e0; --code-bg: #f6f7f9; --inline-code: #3a45c0;
    --header-bg: rgba(255, 255, 255, 0.85); --shadow: 0 12px 40px rgba(15, 20, 30, 0.14);
    --hl-comment: #6e7781; --hl-keyword: #cf222e; --hl-string: #0a3069; --hl-number: #0550ae;
    --hl-title: #8250df; --hl-attr: #0550ae; --hl-built-in: #953800; --hl-meta: #57606a; --hl-deletion: #82071e; --hl-addition: #116329;
    color-scheme: light;
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 80px; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } * { transition: none !important; animation: none !important; } }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 15.5px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 4px; }
.skip { position: absolute; left: -999px; top: 8px; z-index: 100; padding: 8px 12px; border-radius: 8px; background: var(--brand); color: #fff; }
.skip:focus { left: 12px; }

/* Header */
.site-header {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: 16px;
  height: 64px; padding: 0 20px;
  background: var(--header-bg);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid var(--border);
}
.wordmark { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: var(--bright); white-space: nowrap; }
.wordmark:hover { text-decoration: none; }
.site-logo { width: 28px; height: 28px; }
.docs-pill { font-size: 12px; font-weight: 600; color: var(--muted); background: var(--bg-soft); border: 1px solid var(--border); padding: 1px 8px; border-radius: 999px; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid transparent;
  background: transparent; color: var(--muted); cursor: pointer;
}
.icon-btn:hover { background: var(--bg-soft); color: var(--bright); }
.menu-btn { display: none; margin-left: -6px; }
.i-sun { display: none; }
:root[data-theme="light"] .i-sun { display: inline; }
:root[data-theme="light"] .i-moon { display: none; }
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) .i-sun { display: inline; }
  :root:not([data-theme="dark"]) .i-moon { display: none; }
}

.search { position: relative; flex: 1; max-width: 440px; margin: 0 auto; }
.search > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.search input {
  width: 100%; height: 38px; padding: 0 52px 0 36px;
  border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-elev); color: var(--text); font: inherit; font-size: 14px;
  transition: border-color .15s, background .15s;
}
.search input::placeholder { color: var(--muted); }
.search input:focus { outline: none; border-color: var(--brand); background: var(--bg); }
.search input::-webkit-search-cancel-button { display: none; }
.search kbd {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font: 11.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted);
  border: 1px solid var(--border); border-radius: 5px; padding: 3px 6px; background: var(--bg-soft);
}
.search-results {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 50;
  max-height: min(70vh, 520px); overflow-y: auto;
  background: var(--bg-elev); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: var(--shadow); padding: 6px;
}
.sr-item { display: block; padding: 9px 12px; border-radius: 8px; color: var(--text); }
.sr-item:hover, .sr-item.active { background: var(--brand-soft); text-decoration: none; }
.sr-title { display: block; font-weight: 600; color: var(--bright); font-size: 14px; }
.sr-page { display: block; font-size: 12px; color: var(--muted); }
.sr-text { display: block; font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sr-empty { margin: 0; padding: 14px 12px; color: var(--muted); font-size: 13.5px; }

.header-links { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.header-links a { color: var(--muted); padding: 6px 10px; border-radius: 8px; white-space: nowrap; }
.header-links a:hover { color: var(--bright); background: var(--bg-soft); text-decoration: none; }
.lang-select {
  appearance: none; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-elev); color: var(--text); font: inherit; font-size: 13px;
  height: 34px; padding: 0 28px 0 10px; cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 13px) 52%, calc(100% - 9px) 52%;
  background-size: 4px 4px, 4px 4px; background-repeat: no-repeat;
}
.lang-select:hover { border-color: var(--muted); }

/* Layout */
.layout {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr) var(--toc-w);
  max-width: 1440px; margin: 0 auto;
  min-height: calc(100vh - 64px);
}
.sidebar {
  position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto;
  padding: 28px 14px 40px 20px;
  border-right: 1px solid var(--border);
}
.sidebar-nav { display: flex; flex-direction: column; gap: 22px; }
.nav-group { display: flex; flex-direction: column; gap: 1px; }
.nav-label { margin: 0 0 6px; padding: 0 10px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); }
.sidebar-nav a { display: block; padding: 6px 10px; border-radius: 7px; color: var(--muted); font-size: 14px; line-height: 1.45; transition: background .12s, color .12s; }
.sidebar-nav a:hover { background: var(--bg-soft); color: var(--bright); text-decoration: none; }
.sidebar-nav a.active { background: var(--brand-soft); color: var(--bright); font-weight: 600; box-shadow: inset 2px 0 0 var(--brand); }
.nav-portal { margin-top: 4px; border: 1px dashed var(--border); text-align: center; }

.toc { position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; padding: 36px 20px 40px 8px; font-size: 13px; }
.toc-label { margin: 0 0 10px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); }
.toc nav { display: flex; flex-direction: column; border-left: 1px solid var(--border); }
.toc a { display: block; padding: 4px 0 4px 12px; margin-left: -1px; border-left: 2px solid transparent; color: var(--muted); line-height: 1.4; }
.toc a:hover { color: var(--bright); text-decoration: none; }
.toc a.toc-3 { padding-left: 24px; font-size: 12.5px; }
.toc a.active { color: var(--bright); border-left-color: var(--brand); }

main.content { min-width: 0; width: 100%; max-width: 820px; margin: 0 auto; padding: 44px 48px 96px; }
.eyebrow { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: var(--brand); letter-spacing: .02em; }
.content h1 { margin: 0 0 12px; font-size: 38px; font-weight: 750; color: var(--bright); letter-spacing: -0.025em; line-height: 1.12; }
.content .lede { color: var(--muted); font-size: 18px; margin: 0 0 32px; line-height: 1.55; }
.content h2 { margin: 52px 0 14px; padding-top: 4px; font-size: 24px; font-weight: 700; color: var(--bright); letter-spacing: -0.015em; line-height: 1.25; }
.content h3 { margin: 34px 0 10px; font-size: 18px; font-weight: 650; color: var(--bright); line-height: 1.35; }
.content h4 { margin: 26px 0 8px; font-size: 15.5px; color: var(--bright); }
.content p { margin: 12px 0; }
.content ul, .content ol { margin: 12px 0; padding-left: 22px; }
.content li { margin: 6px 0; }
.content li::marker { color: var(--muted); }
.content strong { color: var(--bright); font-weight: 650; }
.content blockquote {
  margin: 20px 0; padding: 12px 16px; border-radius: 10px;
  border: 1px solid var(--border); border-left: 3px solid var(--brand);
  background: var(--brand-soft); color: var(--text);
}
.content blockquote p { margin: 4px 0; }
.content code:not(.hljs) {
  background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 6px; padding: 1.5px 6px;
  font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--inline-code);
  overflow-wrap: anywhere;
}
.code-block { margin: 18px 0; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--code-bg); }
.code-bar { display: flex; align-items: center; justify-content: space-between; min-height: 36px; padding: 0 8px 0 14px; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--muted); }
.code-bar span:empty::before { content: "\\00a0"; }
.copy { border: 1px solid var(--border); background: var(--bg-elev); color: var(--muted); border-radius: 6px; font: inherit; font-size: 12px; padding: 3px 10px; cursor: pointer; }
.copy:hover { color: var(--bright); border-color: var(--muted); }
.content pre { margin: 0; overflow: auto; }
.content pre code.hljs { display: block; padding: 16px 18px; background: transparent; font: 13px/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--text); }
.table-wrap { overflow-x: auto; margin: 18px 0; border: 1px solid var(--border); border-radius: 12px; }
.content table { border-collapse: collapse; width: 100%; font-size: 14px; }
.content thead th {
  text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 650; text-transform: uppercase; letter-spacing: .05em;
  color: var(--muted); background: var(--bg-elev); border-bottom: 1px solid var(--border);
}
.content td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
.content tbody tr:last-child td { border-bottom: none; }
.content tbody tr:hover td { background: var(--bg-elev); }
.content td code:not(.hljs) { white-space: nowrap; overflow-wrap: normal; }
.content a.anchor { float: left; margin-left: -22px; width: 22px; color: var(--muted); opacity: 0; text-decoration: none; font-weight: 500; }
.content h2:hover a.anchor, .content h3:hover a.anchor, .content h4:hover a.anchor { opacity: 1; }
.content h1 a.anchor { display: none; }
.content hr { border: none; border-top: 1px solid var(--border); margin: 36px 0; }
.content img { max-width: 100%; border-radius: 10px; }

.translation-note {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  margin: 0 0 28px; padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--bg-elev);
  color: var(--muted); font-size: 13px; line-height: 1.5;
}
.translation-note strong { color: var(--text); font-weight: 600; }
.translation-note a { white-space: nowrap; }

/* Home */
.home .content h1 { font-size: 48px; letter-spacing: -0.035em; }
.home .content .lede { font-size: 19px; max-width: 600px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin: 8px 0 40px; }
.card {
  display: flex; flex-direction: column; gap: 4px; padding: 16px 18px;
  border: 1px solid var(--border); border-radius: 12px; background: var(--bg-elev); color: var(--text);
  transition: border-color .15s, transform .15s, background .15s;
}
.card:hover { border-color: var(--brand); transform: translateY(-2px); text-decoration: none; }
.card-title { font-weight: 650; color: var(--bright); font-size: 15px; }
.card-title span { color: var(--muted); transition: transform .15s; display: inline-block; }
.card:hover .card-title span { transform: translateX(3px); color: var(--brand); }
.card-body { font-size: 13.5px; line-height: 1.5; color: var(--muted); }

/* Previous / next */
.pager { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 64px; padding-top: 28px; border-top: 1px solid var(--border); }
.pager a { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 12px; color: var(--text); transition: border-color .15s; }
.pager a:hover { border-color: var(--brand); text-decoration: none; }
.pager-next { text-align: right; grid-column: 2; }
.pager-dir { font-size: 12.5px; color: var(--muted); }
.pager-title { font-weight: 650; color: var(--bright); }

.site-footer { border-top: 1px solid var(--border); padding: 24px; text-align: center; font-size: 13px; color: var(--muted); }
.site-footer a { color: var(--muted); }
.site-footer a:hover { color: var(--bright); }

.scrim { display: none; }

@media (max-width: 1200px) {
  .layout { grid-template-columns: var(--sidebar-w) minmax(0, 1fr); }
  .toc { display: none; }
}
@media (max-width: 900px) {
  .site-header { gap: 10px; padding: 0 14px; }
  .menu-btn { display: inline-flex; }
  .header-links a, .search kbd { display: none; }
  .wordmark .docs-pill { display: none; }
  .layout { grid-template-columns: minmax(0, 1fr); }
  .sidebar {
    position: fixed; top: 64px; left: 0; bottom: 0; z-index: 35; height: auto;
    width: min(300px, 86vw); background: var(--bg); box-shadow: var(--shadow);
    transform: translateX(-102%); transition: transform .2s ease;
  }
  body.nav-open .sidebar { transform: none; }
  body.nav-open .scrim { display: block; position: fixed; inset: 64px 0 0; z-index: 30; background: rgba(0, 0, 0, 0.45); }
  main.content { padding: 32px 20px 72px; }
  .content h1, .home .content h1 { font-size: 32px; }
  .content a.anchor { display: none; }
}
@media (max-width: 560px) {
  .lang-select { max-width: 92px; }
  .pager { grid-template-columns: 1fr; }
  .pager-next { grid-column: 1; }
}

/* Syntax colours, from the variables above. */
.hljs-comment, .hljs-quote { color: var(--hl-comment); font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-type, .hljs-doctag, .hljs-template-tag { color: var(--hl-keyword); }
.hljs-string, .hljs-regexp, .hljs-template-variable, .hljs-symbol { color: var(--hl-string); }
.hljs-number, .hljs-literal, .hljs-attr, .hljs-attribute, .hljs-variable, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: var(--hl-number); }
.hljs-title, .hljs-section, .hljs-title.function_ { color: var(--hl-title); }
.hljs-built_in, .hljs-name, .hljs-property, .hljs-params { color: var(--hl-built-in); }
.hljs-meta, .hljs-meta .hljs-keyword { color: var(--hl-meta); }
.hljs-deletion { color: var(--hl-deletion); }
.hljs-addition { color: var(--hl-addition); }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: 700; }
`;

const SCRIPT = `
(() => {
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");
  themeBtn && themeBtn.addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("docs-theme", root.dataset.theme); } catch (e) {}
  });

  const menu = document.getElementById("menu-toggle");
  const closeNav = () => { document.body.classList.remove("nav-open"); menu && menu.setAttribute("aria-expanded", "false"); };
  menu && menu.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  const scrim = document.querySelector(".scrim");
  scrim && scrim.addEventListener("click", closeNav);

  document.querySelectorAll(".code-block").forEach((block) => {
    const button = block.querySelector(".copy");
    const pre = block.querySelector("pre");
    button && pre && button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/\\n$/, ""));
        button.textContent = button.dataset.done;
        setTimeout(() => { button.textContent = button.dataset.label; }, 1600);
      } catch (e) {}
    });
  });

  const tocLinks = Array.from(document.querySelectorAll(".toc a"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    const ids = tocLinks.map((a) => decodeURIComponent(a.hash.slice(1)));
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      const current = ids.find((id) => visible.has(id));
      if (current) tocLinks.forEach((a, i) => a.classList.toggle("active", ids[i] === current));
    }, { rootMargin: "-72px 0px -65% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); el && observer.observe(el); });
  }

  const input = document.getElementById("search");
  const box = document.getElementById("search-results");
  if (!input || !box) return;
  let index = null;
  let results = [];
  let active = -1;
  const load = () => index || (index = fetch(input.dataset.index).then((r) => r.json()).catch(() => []));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const show = (open) => { box.hidden = !open; input.setAttribute("aria-expanded", String(open)); };
  const render = () => {
    const q = input.value.trim();
    if (!q) { box.innerHTML = ""; show(false); return; }
    box.innerHTML = results.length
      ? results.map((r, i) => '<a role="option" class="sr-item' + (i === active ? " active" : "") + '" href="' + r.u + '"' + (i === active ? ' aria-selected="true"' : "") + '>'
          + '<span class="sr-title">' + esc(r.h || r.t) + '</span>'
          + '<span class="sr-page">' + esc(r.h ? r.t : r.s) + '</span>'
          + (r.x ? '<span class="sr-text">' + esc(r.x.slice(0, 140)) + '</span>' : "") + "</a>").join("")
      : '<p class="sr-empty">' + esc(box.dataset.empty) + "</p>";
    show(true);
  };
  const run = async () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results = []; render(); return; }
    const terms = q.split(/\\s+/);
    const data = await load();
    if (input.value.trim().toLowerCase() !== q) return;
    results = data.map((e) => {
      const t = e.t.toLowerCase(), h = (e.h || "").toLowerCase(), x = (e.x || "").toLowerCase();
      let score = 0;
      for (const term of terms) {
        const s = (h.includes(term) ? 6 : 0) + (t.includes(term) ? 3 : 0) + (x.includes(term) ? 1 : 0);
        if (!s) return null;
        score += s;
      }
      if (h.startsWith(q)) score += 6;
      if (!e.h) score += 1;
      return Object.assign({ score }, e);
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
    active = results.length ? 0 : -1;
    render();
  };
  input.addEventListener("input", run);
  input.addEventListener("focus", () => { load(); if (input.value.trim()) run(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && results.length) { active = (active + 1) % results.length; render(); e.preventDefault(); }
    else if (e.key === "ArrowUp" && results.length) { active = (active - 1 + results.length) % results.length; render(); e.preventDefault(); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); location.href = results[active].u; }
    else if (e.key === "Escape") { input.value = ""; results = []; render(); input.blur(); }
  });
  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea|select)$/i.test((document.activeElement && document.activeElement.tagName) || "");
    if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault(); input.focus(); input.select();
    }
    if (e.key === "Escape") closeNav();
  });
  document.addEventListener("click", (e) => { if (!box.contains(e.target) && e.target !== input) show(false); });
})();
`;

function pageHTML({ title, description, html, toc, pager, eyebrow, currentUrl, locale, alternates, englishUrl, translated, isHome }) {
  const canonical = BASE_URL + currentUrl;
  const docLabel = ui(locale, "Disband Docs");
  const prefix = localePrefix(locale);
  const fullTitle =
    isHome && locale.code !== "en" ? docLabel : title === docLabel ? title : `${title} — ${docLabel}`;
  const languageLabel = ui(locale, "Language");
  const searchLabel = ui(locale, "Search");
  const homeUrl = `${prefix}/`;
  const altTags = [
    ...alternates.map(
      (alternate) => `<link rel="alternate" hreflang="${alternate.hreflang}" href="${BASE_URL}${alternate.url}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${alternates[0].url}" />`,
  ].join("\n");
  const options = alternates
    .map(
      (alternate) =>
        `<option value="${alternate.url}"${alternate.code === locale.code ? " selected" : ""}>${alternate.label}</option>`,
    )
    .join("");
  const banner =
    locale.code === "en"
      ? ""
      : translated
        ? `<div class="translation-note"><strong>${ui(locale, "Automatic translation")}</strong><span>${ui(
            locale,
            "This page was translated automatically. The English original is the source of truth.",
          )}</span><a href="${englishUrl}">${ui(locale, "Read this page in English")}</a></div>`
        : `<div class="translation-note"><strong>English only</strong><span>This page is not translated yet. The English original is the source of truth.</span><a href="${englishUrl}">Read this page in English</a></div>`;
  return `<!doctype html>
<html lang="${locale.code}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHTML(fullTitle)}</title>
<meta name="description" content="${escapeHTML(description)}" />
<link rel="canonical" href="${canonical}" />
${altTags}
<link rel="icon" href="/logo.png" />
<meta name="theme-color" content="#0e0f11" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta property="og:title" content="${escapeHTML(fullTitle)}" />
<meta property="og:description" content="${escapeHTML(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="${locale.code.replace("-", "_")}" />
<meta name="twitter:card" content="summary" />
<script>try{var t=localStorage.getItem("docs-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<style>${STYLES}</style>
</head>
<body${isHome ? ' class="home"' : ""}>
<a class="skip" href="#main">${ui(locale, "Skip to content")}</a>
<header class="site-header">
  <button id="menu-toggle" class="icon-btn menu-btn" type="button" aria-label="${escapeHTML(ui(locale, "Menu"))}" aria-expanded="false">${ICONS.menu}</button>
  <a class="wordmark" href="${homeUrl}"><img class="site-logo" src="/logo.png" alt="" width="28" height="28" />Disband <span class="docs-pill">${ui(locale, "Docs")}</span></a>
  <div class="search">
    ${ICONS.search}
    <input id="search" type="search" placeholder="${escapeHTML(searchLabel)}…" aria-label="${escapeHTML(searchLabel)}" autocomplete="off" spellcheck="false"
      role="combobox" aria-expanded="false" aria-controls="search-results" data-index="${prefix}/search-index.json" />
    <kbd>⌘K</kbd>
    <div id="search-results" class="search-results" role="listbox" hidden data-empty="${escapeHTML(ui(locale, "No results"))}"></div>
  </div>
  <div class="header-links">
    <a href="${PORTAL_URL}" target="_blank" rel="noopener">${ui(locale, "Developer portal")}</a>
    <a href="https://www.disband.dev">disband.dev</a>
    <label class="sr-only" for="language-select">${languageLabel}</label>
    <select id="language-select" class="lang-select" aria-label="${languageLabel}" onchange="if(this.value) location.href=this.value">
      ${options}
    </select>
    <button id="theme-toggle" class="icon-btn" type="button" aria-label="${escapeHTML(ui(locale, "Switch theme"))}">${ICONS.theme}</button>
  </div>
</header>
<div class="scrim"></div>
<div class="layout">
  <aside class="sidebar">${navHTML(currentUrl, locale)}</aside>
  <main class="content" id="main">
    ${banner}
    ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
    <article>${html}</article>
    ${pager}
  </main>
  <aside class="toc">${toc}</aside>
</div>
<footer class="site-footer">
  © ${new Date().getFullYear()} Disband · <a href="https://www.disband.dev">disband.dev</a> ·
  <a href="https://www.disband.dev/privacy">${ui(locale, "Privacy")}</a> ·
  <a href="https://www.disband.dev/terms">${ui(locale, "Terms")}</a>
</footer>
<script>${SCRIPT}</script>
</body>
</html>`;
}

async function build() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const zipsDir = resolve(ROOT, "zips");
  if (existsSync(zipsDir)) {
    const zipFiles = await readdir(zipsDir);
    await mkdir(resolve(DIST, "zips"), { recursive: true });
    for (const file of zipFiles) {
      await copyFile(resolve(zipsDir, file), resolve(DIST, "zips", file));
    }
    console.log(`Copied ${zipFiles.length} zip(s) → dist/zips/`);
  } else {
    console.log("No zips/ directory — skipping zip copy.");
  }

  // Copy static assets (e.g. the brand logo) into the site root.
  const assetsDir = resolve(ROOT, "assets");
  for (const file of await readdir(assetsDir)) {
    await copyFile(resolve(assetsDir, file), resolve(DIST, file));
  }
  console.log(`Copied ${(await readdir(assetsDir)).length} asset(s) → dist/`);

  let built = 0;
  for (const locale of LOCALES) {
    const searchIndex = [];
    for (const page of PAGES) {
      let md;
      let translated = false;
      if (locale.code === "en") {
        md = await readFile(resolve(ROOT, page.src), "utf8");
      } else {
        const localizedPath = resolve(ROOT, "i18n", locale.path, page.src);
        try {
          md = await readFile(localizedPath, "utf8");
          translated = true;
        } catch {
          md = await readFile(resolve(ROOT, page.src), "utf8");
        }
      }

      const isHome = page.out === "index.html";
      const { title: mdTitle, description } = extractMeta(md);
      const title = isHome ? ui(locale, "Documentation") : mdTitle ?? ui(locale, page.label);
      const url = pageUrl(page, locale);
      const englishUrl = pageUrl(page, LOCALES[0]);
      const alternates = LOCALES.map((option) => ({
        code: option.code,
        hreflang: option.code,
        label: option.label,
        url: pageUrl(page, option),
      }));

      pageHeadings = [];
      usedIds = new Map();
      let rendered = await marked.parse(md);
      // The paragraph under the title reads as its summary.
      rendered = rendered.replace(/(<\/h1>\s*)<p>/, '$1<p class="lede">');
      if (isHome) rendered = rendered.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1${homeCardsHTML(locale)}`);
      const linked = decorateCode(rewriteLinks(rendered, page.src, locale), locale);

      const navItem = NAV_ORDER.find((item) => (item.href === "/" ? `${localePrefix(locale)}/` : `${localePrefix(locale)}${item.href}`) === url);
      const eyebrow = !isHome && navItem ? ui(locale, navItem.group) : "";

      const html = pageHTML({
        title,
        description,
        html: linked,
        toc: tocHTML(pageHeadings, locale),
        pager: pagerHTML(url, locale),
        eyebrow,
        currentUrl: url,
        locale,
        alternates,
        englishUrl,
        translated,
        isHome,
      });

      const out = resolve(DIST, locale.path, page.out);
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, html);
      built += 1;

      // Search: the page itself, then each of its h2/h3 sections.
      const group = navItem ? ui(locale, navItem.group) : "";
      searchIndex.push({ t: title, s: group, h: "", u: url, x: description });
      const secs = sections(md);
      pageHeadings.forEach((heading, i) => {
        if (heading.depth !== 2 && heading.depth !== 3) return;
        const text = plainText((secs[i]?.lines ?? []).join("\n")).slice(0, 360);
        searchIndex.push({ t: title, s: group, h: heading.text, u: `${url}#${heading.id}`, x: text });
      });
    }
    await mkdir(resolve(DIST, locale.path), { recursive: true });
    await writeFile(resolve(DIST, locale.path, "search-index.json"), JSON.stringify(searchIndex));
    console.log(`  built ${PAGES.length} pages and a ${searchIndex.length}-entry search index for ${locale.code}`);
  }

  await writeFile(
    resolve(DIST, "robots.txt"),
    "User-agent: *\nAllow: /\n\nSitemap: " + BASE_URL + "/sitemap.xml\n",
  );

  const urls = LOCALES.flatMap((locale) =>
    PAGES.map((p) => `  <url><loc>${BASE_URL}${pageUrl(p, locale)}</loc></url>`),
  ).join("\n");
  await writeFile(
    resolve(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );

  console.log(`\nBuilt ${built} page(s) into dist/`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
