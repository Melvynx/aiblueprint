import { DocsShell } from "@/components/docs-shell";
import { getDoc } from "@/docs/doc-manager";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  loader: ({ params }) => {
    const doc = getDoc(params._splat);
    if (!doc) throw notFound();
    return { doc };
  },
  component: DocRoute,
});

function DocRoute() {
  const { doc } = Route.useLoaderData();
  return <DocsShell doc={doc} />;
}
