import { createFileRoute } from "@tanstack/react-router";
import {
  getAllDocs,
  getCurrentDoc,
  getDocsTree,
} from "@public-site/docs/doc-manager";
import { DocsContent, DocsNotFound } from "./-docs-content";

export const Route = createFileRoute("/$")({
  loader: ({ params }) => {
    const slug = params._splat ? params._splat.split("/") : [];
    return {
      tree: getDocsTree(),
      doc: getCurrentDoc(slug),
      allDocs: getAllDocs(),
    };
  },
  head: ({ loaderData }) => {
    const doc = loaderData?.doc;
    if (!doc) return {};
    return {
      meta: [
        { title: `${doc.attributes.title} - AIBlueprint CLI` },
        ...(doc.attributes.description
          ? [{ name: "description", content: doc.attributes.description }]
          : []),
      ],
    };
  },
  component: DocsSplatRoute,
});

function DocsSplatRoute() {
  const { tree, doc, allDocs } = Route.useLoaderData();

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
