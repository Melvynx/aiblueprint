import fm from "front-matter";
import { z } from "zod";
import { DEFAULT_LOCALE, type Locale, withLocale } from "./locale";

const enDocFiles = import.meta.glob("../../../content/docs/**/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const frDocFiles = import.meta.glob("../../../content/fr/**/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const enMetaFiles = import.meta.glob("../../../content/docs/**/meta.json", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const frMetaFiles = import.meta.glob("../../../content/fr/**/meta.json", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const MetaSchema = z.object({
  title: z.string(),
  pages: z.array(z.string()),
});

const AttributeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  order: z.number().optional(),
  pro: z.boolean().optional(),
});

type DocAttributes = z.infer<typeof AttributeSchema>;

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

function contentRoot(locale: Locale): string {
  return locale === "fr"
    ? "../../../content/fr/"
    : "../../../content/docs/";
}

function docFilesFor(locale: Locale): Record<string, string> {
  return locale === "fr" ? frDocFiles : enDocFiles;
}

function metaFilesFor(locale: Locale): Record<string, string> {
  return locale === "fr" ? frMetaFiles : enMetaFiles;
}

function readMdxFile(
  filePath: string,
  slug: string,
  locale: Locale,
): DocType | null {
  const fileContents = docFilesFor(locale)[filePath];
  if (!fileContents) {
    return null;
  }

  let matter: ReturnType<typeof fm>;
  try {
    matter = fm(fileContents);
  } catch {
    return null;
  }
  const result = AttributeSchema.safeParse(matter.attributes);

  if (!result.success) {
    return null;
  }

  return {
    slug,
    url: withLocale(slug ? `/${slug}` : "/", locale),
    content: matter.body,
    attributes: result.data,
  };
}

function getMetaOrder(locale: Locale, folderSlug = ""): string[] | null {
  const root = contentRoot(locale);
  const metaPath = folderSlug
    ? `${root}${folderSlug}/meta.json`
    : `${root}meta.json`;
  const metaContents = metaFilesFor(locale)[metaPath];
  if (!metaContents) {
    return null;
  }
  const meta = MetaSchema.safeParse(JSON.parse(metaContents));
  return meta.success ? meta.data.pages : null;
}

function getFolderTitle(
  locale: Locale,
  folderSlug: string,
  fallback: string,
): string {
  const metaContents = metaFilesFor(locale)[`${contentRoot(locale)}${folderSlug}/meta.json`];
  if (!metaContents) {
    return fallback;
  }
  try {
    const meta = JSON.parse(metaContents);
    return typeof meta.title === "string" ? meta.title : fallback;
  } catch {
    return fallback;
  }
}

function processFolder(locale: Locale, folderName: string): DocFolder {
  const folderOrder = getMetaOrder(locale, folderName);
  const folderTitle = getFolderTitle(locale, folderName, folderName);
  const root = contentRoot(locale);

  const folderDocs = Object.keys(docFilesFor(locale))
    .filter((filePath) => filePath.startsWith(`${root}${folderName}/`))
    .map((filePath) => {
      const fileName = filePath.split("/").at(-1)?.replace(".mdx", "");
      if (!fileName) {
        return null;
      }
      const slug =
        fileName === "index" ? folderName : `${folderName}/${fileName}`;
      return readMdxFile(filePath, slug, locale);
    })
    .filter((doc): doc is DocType => doc !== null);

  if (folderOrder) {
    folderDocs.sort((a, b) => {
      const aName = a.slug.includes("/") ? a.slug.split("/")[1] : "index";
      const bName = b.slug.includes("/") ? b.slug.split("/")[1] : "index";
      return sortByOrder(folderOrder, aName, bName);
    });
  }

  return { name: folderTitle, slug: folderName, docs: folderDocs };
}

function sortByOrder(order: string[], a: string, b: string): number {
  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);
  if (aIndex === -1 && bIndex === -1) return 0;
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

export function getDocsTree(locale: Locale = DEFAULT_LOCALE): DocTree {
  try {
    const root = contentRoot(locale);
    const files = docFilesFor(locale);
    const rootOrder = getMetaOrder(locale);
    const relativePaths = Object.keys(files).map((filePath) =>
      filePath.replace(root, ""),
    );
    const directories = Array.from(
      new Set(
        relativePaths
          .filter((filePath) => filePath.includes("/"))
          .map((filePath) => filePath.split("/")[0]),
      ),
    );
    const rootFiles = Object.keys(files).filter(
      (filePath) => !filePath.replace(root, "").includes("/"),
    );

    const folders = directories.map((folder) => processFolder(locale, folder));
    const rootDocs = rootFiles
      .map((filePath) => {
        const fileName = filePath.split("/").at(-1)?.replace(".mdx", "");
        if (!fileName) {
          return null;
        }
        const slug = fileName === "index" ? "" : fileName;
        return readMdxFile(filePath, slug, locale);
      })
      .filter((doc): doc is DocType => doc !== null);

    if (rootOrder) {
      rootDocs.sort((a, b) =>
        sortByOrder(rootOrder, a.slug || "index", b.slug || "index"),
      );
      folders.sort((a, b) => sortByOrder(rootOrder, a.slug, b.slug));
    }

    return { rootDocs, folders };
  } catch {
    return { rootDocs: [], folders: [] };
  }
}

export function getAllDocs(locale: Locale = DEFAULT_LOCALE): DocType[] {
  const tree = getDocsTree(locale);
  return [...tree.rootDocs, ...tree.folders.flatMap((folder) => folder.docs)];
}

export function getCurrentDoc(
  slugParts: string[] | undefined,
  locale: Locale = DEFAULT_LOCALE,
): DocType | null {
  const slug = slugParts?.join("/") ?? "";
  return getAllDocs(locale).find((doc) => doc.slug === slug) ?? null;
}
