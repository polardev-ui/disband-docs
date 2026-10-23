#!/usr/bin/env python3
"""Generate the localized Markdown sources for docs.disband.dev.

Apple's on-device Translation framework is used through scripts/translate.swift.
The script protects fenced code, inline code, URLs and product/API names with
tokens first, so translation only touches prose. Tables and lists are sent as
single blocks so short labels keep their context; paragraph breaks inserted by
TranslationSession are collapsed when the page is rendered.

    python3 scripts/translate-docs.py

The generated files live in i18n/<locale>/ and are committed so `npm run build`
never needs network access or macOS translation packs.
"""

from __future__ import annotations

import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = [
    "index.md",
    "bots/index.md",
    "bots/getting-started.md",
    "bots/hosting-your-own-bot.md",
    "bots/clients/javascript.md",
    "bots/clients/python.md",
    "bots/api-reference.md",
    "bots/templates.md",
    "themes/index.md",
    "developers/index.md",
    "developers/webhooks.md",
    "developers/embeds.md",
    "developers/status.md",
]

LOCALES = {
    "es": {"target": "es", "path": "es"},
    "fr": {"target": "fr", "path": "fr"},
    "de": {"target": "de", "path": "de"},
    "pt-BR": {"target": "pt-BR", "path": "pt-br"},
    "ja": {"target": "ja", "path": "ja"},
    "ko": {"target": "ko", "path": "ko"},
    "zh-CN": {"target": "zh-Hans", "path": "zh-cn"},
}

# Page titles are short enough that a glossary is both faster and more reliable
# than machine translation. The first H1 is replaced with these after rendering.
TITLES: dict[str, dict[str, str]] = {
    "es": {
        "index.md": "Documentación de Disband",
        "bots/index.md": "Bots",
        "bots/getting-started.md": "Primeros pasos: tu primer bot",
        "bots/hosting-your-own-bot.md": "Aloja tu propio bot",
        "bots/clients/javascript.md": "Cliente JavaScript — `@disband/bot`",
        "bots/clients/python.md": "Cliente Python — `disband-bot`",
        "bots/api-reference.md": "Referencia de la API de bots",
        "bots/templates.md": "Plantillas de bots",
        "themes/index.md": "Temas",
        "developers/index.md": "Desarrolladores",
        "developers/webhooks.md": "Webhooks",
        "developers/embeds.md": "Embeds",
        "developers/status.md": "Estado del sistema",
    },
    "fr": {
        "index.md": "Documentation de Disband",
        "bots/index.md": "Bots",
        "bots/getting-started.md": "Premiers pas : votre premier bot",
        "bots/hosting-your-own-bot.md": "Héberger votre propre bot",
        "bots/clients/javascript.md": "Client JavaScript — `@disband/bot`",
        "bots/clients/python.md": "Client Python — `disband-bot`",
        "bots/api-reference.md": "Référence de l’API des bots",
        "bots/templates.md": "Modèles de bots",
        "themes/index.md": "Thèmes",
        "developers/index.md": "Développeurs",
        "developers/webhooks.md": "Webhooks",
        "developers/embeds.md": "Embeds",
        "developers/status.md": "État du système",
    },
    "de": {
        "index.md": "Disband-Dokumentation",
        "bots/index.md": "Bots",
        "bots/getting-started.md": "Erste Schritte: Ihr erster Bot",
        "bots/hosting-your-own-bot.md": "Eigenen Bot hosten",
        "bots/clients/javascript.md": "JavaScript-Client — `@disband/bot`",
        "bots/clients/python.md": "Python-Client — `disband-bot`",
        "bots/api-reference.md": "Bot-API-Referenz",
        "bots/templates.md": "Bot-Vorlagen",
        "themes/index.md": "Themen",
        "developers/index.md": "Entwickler",
        "developers/webhooks.md": "Webhooks",
        "developers/embeds.md": "Einbettungen",
        "developers/status.md": "Statusseite",
    },
    "pt-BR": {
        "index.md": "Documentação do Disband",
        "bots/index.md": "Bots",
        "bots/getting-started.md": "Primeiros passos: seu primeiro bot",
        "bots/hosting-your-own-bot.md": "Hospede seu próprio bot",
        "bots/clients/javascript.md": "Cliente JavaScript — `@disband/bot`",
        "bots/clients/python.md": "Cliente Python — `disband-bot`",
        "bots/api-reference.md": "Referência da API de bots",
        "bots/templates.md": "Modelos de bots",
        "themes/index.md": "Temas",
        "developers/index.md": "Desenvolvedores",
        "developers/webhooks.md": "Webhooks",
        "developers/embeds.md": "Embeds",
        "developers/status.md": "Sistema de status",
    },
    "ja": {
        "index.md": "Disband ドキュメント",
        "bots/index.md": "ボット",
        "bots/getting-started.md": "はじめに: 最初のボット",
        "bots/hosting-your-own-bot.md": "独自のボットをホストする",
        "bots/clients/javascript.md": "JavaScript クライアント — `@disband/bot`",
        "bots/clients/python.md": "Python クライアント — `disband-bot`",
        "bots/api-reference.md": "ボット API リファレンス",
        "bots/templates.md": "ボットテンプレート",
        "themes/index.md": "テーマ",
        "developers/index.md": "開発者",
        "developers/webhooks.md": "Webhook",
        "developers/embeds.md": "埋め込み",
        "developers/status.md": "ステータスシステム",
    },
    "ko": {
        "index.md": "Disband 문서",
        "bots/index.md": "봇",
        "bots/getting-started.md": "시작하기: 첫 번째 봇",
        "bots/hosting-your-own-bot.md": "나만의 봇 호스팅",
        "bots/clients/javascript.md": "JavaScript 클라이언트 — `@disband/bot`",
        "bots/clients/python.md": "Python 클라이언트 — `disband-bot`",
        "bots/api-reference.md": "봇 API 참조",
        "bots/templates.md": "봇 템플릿",
        "themes/index.md": "테마",
        "developers/index.md": "개발자",
        "developers/webhooks.md": "웹훅",
        "developers/embeds.md": "임베드",
        "developers/status.md": "상태 시스템",
    },
    "zh-CN": {
        "index.md": "Disband 文档",
        "bots/index.md": "机器人",
        "bots/getting-started.md": "开始使用：你的第一个机器人",
        "bots/hosting-your-own-bot.md": "托管你自己的机器人",
        "bots/clients/javascript.md": "JavaScript 客户端 — `@disband/bot`",
        "bots/clients/python.md": "Python 客户端 — `disband-bot`",
        "bots/api-reference.md": "机器人 API 参考",
        "bots/templates.md": "机器人模板",
        "themes/index.md": "主题",
        "developers/index.md": "开发者",
        "developers/webhooks.md": "Webhook",
        "developers/embeds.md": "嵌入",
        "developers/status.md": "状态系统",
    },
}


