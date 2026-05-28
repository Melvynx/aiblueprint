import { createFileRoute } from "@tanstack/react-router";
import { DocsContent, DocsNotFound } from "./-docs-content";
import {
  getAllDocs,
  getCurrentDoc,
  getDocsTree,
} from "../docs/doc-manager";

export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const slug = params._splat ? params._splat.split("/") : [];
    const [tree, doc, allDocs] = await Promise.all([
      getDocsTree(),
      getCurrentDoc(slug),
      getAllDocs(),
    ]);
    return { tree, doc, allDocs };
  },
  head: ({ loaderData }) => {
    const currentDoc =
      loaderData?.doc ??
      loaderData?.tree.rootDocs.at(0) ??
      loaderData?.allDocs.at(0);

    return {
      meta: [
        {
          title: currentDoc
            ? `${currentDoc.attributes.title} | AIBlueprint CLI`
            : "AIBlueprint CLI Documentation",
        },
        {
          name: "description",
          content:
            currentDoc?.attributes.description ??
            "Documentation for the AIBlueprint CLI.",
        },
      ],
    };
  },
  component: DocsSplatRoute,
});

function DocsSplatRoute() {
  const { tree, doc, allDocs } = Route.useLoaderData();
  const { _splat } = Route.useParams();
  const currentDoc = _splat ? doc : (tree.rootDocs.at(0) ?? allDocs.at(0));

  if (!currentDoc) {
    return <DocsNotFound tree={tree} />;
  }

  return <DocsContent tree={tree} doc={currentDoc} allDocs={allDocs} />;
}
