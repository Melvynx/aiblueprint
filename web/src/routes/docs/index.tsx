import { DocsContent, DocsNotFound } from "../-docs-content";
import { getDocsData } from "@/components/docs/doc-manager";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  loader: () => getDocsData([]),
  component: DocsIndexRoute,
});

function DocsIndexRoute() {
  const { tree, currentDoc, allDocs } = Route.useLoaderData();
  const doc = currentDoc ?? tree.rootDocs.at(0) ?? allDocs.at(0);

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