PAGE_LABEL_KEYS = {
    "index.md": "Docs home",
    "bots/index.md": "Bots",
    "bots/getting-started.md": "Getting started",
    "bots/hosting-your-own-bot.md": "Hosting your own bot",
    "bots/clients/javascript.md": "JavaScript",
    "bots/clients/python.md": "Python",
    "bots/api-reference.md": "API reference",
    "bots/templates.md": "Templates",
    "themes/index.md": "Themes",
    "developers/index.md": "Developers",
    "developers/webhooks.md": "Webhooks",
    "developers/embeds.md": "Embeds",
    "developers/status.md": "Status system",
}


def localize_link_labels(markdown: str, src: str, ui: dict[str, str]) -> str:
    """Use the shared navigation glossary for links between docs pages."""
    in_code = False
    out: list[str] = []
    for line in markdown.splitlines(keepends=True):
        if line.lstrip().startswith("```"):
            in_code = not in_code
            out.append(line)
            continue
        if in_code:
            out.append(line)
            continue

        def replace(match: re.Match[str]) -> str:
            if match.start() > 0 and line[match.start() - 1] == "!":
                return match.group(0)
            target = match.group(2).strip()
            if target.startswith("<") and target.endswith(">"):
                target = target[1:-1]
            path = target.split("#", 1)[0]
            if not path.endswith(".md") or path.startswith(("http://", "https://", "mailto:")):
                return match.group(0)
            resolved = posixpath.normpath(posixpath.join(posixpath.dirname(src), path))
            key = PAGE_LABEL_KEYS.get(resolved)
            label = ui.get(key) if key else None
            if not label:
                return match.group(0)
            return f"[{label}]({match.group(2)})"

        out.append(re.sub(r"\[([^\]]*)\]\(([^)]+)\)", replace, line))
    return "".join(out)


