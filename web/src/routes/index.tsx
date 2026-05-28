import { DocsShell } from "@/components/docs-shell";
import { getDoc } from "@/docs/doc-manager";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => {
    const doc = getDoc("");
    if (!doc) throw new Error("Docs index is missing");
    return { doc };
  },
  component: DocsIndex,
});

function DocsIndex() {
  const { doc } = Route.useLoaderData();
  return <DocsShell doc={doc} />;
}
