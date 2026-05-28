type DocAttributes = {
  title: string;
  description: string;
  order: number;
};

export type DocPage = {
  slug: string;
  url: string;
  attributes: DocAttributes;
  content: string;
};

const docFiles = import.meta.glob("../../content/docs/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function parseFrontmatter(source: string): {
  attributes: DocAttributes;
  content: string;
} {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Missing frontmatter");
  }

  const rawAttributes = match[1].split("\n").reduce<Record<string, string>>(
    (result, line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return result;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      result[key] = value;
      return result;
    },
    {},
  );

  return {
    attributes: {
      title: rawAttributes.title ?? "Untitled",
      description: rawAttributes.description ?? "",
      order: Number(rawAttributes.order ?? "999"),
    },
    content: match[2].trim(),
  };
}

function slugFromPath(path: string) {
  const fileName = path.split("/").at(-1)?.replace(".md", "") ?? "index";
  return fileName === "index" ? "" : fileName;
}

export function getAllDocs(): DocPage[] {
  return Object.entries(docFiles)
    .map(([path, source]) => {
      const slug = slugFromPath(path);
      const { attributes, content } = parseFrontmatter(source);

      return {
        slug,
        url: slug ? `/${slug}` : "/",
        attributes,
        content,
      };
    })
    .sort((a, b) => a.attributes.order - b.attributes.order);
}

export function getDoc(slug?: string): DocPage | null {
  const normalizedSlug = slug ?? "";
  return getAllDocs().find((doc) => doc.slug === normalizedSlug) ?? null;
}

export function getAdjacentDocs(doc: DocPage) {
  const allDocs = getAllDocs();
  const index = allDocs.findIndex((entry) => entry.slug === doc.slug);

  return {
    previous: index > 0 ? allDocs[index - 1] : null,
    next: index >= 0 && index < allDocs.length - 1 ? allDocs[index + 1] : null,
  };
}

export type TocItem = {
  id: string;
  title: string;
  depth: number;
};

export function getTableOfContents(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const title = match[2].replace(/`/g, "").trim();
    items.push({
      id: slugify(title),
      title,
      depth: match[1].length,
    });
  }

  return items;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