def apply_title(markdown: str, locale: str, src: str) -> str:
    title = TITLES.get(locale, {}).get(src)
    if not title or not markdown.startswith("# "):
        return markdown
    first_newline = markdown.find("\n")
    if first_newline < 0:
        return f"# {title}\n"
    return f"# {title}" + markdown[first_newline:]

# Names that must survive translation exactly. Longer entries win.
TERMS = [
    "Disband Docs",
    "Disband",
    "SUPER",
    "WebRTC",
    "JavaScript",
    "Python",
    "Node.js",
    "Deno",
    "Bun",
    "GitHub",
    "Discord",
    "Stripe",
    "HTTP API",
    "HTTP",
    "API",
    "CSS",
    "JSON",
    "SDK",
    "OAuth",
    "Webhooks",
    "Webhook",
    "CLI",
    "URLs",
    "URL",
    "IDs",
    "ID",
    "VS Code",
    "macOS",
    "Windows",
    "Linux",
    "iOS",
    "Android",
    "Docker",
    "systemd",
    "PM2",
    "npm",
    "pip",
    "Node",
    "WebSockets",
    "WebSocket",
    "Markdown",
    "HTML",
    "REST",
    "HMAC",
    "SHA-256",
    "Base64",
    "UTC",
    "ISO 8601",
    "CSV",
    "PNG",
    "JPEG",
    "SVG",
    "GIF",
    "Last.fm",
    "Spotify",
    "SoundCloud",
    "Tauri",
]

_TARGET_LABEL = {"Disband Docs": "Disband Docs", "Disband": "Disband"}


class PageBuilder:
    def __init__(self, locale: str, ui: dict[str, str], page_id: str = "") -> None:
        self.locale = locale
        self.ui = ui
        self.page_id = page_id
        self.parts: list[str | tuple[str, str]] = []
        self.jobs: list[dict[str, str]] = []
        self.job_kinds: dict[str, str] = {}
        self.tokens: dict[str, str] = {}
        self.counter = 0

    def token(self, replacement: str) -> str:
        existing = next((key for key, value in self.tokens.items() if value == replacement), None)
        if existing:
            return existing
        value = f"ZXQTOKEN{self.counter:04d}QXZ"
        self.counter += 1
        self.tokens[value] = replacement
        return value

    def protect(self, text: str) -> str:
        def inline(match: re.Match[str]) -> str:
            return self.token(match.group(0))

        text = re.sub(r"`[^`\n]*`", inline, text)
        text = re.sub(r"(?<![\w])https?://[^\s)>\]]+", inline, text)
        # Relative Markdown targets are code, not prose. Some languages
        # otherwise translate "developers/status.md" into localized path
        # segments and break the link.
        text = re.sub(
            r"\]\((?!https?://)([^)\s]+\.md(?:#[^)\s]+)?)\)",
            lambda match: "](" + self.token(match.group(1)) + ")",
            text,
        )

        for term in TERMS:
            replacement = term
            if term == "Disband Docs":
                replacement = self.ui.get("Disband Docs", term)
            elif term == "Disband":
                replacement = "Disband"
            pattern = r"(?<![A-Za-z0-9_])" + re.escape(term) + r"(?![A-Za-z0-9_])"
            text = re.sub(pattern, lambda _m, r=replacement: self.token(r), text)
        return text

    def add_job(self, text: str, kind: str = "text") -> None:
        text = self.protect(text)
        if not text.strip():
            self.parts.append(text)
            return
        job_id = f"{self.locale}:{self.page_id}:{len(self.jobs)}"
        self.jobs.append({"id": job_id, "target": self.locale, "text": text})
        self.job_kinds[job_id] = kind
        self.parts.append((job_id, text))

    def literal(self, text: str) -> None:
        self.parts.append(text)

    @staticmethod
    def normalize_block(kind: str, text: str) -> str:
        if kind == "list":
            # TranslationSession inserts paragraph breaks between list items,
            # sometimes indents later items, and can drop the space after the
            # bullet. Docs lists are flat tight lists, so rebuild every marker
            # at the base indentation and keep wrapped text inside the item.
            lines = [line.rstrip() for line in text.strip().splitlines() if line.strip()]
            parsed: list[tuple[str, int, str, str]] = []
            for line in lines:
                # Translation can turn a wrapped **bold** continuation into
                # "* *bold**". That is not a bullet; it is the tail of the
                # previous item with a split bold marker.
                broken_bold = re.match(r"^\s*\*\s+\*(?!\*)(.*)$", line)
                if broken_bold:
                    parsed.append(("text", 0, "", "**" + broken_bold.group(1)))
                    continue
                marker = re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", line)
                if not marker:
                    # CJK translations sometimes lose the space after the
                    # bullet ("-無効"). Only repair that for CJK text so a
                    # continuation like "-H" is not mistaken for an item.
                    marker = re.match(
                        r"^(\s*)([-*+]|\d+\.)([\u3000-\u9fff\uac00-\ud7af\uff00-\uffef].*)$",
                        line,
                    )
                if marker:
                    parsed.append(
                        ("item", len(marker.group(1).expandtabs()), marker.group(2), marker.group(3))
                    )
                else:
                    parsed.append(("text", 0, "", line.lstrip()))
            indents = [indent for kind_, indent, _, _ in parsed if kind_ == "item"]
            base = min(indents) if indents else 0
            first_marker = next((marker for kind_, _, marker, _ in parsed if kind_ == "item"), "-")
            content_indent = base + len(first_marker) + 1
            out: list[str] = []
            for kind_, _, marker, content in parsed:
                if kind_ == "item":
                    out.append((" " * base) + marker + " " + content.strip())
                else:
                    out.append((" " * content_indent) + content)
            return "\n".join(out)
        if kind == "table":
            # Keep rows adjacent; blank lines between rows break pipe tables.
            return re.sub(r"(\|[^\n]*\|)\n\n(?=\|)", r"\1\n", text)
        return text

    def render(self, translations: dict[str, str]) -> str:
        out: list[str] = []
        for part in self.parts:
            if isinstance(part, str):
                out.append(part)
            else:
                job_id, original = part
                text = translations.get(job_id, original)
                out.append(self.normalize_block(self.job_kinds.get(job_id, "text"), text))
        text = "".join(out)
        for token, replacement in self.tokens.items():
            text = text.replace(token, replacement)
        return text


