import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { ServerMdx } from "@/features/markdown/server-mdx";
import { cn } from "@/lib/utils";
import { DocsHeader } from "@public-site/docs/_components/docs-header";
import {
  DocsSearch,
  SearchTrigger,
} from "@public-site/docs/_components/docs-search";
import { DocsSidebar } from "@public-site/docs/_components/docs-sidebar";
import {
  DocsTableOfContents,
  type TocItem,
} from "@public-site/docs/_components/docs-toc";
import { PageActions } from "@public-site/docs/_components/page-actions";
import {
  type DocTree,
  type DocType,
  getFolderForSlug,
  type NavDoc,
} from "@public-site/docs/doc-manager";
import {
  getChrome,
  getLocaleFromPathname,
  slugifyHeading,
  withLocale,
} from "@public-site/docs/locale";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { type ReactNode, useMemo } from "react";

function DocsShell(props: { tree: DocTree; children: ReactNode }) {
  const locale = getLocaleFromPathname(usePathname());
  const copy = getChrome(locale);

  return (
    <div className="dark flex min-h-screen flex-col overflow-x-clip bg-[#08090a] font-sans text-[#f7f8f8] antialiased selection:bg-primary/25">
      <DocsHeader />
      <details
        suppressHydrationWarning
        className="group/mobile-nav sticky top-16 z-40 border-b border-white/[0.06] bg-[#08090a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08090a]/85 lg:hidden"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a"))
            event.currentTarget.open = false;
        }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-[#c5c8ce] select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-6 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-primary transition-transform group-open/mobile-nav:rotate-90"
          />
          {copy.browse}
        </summary>
        <DocsSidebar tree={props.tree} mobile />
      </details>
      <div className="flex flex-1 border-t border-white/[0.06]">
        <DocsSidebar tree={props.tree} />
        <main id="main" className="min-w-0 flex-1">{props.children}</main>
      </div>
      <DocsSearch />
    </div>
  );
}

const navButton = cn(
  "group flex max-w-[48%] flex-col gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm no-underline transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
);

export function DocsNotFound(props: { tree: DocTree }) {
  const copy = getChrome(getLocaleFromPathname(usePathname()));

  return (
    <DocsShell tree={props.tree}>
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
        <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs text-primary">
          404
        </span>
        <h1 className="text-3xl font-medium tracking-[-0.025em] text-[#f7f8f8]">
          {copy.notFoundTitle}
        </h1>
        <p className="text-[#8a8f98]">{copy.notFoundBody}</p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <SearchTrigger expanded />
          <Link
            href={withLocale("/", getLocaleFromPathname(usePathname()))}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-primary no-underline hover:bg-primary/10"
          >
            {copy.backToDocs}
          </Link>
        </div>
      </div>
    </DocsShell>
  );
}

export function DocsContent(props: {
  tree: DocTree;
  doc: DocType;
  allDocs: NavDoc[];
}) {
  if (props.doc.attributes.layout === "home") {
    return (
      <DocsShell tree={props.tree}>
        <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
          <ServerMdx className="docs-typography docs-home" source={props.doc.content} />
        </div>
      </DocsShell>
    );
  }

  return <DocsArticle {...props} />;
}

function DocsArticle(props: {
  tree: DocTree;
  doc: DocType;
  allDocs: NavDoc[];
}) {
  const locale = getLocaleFromPathname(usePathname());
  const copy = getChrome(locale);
  const folder = getFolderForSlug(props.tree, props.doc.slug);
  const folderLanding = folder?.docs.find((doc) => doc.slug === folder.slug) ?? folder?.docs[0];
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
            <div className="mx-auto w-full min-w-0 px-6 py-10 sm:py-14">
              <div className="mx-auto flex w-full min-w-0 max-w-prose flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <nav aria-label="Breadcrumb">
                      <ol className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-white/40 uppercase">
                        <li>
                          <Link href={withLocale("/", locale)} className="no-underline hover:text-primary">
                            {copy.docs}
                          </Link>
                        </li>
                        {folder && folderLanding && (
                          <>
                            <ChevronRight aria-hidden="true" className="size-3 text-white/25" />
                            <li>
                              <Link href={folderLanding.url} className="no-underline hover:text-primary">
                                {folder.name}
                              </Link>
                            </li>
                          </>
                        )}
                      </ol>
                    </nav>
                    <PageActions doc={props.doc} />
                  </div>
                  <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-balance text-[#f7f8f8] sm:text-4xl">
                    {props.doc.attributes.title}
                  </h1>
                  {props.doc.attributes.description && (
                    <p className="text-lg leading-relaxed text-pretty text-[#8a8f98]">
                      {props.doc.attributes.description}
                    </p>
                  )}
                </div>

                <ServerMdx className="docs-typography" source={props.doc.content} />

                {(previous || next) && (
                  <div className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-8 sm:grid-cols-2">
                    {previous && (
                      <Link href={previous.url} className={navButton}>
                        <span className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
                          <ArrowLeft className="size-3" /> {copy.previous}
                        </span>
                        <span className="truncate font-medium text-[#f7f8f8]">
                          {previous.attributes.title}
                        </span>
                      </Link>
                    )}
                    {next && (
                      <Link
                        href={next.url}
                        className={cn(navButton, "ml-auto")}
                      >
                        <span className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
                          {copy.next} <ArrowRight className="size-3" />
                        </span>
                        <span className="truncate font-medium text-[#f7f8f8]">
                          {next.attributes.title}
                        </span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {toc.length > 0 && (
            <div className="docs-sidebar-scroll fixed top-16 right-0 hidden h-[calc(100vh-4rem)] overflow-y-auto xl:flex">
              <aside className="w-64 border-l border-white/[0.06] bg-[#08090a]">
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
    const title = match[2].replace(/[`*_]/g, "").trim();
    toc.push({ title, url: `#${slugifyHeading(title)}`, depth });
  }

  return toc;
}
