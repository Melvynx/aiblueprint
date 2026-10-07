import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { usePathname } from "@/compat/navigation";
import { getNavTree } from "@public-site/docs/doc-manager";
import { getLocaleFromPathname, parseDocsSplat } from "@public-site/docs/locale";
import { DocsContent, DocsNotFound } from "./-docs-content";
import { docsHead, loadDocsPage } from "./-docs-loader";

export const Route = createFileRoute("/$")({
  beforeLoad: ({ params }) => {
    const { locale, slugParts } = parseDocsSplat(params._splat);
    const slug = slugParts.join("/");
    const legacyPaths: Record<string, string> = {
      "concepts/apex": "advanced/apex",
      "concepts/slash-commands": "skills",
      "concepts/use-style": "skills/use-style",
      "concepts/use-artifacts": "skills/use-artifacts",
    };
    const destination = legacyPaths[slug];
    if (destination) {
      throw redirect({
        href: locale === "fr" ? `/fr/${destination}` : `/${destination}`,
        statusCode: 301,
      });
    }
  },
  loader: ({ params }) => {
    const { locale, slugParts } = parseDocsSplat(params._splat);
    const page = loadDocsPage(locale, slugParts);
    // Throwing makes SSR answer with a real 404 status instead of 200.
    if (!page.doc) throw notFound();
    return page;
  },
  head: ({ loaderData }) =>
    docsHead(loaderData?.doc ?? null, loaderData?.locale ?? "en"),
  component: DocsSplatRoute,
  notFoundComponent: DocsSplatNotFound,
});

function DocsSplatNotFound() {
  const locale = getLocaleFromPathname(usePathname());
  return <DocsNotFound tree={getNavTree(locale)} />;
}

function DocsSplatRoute() {
  const { tree, doc, allDocs } = Route.useLoaderData();

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
