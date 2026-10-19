# Disband Docs

The source for the **Disband documentation website** — [docs.disband.dev](https://docs.disband.dev).

This folder is deliberately separate from the Disband application repository so
the docs can be reviewed, versioned, and deployed on their own schedule. Content
is written in Markdown and built into a self-contained static site.

## Contents

```
disband-docs/
├── index.md                       → docs home (/)
├── bots/
│   ├── index.md                   → /docs/bots/          (overview, scopes, limits)
│   ├── getting-started.md         → /docs/bots/getting-started/
│   ├── hosting-your-own-bot.md    → /docs/bots/hosting-your-own-bot/
│   ├── clients/javascript.md      → /docs/bots/clients/javascript/
│   ├── clients/python.md          → /docs/bots/clients/python/
│   └── api-reference.md           → /docs/bots/api-reference/
├── themes/
│   └── index.md                   → /docs/themes/
├── scripts/
│   ├── build.mjs                  → static site generator (marked + highlight.js)
│   └── dev-server.mjs             → local preview server
├── zips/                          → dependency zips, copied into dist/
└── dist/                          → generated site (do not hand-edit)
```

## Build and preview

```bash
npm run build    # renders markdown → dist/ (self-contained HTML, no CDN)
npm run dev      # preview at http://localhost:3210
```

The build needs no network: marked, highlight.js, and its theme are bundled into
the output HTML, and the client-library zips are copied through to `dist/zips/`.

## URL scheme

- `index.md` at the root becomes `/`.
- Every other Markdown file becomes a directory under `/docs/` mirroring its
  source path, e.g. `bots/getting-started.md` → `/docs/bots/getting-started/`.
- Relative `foo.md` links are resolved against the page's source directory and
  rewritten to the target page's absolute URL, so links work from any directory.

## Updating

1. Edit the Markdown in this folder.
2. `npm run build` and review `dist/` (or `npm run dev`).
3. Deploy `dist/` to the site host.

## Deploying

`docs.disband.dev` is a subdomain of `disband.dev`, whose DNS is on Cloudflare.
Either host works:

- **Cloudflare Pages** — `npx wrangler pages deploy dist --project-name disband-docs`,
  then attach `docs.disband.dev` as a custom domain. Fits the existing infra
  (cdn.disband.dev is already a Cloudflare Worker in the same zone).
- **Vercel** — add the static `dist/` as a project and attach the `docs.disband.dev`
  domain.

The output is plain static HTML, so any static host will do.