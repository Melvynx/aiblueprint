import fm from "front-matter";
import { z } from "zod";

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

const MetaSchema = z.object({
  title: z.string(),
  pages: z.array(z.string()),
});

const AttributeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  order: z.number().optional(),
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

function readMdxFile(filePath: string, slug: string): DocType | null {
  const fileContents = docFiles[filePath];
  if (!fileContents) {
    return null;
  }

  const matter = fm(fileContents);
  const result = AttributeSchema.safeParse(matter.attributes);

  if (!result.success) {
    return null;
  }

  return {
    slug,
    url: slug ? `/${slug}` : "/",
    content: matter.body,
    attributes: result.data,
  };
}

function getMetaOrder(folderSlug = ""): string[] | null {
  const metaPath = folderSlug
    ? `../../../content/docs/${folderSlug}/meta.json`
    : "../../../content/docs/meta.json";
  const metaContents = metaFiles[metaPath];
  if (!metaContents) {
    return null;
  }
  const meta = MetaSchema.safeParse(JSON.parse(metaContents));
  return meta.success ? meta.data.pages : null;
}

function getFolderTitle(folderSlug: string, fallback: string): string {
  const metaContents =
    metaFiles[`../../../content/docs/${folderSlug}/meta.json`];
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

function processFolder(folderName: string): DocFolder {
  const folderOrder = getMetaOrder(folderName);
  const folderTitle = getFolderTitle(folderName, folderName);

  const folderDocs = Object.keys(docFiles)
    .filter((filePath) =>
      filePath.startsWith(`../../../content/docs/${folderName}/`),
    )
    .map((filePath) => {
      const fileName = filePath.split("/").at(-1)?.replace(".mdx", "");
      if (!fileName) {
        return null;
      }
      const slug =
        fileName === "index" ? folderName : `${folderName}/${fileName}`;
      return readMdxFile(filePath, slug);
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

export function getDocsTree(): DocTree {
  try {
    const rootOrder = getMetaOrder();
    const relativePaths = Object.keys(docFiles).map((filePath) =>
      filePath.replace("../../../content/docs/", ""),
    );
    const directories = Array.from(
      new Set(
        relativePaths
          .filter((filePath) => filePath.includes("/"))
          .map((filePath) => filePath.split("/")[0]),
      ),
    );
    const rootFiles = Object.keys(docFiles).filter(
      (filePath) =>
        !filePath.replace("../../../content/docs/", "").includes("/"),
    );

    const folders = directories.map(processFolder);
    const rootDocs = rootFiles
      .map((filePath) => {
        const fileName = filePath.split("/").at(-1)?.replace(".mdx", "");
        if (!fileName) {
          return null;
        }
        const slug = fileName === "index" ? "" : fileName;
        return readMdxFile(filePath, slug);
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

export function getAllDocs(): DocType[] {
  const tree = getDocsTree();
  return [...tree.rootDocs, ...tree.folders.flatMap((folder) => folder.docs)];
}

export function getCurrentDoc(slugParts: string[] | undefined): DocType | null {
  const slug = slugParts?.join("/") ?? "";
  return getAllDocs().find((doc) => doc.slug === slug) ?? null;
}
