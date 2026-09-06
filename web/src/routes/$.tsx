import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseDocsSplat } from "@public-site/docs/locale";
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
    return loadDocsPage(locale, slugParts);
  },
  head: ({ loaderData }) =>
    docsHead(loaderData?.doc ?? null, loaderData?.locale ?? "en"),
  component: DocsSplatRoute,
});

function DocsSplatRoute() {
  const { tree, doc, allDocs } = Route.useLoaderData();

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