def table_separator(line: str) -> bool:
    stripped = line.strip()
    if "|" not in stripped:
        return False
    cells = [cell.strip() for cell in stripped.strip("|").split("|")]
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


def build_page(md: str, locale: str, ui: dict[str, str], page_id: str = "") -> PageBuilder:
    builder = PageBuilder(locale, ui, page_id)
    lines = md.splitlines()
    in_code = False
    i = 0
    while i < len(lines):
        line = lines[i]

        if line.lstrip().startswith("```"):
            in_code = not in_code
            builder.literal(line + "\n")
            i += 1
            continue
        if in_code:
            builder.literal(line + "\n")
            i += 1
            continue

        if not line.strip():
            builder.literal("\n")
            i += 1
            continue

        # Send a whole table as one request. TranslationSession keeps the pipe
        # structure but inserts blank lines between rows; those are collapsed
        # after translation. This preserves context inside the cells and cuts
        # the request count dramatically.
        if line.lstrip().startswith("|"):
            table_lines: list[str] = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            builder.add_job("\n".join(table_lines), kind="table")
            builder.literal("\n")
            continue

        heading = re.match(r"^(#{1,6}\s+)(.*)$", line)
        if heading:
            builder.literal(heading.group(1))
            builder.add_job(heading.group(2))
            builder.literal("\n")
            i += 1
            continue

        list_item = re.match(r"^(\s*(?:[-*+]|\d+\.)\s+)(.*)$", line)
        if list_item:
            # Translate a whole list together so short labels keep their
            # context. Blank lines inserted between items are collapsed later.
            list_lines: list[str] = []
            while i < len(lines):
                candidate = lines[i]
                if not candidate.strip():
                    break
                if candidate.lstrip().startswith("```") or candidate.lstrip().startswith("|"):
                    break
                if not re.match(r"^(\s*(?:[-*+]|\d+\.)\s+|^\s{2,}\S)", candidate):
                    break
                list_lines.append(candidate)
                i += 1
            builder.add_job("\n".join(list_lines), kind="list")
            builder.literal("\n")
            continue

        quote = re.match(r"^(\s*>\s?)(.*)$", line)
        if quote:
            builder.literal(quote.group(1))
            builder.add_job(quote.group(2))
            builder.literal("\n")
            i += 1
            continue

        if re.fullmatch(r"\s*(?:---+|\*\*\*+|___+)\s*", line) or re.match(r"^\s*<[^>]+>", line):
            builder.literal(line + "\n")
            i += 1
            continue

        # A paragraph is translated as one unit. Losing the source hard wraps
        # is fine: Markdown reflows prose, and it gives the translator context.
        paragraph = [line.strip()]
        i += 1
        while i < len(lines):
            next_line = lines[i]
            if not next_line.strip():
                break
            if next_line.lstrip().startswith("```") or next_line.lstrip().startswith("|"):
                break
            if re.match(r"^(#{1,6}\s+|\s*(?:[-*+]|\d+\.)\s+|\s*>\s?)", next_line):
                break
            paragraph.append(next_line.strip())
            i += 1
        if not paragraph:
            continue
        builder.add_job(" ".join(paragraph))
        builder.literal("\n")
    return builder


