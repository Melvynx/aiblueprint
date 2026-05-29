import { createFileRoute } from "@tanstack/react-router";
import {
  getAllDocs,
  getCurrentDoc,
  getDocsTree,
} from "@public-site/docs/doc-manager";
import { DocsContent, DocsNotFound } from "./-docs-content";

export const Route = createFileRoute("/")({
  loader: () => {
    const tree = getDocsTree();
    const doc = getCurrentDoc([]) ?? tree.rootDocs.at(0) ?? null;
    return { tree, doc, allDocs: getAllDocs() };
  },
  head: ({ loaderData }) => {
    const doc = loaderData?.doc;
    if (!doc) return {};
    return {
      meta: [
        { title: doc.attributes.title },
        ...(doc.attributes.description
          ? [{ name: "description", content: doc.attributes.description }]
          : []),
      ],
    };
  },
  component: IndexRoute,
});

function IndexRoute() {
  const { tree, doc, allDocs } = Route.useLoaderData();

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
