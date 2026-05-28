import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { DocsHeader } from "../docs/_components/docs-header";
import { DocsSidebar } from "../docs/_components/docs-sidebar";
import {
  DocsTableOfContents,
  type TocItem,
} from "../docs/_components/docs-toc";
import type { DocTree, DocType } from "../docs/doc-manager";
import { ServerMdx } from "../features/markdown/server-mdx";

export function DocsShell(props: { tree: DocTree; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DocsHeader />
      <div className="flex flex-1">
        <DocsSidebar tree={props.tree} />
        <main className="flex-1">{props.children}</main>
      </div>
    </div>
  );
}

export function DocsNotFound(props: { tree: DocTree }) {
  return (
    <DocsShell tree={props.tree}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-normal">Page not found</h1>
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
  const neighbours = {
    previous: currentIndex > 0 ? props.allDocs[currentIndex - 1] : null,
    next:
      currentIndex < props.allDocs.length - 1
        ? props.allDocs[currentIndex + 1]
        : null,
  };
  const toc = extractToc(props.doc.content);

  return (
    <DocsShell tree={props.tree}>
      <div className={toc.length > 0 ? "xl:pr-64" : ""}>
        <div className="flex w-full">
          <div className="flex min-w-0 flex-1">
            <div className="mx-auto px-6 py-8">
              <div className="mx-auto flex max-w-prose flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h1 className="flex-1 text-4xl font-bold tracking-normal">
                    {props.doc.attributes.title}
                  </h1>
                  {props.doc.attributes.description && (
                    <p className="text-muted-foreground text-lg leading-8">
                      {props.doc.attributes.description}
                    </p>
                  )}
                </div>

                <ServerMdx source={props.doc.content} />

                <div className="border-border flex items-center justify-between border-t pt-6">
                  {neighbours.previous && (
                    <Link
                      to={neighbours.previous.url}
                      className="border-input hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium"
                    >
                      <ArrowLeft className="size-4" />
                      {neighbours.previous.attributes.title}
                    </Link>
                  )}
                  {neighbours.next && (
                    <Link
                      to={neighbours.next.url}
                      className="border-input hover:bg-accent hover:text-accent-foreground ml-auto inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium"
                    >
                      {neighbours.next.attributes.title}
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
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
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const title = match[2].trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    toc.push({
      title,
      url: `#${slug}`,
      depth,
    });
  }

  return toc;
}
