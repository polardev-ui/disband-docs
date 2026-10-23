// Builds the Disband docs website: markdown in this repo → static HTML in dist/.
//
//   npm run build
//
// The on-disk URL scheme is:
//   index.md                      →  /
//   bots/index.md                 →  /docs/bots/
//   bots/getting-started.md       →  /docs/bots/getting-started/
//   bots/hosting-your-own-bot.md  →  /docs/bots/hosting-your-own-bot/
//   bots/clients/javascript.md    →  /docs/bots/clients/javascript/
//   bots/clients/python.md        →  /docs/bots/clients/python/
//   bots/api-reference.md         →  /docs/bots/api-reference/
//   developers/webhooks.md        →  /docs/developers/webhooks/
//   developers/embeds.md          →  /docs/developers/embeds/
//   developers/status.md          →  /docs/developers/status/
//   themes/index.md               →  /docs/themes/
//
// Relative `foo.md` links are resolved per page and rewritten to the real
// absolute URL of the target page, so links work whatever directory the page
// is served from. dist/zips/* is copied through so download links work.

import { rm, mkdir, copyFile, readFile, writeFile, readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/common";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://docs.disband.dev";

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
  { src: "index.md",                    out: "index.html",                      label: "Docs home" },
  { src: "bots/index.md",               out: "docs/bots/index.html",            label: "Overview" },
  { src: "bots/getting-started.md",     out: "docs/bots/getting-started/index.html",  label: "Getting started" },
  { src: "bots/hosting-your-own-bot.md",out: "docs/bots/hosting-your-own-bot/index.html", label: "Hosting your own bot" },
  { src: "bots/clients/javascript.md",  out: "docs/bots/clients/javascript/index.html",  label: "JavaScript" },
  { src: "bots/clients/python.md",      out: "docs/bots/clients/python/index.html",      label: "Python" },
  { src: "bots/api-reference.md",       out: "docs/bots/api-reference/index.html",       label: "API reference" },
  { src: "bots/templates.md",          out: "docs/bots/templates/index.html",          label: "Templates" },
  { src: "themes/index.md",             out: "docs/themes/index.html",         label: "Themes" },
  { src: "developers/index.md",         out: "docs/developers/index.html",     label: "Developers" },
  { src: "developers/webhooks.md",      out: "docs/developers/webhooks/index.html",      label: "Webhooks" },
  { src: "developers/embeds.md",        out: "docs/developers/embeds/index.html",        label: "Embeds" },
  { src: "developers/status.md",        out: "docs/developers/status/index.html",        label: "Status system" },
];

