import { slugify } from "@/docs/doc-manager";

type MarkdownBlock =
  | { type: "heading"; depth: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string };

function parseBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.replace("```", "").trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", language, code: code.join("\n") });
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        depth: heading[1].length,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("```") &&
      !lines[index].match(/^(#{1,4})\s+/) &&
      !lines[index].startsWith("- ")
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }

        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <a href={link[2]} key={index}>
              {link[1]}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="markdown">
      {parseBlocks(source).map((block, index) => {
        if (block.type === "heading") {
          const id = slugify(block.text);
          if (block.depth === 1) return <h1 key={index}>{block.text}</h1>;
          if (block.depth === 2) {
            return (
              <h2 id={id} key={index}>
                <InlineMarkdown text={block.text} />
              </h2>
            );
          }
          if (block.depth === 3) {
            return (
              <h3 id={id} key={index}>
                <InlineMarkdown text={block.text} />
              </h3>
            );
          }
          return (
            <h4 id={id} key={index}>
              <InlineMarkdown text={block.text} />
            </h4>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={index}>
              <InlineMarkdown text={block.text} />
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item}>
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <pre className="code-block" key={index}>
            <code>{block.code}</code>
          </pre>
        );
      })}
    </div>
  );
}
