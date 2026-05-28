const DOCS_PREFIX = "../../../content/docs/";

const docFiles = import.meta.glob("../../../content/docs/**/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const metaFiles = import.meta.glob("../../../content/docs/**/meta.json", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

type DocAttributes = {
  title: string;
  description: string;
  tags?: string[];
  command?: string;
};

type Meta = {
  title: string;
  pages: string[];
};

export type DocType = {
  slug: string;
  url: string;
  attributes: DocAttributes;
  content: string;
};

export type DocFolder = {
  name: string;
  slug: string;
  docs: DocType[];
};

export type DocTree = {
  rootDocs: DocType[];
  folders: DocFolder[];
};

export type DocsData = {
  tree: DocTree;
  allDocs: DocType[];
  currentDoc: DocType | null;
};

let cachedDocs: Omit<DocsData, "currentDoc"> | null = null;

function parseString(value: unknown, filePath: string, key: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid front matter in ${filePath}: ${key} is required`);
  }
  return value;
}

function parseStringArray(
  value: unknown,
  filePath: string,
  key: string,
): string[] | undefined {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.trim().length === 0)
  ) {
    throw new Error(
      `Invalid front matter in ${filePath}: ${key} must be a string array`,
    );
  }
  return value;
}

function parseFrontMatter(filePath: string, source: string) {
  if (!source.startsWith("---\n")) {
    throw new Error(`Missing front matter in ${filePath}`);
  }

  const endIndex = source.indexOf("\n---", 4);
  if (endIndex === -1) {
    throw new Error(`Unclosed front matter in ${filePath}`);
  }

  const rawMatter = source.slice(4, endIndex).trimEnd();
  const body = source.slice(endIndex + 4).replace(/^\n/, "");
  const fields: Record<string, unknown> = {};
  let currentArrayKey: string | null = null;

  for (const line of rawMatter.split("\n")) {
    if (!line.trim()) continue;

    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentArrayKey) {
      const current = fields[currentArrayKey];
      if (!Array.isArray(current)) {
        throw new Error(`Invalid array front matter in ${filePath}`);
      }
      current.push(arrayItem[1].trim());
      continue;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!field) {
      throw new Error(`Unsupported front matter line in ${filePath}: ${line}`);
    }

    const [, key, rawValue = ""] = field;
    currentArrayKey = null;
    if (!rawValue) {
      fields[key] = [];
      currentArrayKey = key;
      continue;
    }

    fields[key] = rawValue.trim();
  }

  return {
    attributes: {
      title: parseString(fields.title, filePath, "title"),
      description: parseString(fields.description, filePath, "description"),
      tags: parseStringArray(fields.tags, filePath, "tags"),
      command:
        typeof fields.command === "string" && fields.command.trim()
          ? fields.command
          : undefined,
    },
    body,
  };
}

function relativeDocPath(filePath: string) {
  return filePath.replace(DOCS_PREFIX, "");
}

function slugFromRelativePath(relativePath: string) {
  const withoutExtension = relativePath.replace(/\.mdx$/, "");
  if (withoutExtension === "index") return "";
  return withoutExtension.replace(/\/index$/, "");
}

function parseMeta(filePath: string, contents: string): Meta {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const meta = value as Partial<Meta>;
  if (
    typeof meta.title !== "string" ||
    !Array.isArray(meta.pages) ||
    meta.pages.some((page) => typeof page !== "string")
  ) {
    throw new Error(
      `Invalid docs meta in ${filePath}: expected { title: string, pages: string[] }`,
    );
  }
  return { title: meta.title, pages: meta.pages };
}

function getMeta(folderSlug = ""): Meta | null {
  const metaPath = folderSlug
    ? `${DOCS_PREFIX}${folderSlug}/meta.json`
    : `${DOCS_PREFIX}meta.json`;
  const metaContents = metaFiles[metaPath];
  return metaContents ? parseMeta(metaPath, metaContents) : null;
}

function readMdxFile(filePath: string): DocType {
  const fileContents = docFiles[filePath];
  if (!fileContents) {
    throw new Error(`Missing MDX file content for ${filePath}`);
  }

  const matter = parseFrontMatter(filePath, fileContents);
  const slug = slugFromRelativePath(relativeDocPath(filePath));

  return {
    slug,
    url: slug ? `/docs/${slug}` : "/docs",
    content: matter.body,
    attributes: matter.attributes,
  };
}

function orderIndexFor(doc: DocType, folderSlug: string, order: string[]) {
  const key =
    folderSlug && doc.slug === folderSlug
      ? "index"
      : folderSlug
        ? doc.slug.slice(folderSlug.length + 1)
        : doc.slug || "index";
  const index = order.indexOf(key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortByMetaOrder(docs: DocType[], folderSlug: string, order?: string[]) {
  if (!order) return docs;
  return [...docs].sort((a, b) => {
    const aIndex = orderIndexFor(a, folderSlug, order);
    const bIndex = orderIndexFor(b, folderSlug, order);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.slug.localeCompare(b.slug);
  });
}

function createDocsCache(): Omit<DocsData, "currentDoc"> {
  const docs = Object.keys(docFiles).map(readMdxFile);
  const rootMeta = getMeta();
  const folderSlugs = Array.from(
    new Set(
      docs
        .map((doc) => doc.slug.split("/")[0])
        .filter(
          (slug) =>
            slug && docs.some((doc) => doc.slug.startsWith(`${slug}/`)),
        ),
    ),
  );
  const rootDocs = sortByMetaOrder(
    docs.filter(
      (doc) => !doc.slug.includes("/") && !folderSlugs.includes(doc.slug),
    ),
    "",
    rootMeta?.pages,
  );

  const folders = folderSlugs.map((folderSlug) => {
    const meta = getMeta(folderSlug);
    const folderDocs = sortByMetaOrder(
      docs.filter(
        (doc) =>
          doc.slug === folderSlug || doc.slug.startsWith(`${folderSlug}/`),
      ),
      folderSlug,
      meta?.pages,
    );

    return {
      name: meta?.title ?? folderSlug,
      slug: folderSlug,
      docs: folderDocs,
    };
  });

  const orderedFolders = rootMeta?.pages
    ? [...folders].sort((a, b) => {
        const aIndex = rootMeta.pages.indexOf(a.slug);
        const bIndex = rootMeta.pages.indexOf(b.slug);
        if (aIndex === -1 && bIndex === -1) return a.slug.localeCompare(b.slug);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
    : folders;

  const tree = { rootDocs, folders: orderedFolders };
  return {
    tree,
    allDocs: [...tree.rootDocs, ...tree.folders.flatMap((folder) => folder.docs)],
  };
}

function getCachedDocs() {
  cachedDocs ??= createDocsCache();
  return cachedDocs;
}

export async function getDocsData(
  slugParts: string[] | undefined,
): Promise<DocsData> {
  const docs = getCachedDocs();
  const slug = slugParts?.join("/") ?? "";
  return {
    ...docs,
    currentDoc: docs.allDocs.find((doc) => doc.slug === slug) ?? null,
  };
}

export async function getDocsTree(): Promise<DocTree> {
  return getCachedDocs().tree;
}

export async function getAllDocs(): Promise<DocType[]> {
  return getCachedDocs().allDocs;
}

export async function getCurrentDoc(
  slugParts: string[] | undefined,
): Promise<DocType | null> {
  return getDocsData(slugParts).then((data) => data.currentDoc);
}