const NAV = [
  {
    label: "Bots",
    items: [
      { href: "/docs/bots/", label: "Overview" },
      { href: "/docs/bots/getting-started/", label: "Getting started" },
      { href: "/docs/bots/hosting-your-own-bot/", label: "Hosting your own bot" },
      { href: "/docs/bots/clients/javascript/", label: "JavaScript" },
      { href: "/docs/bots/clients/python/", label: "Python" },
      { href: "/docs/bots/api-reference/", label: "API reference" },
      { href: "/docs/bots/templates/", label: "Templates" },
    ],
  },
  { label: "Themes", items: [{ href: "/docs/themes/", label: "Themes" }] },
  {
    label: "Developers",
    items: [
      { href: "/docs/developers/", label: "Developers" },
      { href: "/docs/developers/webhooks/", label: "Webhooks" },
      { href: "/docs/developers/embeds/", label: "Embeds" },
      { href: "/docs/developers/status/", label: "Status system" },
      { href: "/docs/bots/", label: "Bots" },
      { href: "/docs/bots/getting-started/", label: "Getting started" },
      { href: "/docs/bots/api-reference/", label: "API reference" },
      { href: "/docs/bots/templates/", label: "Templates" },
    ],
  },
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

const renderer = {
  heading({ tokens, depth, text }) {
    const id = slugify(text);
    return `<h${depth} id="${id}"><a href="#${id}" class="anchor" aria-hidden="true">#</a>${text}</h${depth}>`;
  },
  link({ href, title, text }) {
    const safeTitle = title ? ` title="${title}"` : "";
    const external = href.startsWith("http");
    if (external) {
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

function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractMeta(md) {
  const titleMatch = md.match(/^# (.+)$/m);
  const firstParagraph = md
    .split(/\n\s*\n/)
    .find((p) => !p.startsWith("#") && !p.startsWith("```") && p.trim().length > 0);
  const description = firstParagraph
    ? firstParagraph.replace(/[*_`#>[\]()]/g, "").slice(0, 160)
    : "The Disband documentation.";
  return { title: titleMatch ? titleMatch[1].trim() : undefined, description };
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
    if (path.startsWith("/")) return _m;
    // Strip leading ./ and resolve against the current source directory.
    const resolved = posix.normalize(posix.join(fromDir, path));
    const url = srcToUrl(resolved, locale);
    return `href="${url}${hash ? hash : ""}"`;
  });
}

function navHTML(currentUrl, locale) {
  const prefix = localePrefix(locale);
  const homeUrl = `${prefix}/`;
  const home = `<a href="${homeUrl}" class="${currentUrl === homeUrl ? "active nav-home-link" : "nav-home-link"}">${ui(locale, "Docs home")}</a>`;
  const groups = NAV.map((group) => {
    const items = group.items
      .map((item) => {
        const href = `${prefix}${item.href}`;
        return `<a href="${href}" class="${href === currentUrl ? "active" : ""}">${ui(locale, item.label)}</a>`;
      })
      .join("");
    return `<div class="nav-group"><p class="nav-label">${ui(locale, group.label)}</p>${items}</div>`;
  }).join("");
  return `<nav class="sidebar-nav">${home}${groups}</nav>`;
}

const HLJS_THEME = readFileSync(
  resolve(ROOT, "node_modules", "highlight.js", "styles", "github-dark.min.css"),
  "utf8",
);

const STYLES = `
:root {
  --bg-primary: #0f1012;
  --bg-secondary: #17181b;
  --bg-tertiary: #1e1f22;
  --brand: #5865f2;
  --brand-hover: #4752c4;
  --text-normal: #dbdee1;
  --text-muted: #9aa3ab;
  --text-bright: #f2f3f5;
  --divider: #2f3136;
  --code-bg: #15161a;
  --link: #7c9cff;
  --sidebar-w: 248px;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
body {
  margin: 0;
  background: var(--bg-primary);
  color: var(--text-normal);
  font: 15px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }

.site-header {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  height: 60px; padding: 0 24px;
  background: rgba(15,16,18,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--divider);
}
.site-logo { width: auto; height: 28px; margin-right: 10px; display: inline-block; vertical-align: -6px; }
.wordmark { font-weight: 700; color: var(--text-bright); font-size: 16px; letter-spacing: 0.2px; text-decoration: none; display: inline-flex; align-items: center; }
.wordmark:hover { text-decoration: none; }
.wordmark span { color: var(--brand); margin-left: 2px; }
.header-links { display: flex; align-items: center; gap: 20px; font-size: 13.5px; }
.header-links a { color: var(--text-muted); text-decoration: none; }
.header-links a:hover { color: var(--text-bright); }
.lang-select {
  appearance: none;
  border: 1px solid var(--divider);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-normal);
  font: inherit;
  font-size: 12.5px;
  padding: 6px 28px 6px 10px;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%), linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position: calc(100% - 13px) 52%, calc(100% - 9px) 52%;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
}
.lang-select:hover { border-color: var(--text-muted); }
.lang-select:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.translation-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 28px;
  border: 1px solid rgba(88, 101, 242, 0.35);
  background: rgba(88, 101, 242, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.5;
}
.translation-note strong { color: var(--text-normal); font-weight: 600; }
.translation-note a { color: var(--link); white-space: nowrap; }

.layout {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  min-height: calc(100vh - 60px);
}
.sidebar {
  padding: 24px 16px;
  border-right: 1px solid var(--divider);
  background: var(--bg-secondary);
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}
.sidebar-nav { display: flex; flex-direction: column; gap: 20px; }
.sidebar-nav a {
  display: block; padding: 7px 12px; border-radius: 6px;
  color: var(--text-muted); font-size: 13.5px; transition: background 0.12s, color 0.12s;
}
.nav-home-link { font-weight: 600; color: var(--text-normal) !important; }
.sidebar-nav a:hover { background: var(--bg-tertiary); color: var(--text-normal); text-decoration: none; }
.sidebar-nav a.active { background: var(--brand); color: #fff !important; }
.nav-group .nav-label {
  margin: 0 0 6px; padding: 0 12px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--text-muted);
}

main.content {
  max-width: 820px; width: 100%;
  margin: 0 auto; padding: 56px 40px 80px;
}
.content h1 {
  margin: 0 0 10px; font-size: 34px; font-weight: 700; color: var(--text-bright);
  letter-spacing: -0.5px; line-height: 1.15;
}
.content .lede { color: var(--text-muted); font-size: 17px; margin: 0 0 32px; max-width: 640px; line-height: 1.5; }
.content h2 { margin: 44px 0 12px; font-size: 22px; font-weight: 700; color: var(--text-bright); letter-spacing: -0.2px; }
.content h3 { margin: 30px 0 8px; font-size: 17px; font-weight: 700; color: var(--text-bright); }
.content p { margin: 12px 0; }
.content ul, .content ol { margin: 12px 0; padding-left: 24px; }
.content li { margin: 6px 0; }
.content strong { color: var(--text-bright); }
.content code:not(.hljs) {
  background: var(--code-bg); border: 1px solid var(--divider);
  border-radius: 5px; padding: 2px 6px;
  font: 12.5px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: #9aa9f0;
}
.content pre { margin: 16px 0; border-radius: 10px; overflow: auto; border: 1px solid var(--divider); }
.content pre code.hljs { padding: 16px 18px; border: none; }
.table-wrap { overflow-x: auto; margin: 16px 0; border: 1px solid var(--divider); border-radius: 10px; }
.content table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
.content thead th {
  text-align: left; padding: 10px 14px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--text-muted); background: var(--bg-tertiary); border-bottom: 1px solid var(--divider);
}
.content td { padding: 10px 14px; border-bottom: 1px solid var(--divider); vertical-align: top; }
.content tbody tr:last-child td { border-bottom: none; }
.content td code:not(.hljs) { white-space: nowrap; }
.content a.anchor { color: var(--text-muted); opacity: 0; margin-right: 6px; text-decoration: none; }
.content h1:hover a.anchor, .content h2:hover a.anchor, .content h3:hover a.anchor { opacity: 1; }
.content hr { border: none; border-top: 1px solid var(--divider); margin: 32px 0; }

.site-footer {
  border-top: 1px solid var(--divider);
  padding: 20px 24px; text-align: center;
  font-size: 12.5px; color: var(--text-muted);
}
.site-footer a { color: var(--text-muted); }
.site-footer a:hover { color: var(--text-bright); }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  main.content { padding: 32px 20px 64px; }
  .header-links { display: none; }
}

${HLJS_THEME}
`;

function pageHTML({ title, description, html, currentUrl, locale, alternates, englishUrl, translated }) {
  const canonical = BASE_URL + currentUrl;
  const docLabel = ui(locale, "Disband Docs");
  const prefix = localePrefix(locale);
  const isHome = currentUrl === `${prefix}/`;
  const fullTitle =
    isHome && locale.code !== "en"
      ? docLabel
      : title === docLabel
        ? title
        : `${title} — ${docLabel}`;
  const languageLabel = ui(locale, "Language");
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
      : `<div class="translation-note"><strong>${ui(locale, "Automatic translation")}</strong><span>${ui(
          locale,
          "This page was translated automatically. The English original is the source of truth.",
        )}</span><a href="${englishUrl}">${ui(locale, "Read this page in English")}</a></div>`;
  return `<!doctype html>
<html lang="${locale.code}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${fullTitle}</title>
<meta name="description" content="${escapeHTML(description)}" />
<link rel="canonical" href="${canonical}" />
${altTags}
<meta property="og:title" content="${fullTitle}" />
<meta property="og:description" content="${escapeHTML(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="${locale.code.replace("-", "_")}" />
<meta name="twitter:card" content="summary" />
<style>${STYLES}</style>
</head>
<body>
<header class="site-header">
  <a class="wordmark" href="${homeUrl}"><img class="site-logo" src="/logo.png" alt="Disband" width="500" height="500" />Disband<span>Docs</span></a>
  <div class="header-links">
    <label class="sr-only" for="language-select">${languageLabel}</label>
    <select id="language-select" class="lang-select" aria-label="${languageLabel}" onchange="if(this.value) location.href=this.value">
      ${options}
    </select>
    <a href="https://www.disband.dev">disband.dev</a>
  </div>
</header>
<div class="layout">
  <aside class="sidebar">${navHTML(currentUrl, locale)}</aside>
  <main class="content">
    ${banner}
    ${html}
  </main>
</div>
<footer class="site-footer">
  © ${new Date().getFullYear()} Disband · <a href="https://www.disband.dev">disband.dev</a> ·
  <a href="https://www.disband.dev/privacy">${ui(locale, "Privacy")}</a> ·
  <a href="https://www.disband.dev/terms">${ui(locale, "Terms")}</a>
</footer>
</body>
</html>`;
}

async function build() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await mkdir(resolve(DIST, "zips"), { recursive: true });

  const zipsDir = resolve(ROOT, "zips");
  const zipFiles = await readdir(zipsDir);
  for (const file of zipFiles) {
    await copyFile(resolve(zipsDir, file), resolve(DIST, "zips", file));
  }
  console.log(`Copied ${zipFiles.length} zip(s) → dist/zips/`);

  // Copy static assets (e.g. the brand logo) into the site root.
  const assetsDir = resolve(ROOT, "assets");
  for (const file of await readdir(assetsDir)) {
    await copyFile(resolve(assetsDir, file), resolve(DIST, file));
  }
  console.log(`Copied ${(await readdir(assetsDir)).length} asset(s) → dist/`);

  let built = 0;
  for (const locale of LOCALES) {
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
          console.warn(`  missing translation ${locale.code}/${page.src}; using English`);
          md = await readFile(resolve(ROOT, page.src), "utf8");
        }
      }

      const { title: mdTitle, description } = extractMeta(md);
      const title =
        page.out === "index.html" ? ui(locale, "Documentation") : mdTitle ?? ui(locale, page.label);
      const url = pageUrl(page, locale);
      const englishUrl = pageUrl(page, LOCALES[0]);
      const alternates = LOCALES.map((option) => ({
        code: option.code,
        hreflang: option.code,
        label: option.label,
        url: pageUrl(page, option),
      }));
      const rendered = await marked.parse(md);
      const linked = rewriteLinks(rendered, page.src, locale);
      const html = pageHTML({
        title,
        description,
        html: linked,
        currentUrl: url,
        locale,
        alternates,
        englishUrl,
        translated,
      });

      const out = resolve(DIST, locale.path, page.out);
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, html);
      built += 1;
      console.log(`  built ${locale.code}/${page.src}  →  ${url}`);
    }
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