def main() -> int:
    requested: list[str] = []
    if "--locale" in sys.argv:
        index = sys.argv.index("--locale")
        if index + 1 < len(sys.argv):
            requested = [sys.argv[index + 1]]
    locales = {key: value for key, value in LOCALES.items() if not requested or key in requested}
    if not locales:
        print(f"Unknown locale. Use one of: {', '.join(LOCALES)}", file=sys.stderr)
        return 2

    ui = json.loads((ROOT / "i18n" / "ui.json").read_text(encoding="utf-8"))
    jobs: list[dict[str, str]] = []
    pages: dict[str, PageBuilder] = {}

    for locale in locales:
        for src in PAGES:
            md = (ROOT / src).read_text(encoding="utf-8")
            builder = build_page(md, locale, ui[locale], src)
            pages[f"{locale}:{src}"] = builder
            jobs.extend(builder.jobs)
            print(f"  {locale:5} {src:36} {len(builder.jobs):3} segments", flush=True)

    suffix = requested[0].replace("-", "").lower() if requested else "all"
    jobs_path = Path(f"/tmp/disband-docs-jobs-{suffix}.json")
    results_path = Path(f"/tmp/disband-docs-results-{suffix}.json")
    rerender = "--rerender" in sys.argv

    if rerender:
        if not results_path.exists():
            print(f"Missing translation results: {results_path}", file=sys.stderr)
            return 2
        print(f"Re-rendering from {results_path}...")
        payload = json.loads(results_path.read_text(encoding="utf-8"))
    else:
        jobs_path.write_text(json.dumps({"jobs": jobs}, ensure_ascii=False), encoding="utf-8")

        binary = Path("/tmp/disband-translate")
        if not binary.exists():
            subprocess.run(
                [
                    "swiftc",
                    "-O",
                    "-parse-as-library",
                    "-framework",
                    "Translation",
                    str(ROOT / "scripts" / "translate.swift"),
                    "-o",
                    str(binary),
                ],
                check=True,
            )
        print(f"Translating {len(jobs)} segments with Apple Translation...")
        subprocess.run([str(binary), str(jobs_path), str(results_path)], check=True)
        payload = json.loads(results_path.read_text(encoding="utf-8"))
    if payload.get("errors"):
        print("Translation warnings:", file=sys.stderr)
        for error in payload["errors"][:30]:
            print("  " + error, file=sys.stderr)
        if len(payload["errors"]) > 30:
            print(f"  ... {len(payload['errors']) - 30} more", file=sys.stderr)

    translations = {row["id"]: row["text"] for row in payload["results"]}
    for key, builder in pages.items():
        locale, src = key.split(":", 1)
        out = ROOT / "i18n" / LOCALES[locale]["path"] / src
        out.parent.mkdir(parents=True, exist_ok=True)
        rendered = localize_link_labels(builder.render(translations), src, ui[locale])
        out.write_text(apply_title(rendered, locale, src), encoding="utf-8")
    print(f"Wrote {len(pages)} localized pages into i18n/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
