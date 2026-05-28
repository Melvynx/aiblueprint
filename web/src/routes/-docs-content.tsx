import { ServerMdx } from "@/features/markdown/server-mdx";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import {
  DocsTableOfContents,
  type TocItem,
} from "@/components/docs/docs-toc";
import type { DocTree, DocType } from "@/components/docs/doc-manager";
import { slugifyHeading } from "@/lib/markdown";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function DocsShell(props: { tree: DocTree; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DocsHeader />
      <div className="flex flex-1">
        <DocsSidebar tree={props.tree} />
        <main className="min-w-0 flex-1 overflow-x-hidden">{props.children}</main>
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
          <div className="min-w-0 flex-1">
            <div className="mx-auto px-6 py-8">
              <article className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-6 sm:max-w-prose">
                <header className="flex flex-col gap-3">
                  <h1 className="text-4xl font-bold tracking-normal">
                    {props.doc.attributes.title}
                  </h1>
                  <p className="text-muted-foreground text-lg leading-8">
                    {props.doc.attributes.description}
                  </p>
                </header>

                <ServerMdx source={props.doc.content} />

                <nav className="border-border flex flex-col items-stretch gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {neighbours.previous && (
                    <Link
                      to={neighbours.previous.url}
                      className="border-border hover:bg-muted inline-flex min-h-10 min-w-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors sm:w-auto"
                    >
                      <ArrowLeft className="size-4" />
                      <span className="truncate">
                        {neighbours.previous.attributes.title}
                      </span>
                    </Link>
                  )}
                  {neighbours.next && (
                    <Link
                      to={neighbours.next.url}
                      className="border-border hover:bg-muted inline-flex min-h-10 min-w-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors sm:ml-auto sm:w-auto"
                    >
                      <span className="truncate">
                        {neighbours.next.attributes.title}
                      </span>
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                </nav>
              </article>
            </div>
          </div>

          {toc.length > 0 && (
            <aside className="bg-background fixed top-16 right-0 hidden h-[calc(100vh-4rem)] w-64 overflow-y-auto border-l xl:block">
              <div className="p-6">
                <DocsTableOfContents toc={toc} />
              </div>
            </aside>
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
    const slug = slugifyHeading(title);

    toc.push({ title, url: `#${slug}`, depth });
  }

  return toc;
}
