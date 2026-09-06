import { createFileRoute } from "@tanstack/react-router";
import { DocsContent, DocsNotFound } from "./-docs-content";
import { docsHead, loadDocsPage } from "./-docs-loader";

export const Route = createFileRoute("/")({
  loader: () => {
    const data = loadDocsPage("en", []);
    return {
      ...data,
      doc: data.doc ?? data.tree.rootDocs.at(0) ?? null,
    };
  },
  head: ({ loaderData }) =>
    docsHead(loaderData?.doc ?? null, loaderData?.locale ?? "en"),
  component: IndexRoute,
});

function IndexRoute() {
  const { tree, doc, allDocs } = Route.useLoaderData();

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
