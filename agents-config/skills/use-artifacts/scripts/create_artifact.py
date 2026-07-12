#!/usr/bin/env python3
"""Scaffold a Claude-style local HTML artifact workspace."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

GLOBAL_ARTIFACTS_DIR = Path.home() / ".agents" / "artifacts"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:48].strip("-") or "artifact"


def unique_dir(base: Path, slug: str) -> Path:
    candidate = base / slug
    if not candidate.exists():
        return candidate

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return base / f"{slug}-{stamp}"


def html_template(title: str, style: str, kind: str) -> str:
    escaped_title = (
        title.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escaped_title}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #000000;
      --panel: #111111;
      --ink: #ffffff;
      --muted: #888888;
      --border: #333333;
      --accent: #0070f3;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--ink);
      font-family: Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{
      width: min(1120px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 48px 0;
    }}
    .shell {{
      display: grid;
      gap: 24px;
    }}
    .header {{
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }}
    .eyebrow {{
      margin: 0 0 8px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
    }}
    h1 {{
      margin: 0;
      max-width: 760px;
      font-size: clamp(40px, 7vw, 88px);
      line-height: .95;
      letter-spacing: -.03em;
    }}
    .meta {{
      color: var(--muted);
      font-size: 14px;
      line-height: 1.5;
    }}
    .panel {{
      min-height: 420px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
      padding: 28px;
    }}
    .panel h2 {{
      margin: 0 0 12px;
      font-size: 24px;
      letter-spacing: 0;
    }}
    .panel p {{
      max-width: 680px;
      color: var(--muted);
      font-size: 17px;
      line-height: 1.65;
    }}
    button {{
      border: 0;
      border-radius: 6px;
      background: var(--ink);
      color: var(--bg);
      cursor: pointer;
      font: inherit;
      font-weight: 650;
      padding: 10px 16px;
    }}
    .callout {{
      border: 1px solid var(--border);
      border-radius: 0;
      background: var(--panel);
      padding: 20px;
    }}
    .callout h2 {{ color: var(--ink); }}
    .grid {{
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }}
    .croquis {{
      min-height: 180px;
      border: 1px solid var(--border);
      border-radius: 0;
      background: var(--bg);
      padding: 14px;
    }}
    .bar {{
      height: 14px;
      border-radius: 0;
      background: #666666;
      margin-bottom: 10px;
    }}
    .box {{
      height: 52px;
      border: 1px solid var(--border);
      border-radius: 0;
      background: var(--panel);
      margin-bottom: 10px;
    }}
    .note {{
      color: var(--muted);
      font-size: 14px;
      line-height: 1.45;
    }}
    pre {{
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 0;
      background: var(--bg);
      padding: 16px;
    }}
    code {{
      border-radius: 0;
      background: var(--panel);
      padding: 2px 5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: .92em;
    }}
  </style>
</head>
<body>
  <main>
    <section class="shell" aria-label="{escaped_title}">
      <div class="header">
        <div>
          <p class="eyebrow">{kind} artifact</p>
          <h1>{escaped_title}</h1>
        </div>
        <p class="meta">Style: {style}<br>Entrypoint: index.html</p>
      </div>
      <div class="callout">
        <h2>Key finding or recommendation</h2>
        <p>
          Put the highest-signal conclusion near the top. Use this area for the
          main security finding, product decision, implementation warning, or
          core recommendation that frames the rest of the artifact.
        </p>
      </div>
      <div class="panel">
        <h2>Public reasoning surface</h2>
        <p>
          Turn the answer into a readable page: context, model, tradeoffs,
          examples, edge cases, rollout steps, and verification notes. Show
          conclusions and evidence, not private chain-of-thought.
        </p>
        <pre><code>// Add focused snippets when they clarify the plan.
function example() {{
  return "replace this with the requested artifact content";
}}</code></pre>
      </div>
      <div class="panel">
        <h2>Page draft</h2>
        <p>
          For plan artifacts, draft the actual page or content structure here:
          title, lede, sections, key copy, calls to action, states, and the
          narrative blocks the user should see.
        </p>
      </div>
      <div class="grid">
        <article class="panel">
          <h2>Page croquis A</h2>
          <div class="croquis">
            <div class="bar" style="width: 72%;"></div>
            <div class="box"></div>
            <div class="box" style="width: 64%;"></div>
          </div>
          <p class="note">Sketch the page hierarchy quickly. This is for seeing and understanding, not final UI.</p>
        </article>
        <article class="panel">
          <h2>Page croquis B</h2>
          <div class="croquis">
            <div class="box" style="height: 84px;"></div>
            <div class="bar" style="width: 46%;"></div>
            <div class="bar" style="width: 78%; opacity: .35;"></div>
          </div>
          <p class="note">Annotate what changes: layout, emphasis, rhythm, audience, or tradeoff.</p>
        </article>
      </div>
    </section>
  </main>
</body>
</html>
"""


def highlogic_template(title: str, style: str, kind: str, created_at: str) -> str:
    return f"""# {title}

## Intent

- Kind: {kind}
- Style: {style}
- Created: {created_at}

## User Request

TODO: Summarize the user's artifact request.

## Core Logic

TODO: Describe the public reasoning structure, sections, data model, interactions, and key design decisions. Capture conclusions, evidence, assumptions, and tradeoffs without private chain-of-thought.

## Verification

TODO: Record how the artifact was opened or tested, including browser/runtime checks when relevant.

## Iteration Notes

- Initial scaffold created.
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a local HTML artifact workspace.")
    parser.add_argument("title", help="Short artifact title or slug")
    parser.add_argument("--style", default="black-grid", help="use-style style name")
    parser.add_argument("--kind", default="thinking", help="artifact kind")
    args = parser.parse_args()

    base = GLOBAL_ARTIFACTS_DIR.resolve()
    artifact_id = slugify(args.title)
    artifact_dir = unique_dir(base, artifact_id)
    created_at = datetime.now(timezone.utc).isoformat()

    artifact_dir.mkdir(parents=True, exist_ok=False)
    (artifact_dir / "versions").mkdir()

    title = args.title.strip()
    (artifact_dir / "index.html").write_text(
        html_template(title, args.style, args.kind),
        encoding="utf-8",
    )
    (artifact_dir / "HIGHLOGIC.md").write_text(
        highlogic_template(title, args.style, args.kind, created_at),
        encoding="utf-8",
    )
    manifest = {
        "id": artifact_dir.name,
        "title": title,
        "kind": args.kind,
        "style": args.style,
        "created_at": created_at,
        "entrypoint": "index.html",
        "files": ["index.html", "HIGHLOGIC.md", "manifest.json"],
    }
    (artifact_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )

    index_path = artifact_dir / "index.html"
    print(f"created={artifact_dir}")
    print(f"index={index_path}")
    print(f"url={index_path.as_uri()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
