import { DocsContent, DocsNotFound } from "../-docs-content";
import { getDocsData } from "@/components/docs/doc-manager";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/$")({
  loader: async ({ params }) => {
    const slug = params._splat ? params._splat.split("/") : [];
    const data = await getDocsData(slug);
    if (params._splat && !data.currentDoc) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const currentDoc =
      loaderData?.currentDoc ??
      loaderData?.tree.rootDocs.at(0) ??
      loaderData?.allDocs.at(0);

    return {
      meta: [
        {
          title: currentDoc
            ? `${currentDoc.attributes.title} - AIBlueprint CLI`
            : "AIBlueprint CLI Documentation",
        },
        {
          name: "description",
          content:
            currentDoc?.attributes.description ??
            "Command reference and setup guides for the AIBlueprint CLI.",
        },
      ],
    };
  },
  component: DocsSplatRoute,
});

function DocsSplatRoute() {
  const { tree, currentDoc, allDocs } = Route.useLoaderData();
  const { _splat } = Route.useParams();
  const doc = _splat ? currentDoc : (tree.rootDocs.at(0) ?? allDocs.at(0));

  if (!doc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={doc} allDocs={allDocs} />;
}
