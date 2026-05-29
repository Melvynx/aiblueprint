import Link from "@/compat/link";
import { ServerMdx } from "@/features/markdown/server-mdx";
import { cn } from "@/lib/utils";
import { DocsHeader } from "@public-site/docs/_components/docs-header";
import { DocsSidebar } from "@public-site/docs/_components/docs-sidebar";
import {
  DocsTableOfContents,
  type TocItem,
} from "@public-site/docs/_components/docs-toc";
import type { DocTree, DocType } from "@public-site/docs/doc-manager";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ReactNode, useMemo } from "react";

function DocsShell(props: { tree: DocTree; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DocsHeader />
      <div className="flex flex-1">
        <DocsSidebar tree={props.tree} />
        <main className="min-w-0 flex-1">{props.children}</main>
      </div>
    </div>
  );
}

const navButton = cn(
  "border-border hover:bg-muted/60 inline-flex max-w-[45%] items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium no-underline transition-colors",
);

export function DocsNotFound(props: { tree: DocTree }) {
  return (
    <DocsShell tree={props.tree}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-3">
          This documentation page does not exist.
        </p>
      </div>
    </DocsShell>
  );
}

export function DocsContent(props: {
  tree: DocTree;
  doc: DocType;
  allDocs: DocType[];
}) {
  const currentIndex = props.allDocs.findIndex(
    (doc) => doc.slug === props.doc.slug,
  );
  const previous = currentIndex > 0 ? props.allDocs[currentIndex - 1] : null;
  const next =
    currentIndex < props.allDocs.length - 1
      ? props.allDocs[currentIndex + 1]
      : null;
  const toc = useMemo(() => extractToc(props.doc.content), [props.doc.content]);

  return (
    <DocsShell tree={props.tree}>
      <div className={toc.length > 0 ? "xl:pr-64" : ""}>
        <div className="flex w-full">
          <div className="flex min-w-0 flex-1">
            <div className="mx-auto w-full min-w-0 px-6 py-8">
              <div className="mx-auto flex w-full min-w-0 max-w-prose flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">
                    {props.doc.attributes.title}
                  </h1>
                  {props.doc.attributes.description && (
                    <p className="text-muted-foreground text-lg">
                      {props.doc.attributes.description}
                    </p>
                  )}
                </div>

                <ServerMdx source={props.doc.content} />

                {(previous || next) && (
                  <div className="border-border flex items-center justify-between border-t pt-6">
                    {previous && (
                      <Link href={previous.url} className={navButton}>
                        <ArrowLeft className="size-4 shrink-0" />
                        <span className="truncate">
                          {previous.attributes.title}
                        </span>
                      </Link>
                    )}
                    {next && (
                      <Link
                        href={next.url}
                        className={cn(navButton, "ml-auto")}
                      >
                        <span className="truncate">{next.attributes.title}</span>
                        <ArrowRight className="size-4 shrink-0" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {toc.length > 0 && (
            <div className="fixed top-16 right-0 hidden h-[calc(100vh-4rem)] overflow-y-auto xl:flex">
              <aside className="bg-background w-64 overflow-y-auto border-l">
                <div className="p-6">
                  <DocsTableOfContents toc={toc} />
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </DocsShell>
  );
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const title = match[2].trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    toc.push({ title, url: `#${slug}`, depth });
  }

  return toc;
}
