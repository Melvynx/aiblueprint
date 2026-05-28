import fm from "front-matter";
import { z } from "zod";

const docFiles = import.meta.glob("../content/**/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const metaFiles = import.meta.glob("../content/**/meta.json", {
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
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
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

async function readMdxFile(
  filePath: string,
  slug: string,
): Promise<DocType | null> {
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

async function getMetaOrder(folderSlug = ""): Promise<string[] | null> {
  try {
    const metaPath = folderSlug
      ? `../content/${folderSlug}/meta.json`
      : "../content/meta.json";
    const metaContents = metaFiles[metaPath];
    if (!metaContents) {
      return null;
    }
    const meta = MetaSchema.safeParse(JSON.parse(metaContents));
    return meta.success ? meta.data.pages : null;
  } catch {
    return null;
  }
}

async function getFolderTitle(
  folderSlug: string,
  fallback: string,
): Promise<string> {
  try {
    const metaContents = metaFiles[`../content/${folderSlug}/meta.json`];
    if (!metaContents) {
      return fallback;
    }
    const meta = MetaSchema.safeParse(JSON.parse(metaContents));
    return meta.success ? meta.data.title : fallback;
  } catch {
    return fallback;
  }
}

async function processFolder(folderName: string): Promise<DocFolder> {
  const [folderOrder, folderTitle] = await Promise.all([
    getMetaOrder(folderName),
    getFolderTitle(folderName, folderName),
  ]);

  const docsPromises = Object.keys(docFiles)
    .filter((filePath) => filePath.startsWith(`../content/${folderName}/`))
    .map(async (filePath) => {
      const fileName = filePath.split("/").at(-1)?.replace(".mdx", "");
      if (!fileName) {
        return null;
      }
      const slug =
        fileName === "index" ? folderName : `${folderName}/${fileName}`;
      return readMdxFile(filePath, slug);
    });

  const docsResults = await Promise.all(docsPromises);
  const folderDocs = docsResults.filter((doc): doc is DocType => doc !== null);

  if (folderOrder) {
    folderDocs.sort((a, b) => {
      const aName = a.slug.includes("/") ? a.slug.split("/")[1] : "index";
      const bName = b.slug.includes("/") ? b.slug.split("/")[1] : "index";
      const aIndex = folderOrder.indexOf(aName);
      const bIndex = folderOrder.indexOf(bName);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  return {
    name: folderTitle,
    slug: folderName,
    docs: folderDocs,
  };
}

export async function getDocsTree(): Promise<DocTree> {
  try {
    const rootOrder = await getMetaOrder();
    const relativePaths = Object.keys(docFiles).map((filePath) =>
      filePath.replace("../content/", ""),
    );
    const directories = Array.from(
      new Set(
        relativePaths
          .filter((filePath) => filePath.includes("/"))
          .map((filePath) => filePath.split("/")[0]),
      ),
    );
    const rootFiles = Object.keys(docFiles).filter((filePath) => {
      const relativePath = filePath.replace("../content/", "");
      return !relativePath.includes("/");
    });

    const [folders, rootDocsResults] = await Promise.all([
      Promise.all(directories.map(processFolder)),
      Promise.all(
        rootFiles.map(async (filePath) => {
          const fileName = filePath.split("/").at(-1)?.replace(".mdx", "");
          if (!fileName) {
            return null;
          }
          const slug = fileName === "index" ? "" : fileName;
          return readMdxFile(filePath, slug);
        }),
      ),
    ]);

    const rootDocs = rootDocsResults.filter(
      (doc): doc is DocType => doc !== null,
    );

    if (rootOrder) {
      rootDocs.sort((a, b) => {
        const aName = a.slug || "index";
        const bName = b.slug || "index";
        const aIndex = rootOrder.indexOf(aName);
        const bIndex = rootOrder.indexOf(bName);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      folders.sort((a, b) => {
        const aIndex = rootOrder.indexOf(a.slug);
        const bIndex = rootOrder.indexOf(b.slug);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return { rootDocs, folders };
  } catch {
    return { rootDocs: [], folders: [] };
  }
}

export async function getAllDocs(): Promise<DocType[]> {
  const tree = await getDocsTree();
  const allDocs: DocType[] = [...tree.rootDocs];
  for (const folder of tree.folders) {
    allDocs.push(...folder.docs);
  }
  return allDocs;
}

export async function getCurrentDoc(
  slugParts: string[] | undefined,
): Promise<DocType | null> {
  const slug = slugParts?.join("/") ?? "";
  const allDocs = await getAllDocs();
  return allDocs.find((doc) => doc.slug === slug) ?? null;
}
