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

const PAGES = [
  { src: "index.md",                    out: "index.html",                      label: "Docs home" },
  { src: "bots/index.md",               out: "docs/bots/index.html",            label: "Overview" },
  { src: "bots/getting-started.md",     out: "docs/bots/getting-started/index.html",  label: "Getting started" },
  { src: "bots/hosting-your-own-bot.md",out: "docs/bots/hosting-your-own-bot/index.html", label: "Hosting your own bot" },
  { src: "bots/clients/javascript.md",  out: "docs/bots/clients/javascript/index.html",  label: "JavaScript" },
  { src: "bots/clients/python.md",      out: "docs/bots/clients/python/index.html",      label: "Python" },
  { src: "bots/api-reference.md",       out: "docs/bots/api-reference/index.html",       label: "API reference" },
  { src: "themes/index.md",             out: "docs/themes/index.html",         label: "Themes" },
  { src: "developers/index.md",         out: "docs/developers/index.html",     label: "Developers" },
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
    ],
  },
  { label: "Themes", items: [{ href: "/docs/themes/", label: "Themes" }] },
  {
    label: "Developers",
    items: [
      { href: "/docs/developers/", label: "Developers" },
      { href: "/docs/bots/", label: "Bots" },
      { href: "/docs/bots/getting-started/", label: "Getting started" },
      { href: "/docs/bots/api-reference/", label: "API reference" },
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
    .replace(/[^a-z0-9\s-]/g, "")
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

// Absolute URL for a source markdown file. "index.md" at the root is the home
// page; anything else lives under /docs/ mirroring the source directory.
function srcToUrl(srcPath) {
  if (srcPath === "index.md") return "/";
  if (srcPath.endsWith("/index.md")) return "/docs/" + posix.dirname(srcPath) + "/";
  return "/docs/" + srcPath.replace(/\.md$/, "") + "/";
}

function pageUrl(page) {
  if (page.out === "index.html") return "/";
  return "/" + posix.dirname(page.out) + "/";
}

// Rewrites relative link targets in rendered HTML. `foo.md` (and `foo.md#sec`)
// are resolved against the current page's source directory so relative links
// turn into the correct absolute URL for the target page.
function rewriteLinks(html, currentSrc) {
  const fromDir = posix.dirname(currentSrc);
  return html.replace(/href="([^"]+?\.md)(#[\w-]+)?"/g, (_m, path, hash) => {
    if (path.startsWith("/")) return _m;
    // Strip leading ./ and resolve against the current source directory.
    const resolved = posix.normalize(posix.join(fromDir, path));
    const url = srcToUrl(resolved);
    return `href="${url}${hash ? hash : ""}"`;
  });
}

function navHTML(currentUrl) {
  const home = `<a href="/" class="${currentUrl === "/" ? "active nav-home-link" : "nav-home-link"}">Docs home</a>`;
  const groups = NAV.map((group) => {
    const items = group.items
      .map(
        (item) =>
          `<a href="${item.href}" class="${item.href === currentUrl ? "active" : ""}">${item.label}</a>`,
      )
      .join("");
    return `<div class="nav-group"><p class="nav-label">${group.label}</p>${items}</div>`;
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
.header-links { display: flex; gap: 20px; font-size: 13.5px; }
.header-links a { color: var(--text-muted); text-decoration: none; }
.header-links a:hover { color: var(--text-bright); }

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

function pageHTML({ title, description, html, currentUrl }) {
  const canonical = BASE_URL + currentUrl;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Disband Docs</title>
<meta name="description" content="${escapeHTML(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${title} — Disband Docs" />
<meta property="og:description" content="${escapeHTML(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary" />
<style>${STYLES}</style>
</head>
<body>
<header class="site-header">
  <a class="wordmark" href="/"><img class="site-logo" src="/logo.png" alt="Disband" width="500" height="500" />Disband<span>Docs</span></a>
  <div class="header-links">
    <a href="https://www.disband.dev">disband.dev</a>
  </div>
</header>
<div class="layout">
  <aside class="sidebar">${navHTML(currentUrl)}</aside>
  <main class="content">
    ${html}
  </main>
</div>
<footer class="site-footer">
  © ${new Date().getFullYear()} Disband · <a href="https://www.disband.dev">disband.dev</a> ·
  <a href="https://www.disband.dev/privacy">Privacy</a> ·
  <a href="https://www.disband.dev/terms">Terms</a>
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

  for (const page of PAGES) {
    const md = await readFile(resolve(ROOT, page.src), "utf8");
    const { title: mdTitle, description } = extractMeta(md);
    const title = page.out === "index.html" ? "Docs" : mdTitle ?? page.label;
    const url = pageUrl(page);
    const rendered = await marked.parse(md);
    const linked = rewriteLinks(rendered, page.src);
    const html = pageHTML({ title, description, html: linked, currentUrl: url });

    const out = resolve(DIST, page.out);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, html);
    console.log(`  built ${page.src}  →  ${url}`);
  }

  await writeFile(
    resolve(DIST, "robots.txt"),
    "User-agent: *\nAllow: /\n\nSitemap: " + BASE_URL + "/sitemap.xml\n",
  );

  const urls = PAGES.map((p) => `  <url><loc>${BASE_URL}${pageUrl(p)}</loc></url>`).join("\n");
  await writeFile(
    resolve(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );

  console.log(`\nBuilt ${PAGES.length} page(s) into dist/`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});