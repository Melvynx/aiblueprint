import { createFileRoute } from "@tanstack/react-router";
import { ExamplesPage, examplesHead } from "./examples";

export const Route = createFileRoute("/fr/examples")({
  head: () => examplesHead("fr"),
  component: () => <ExamplesPage locale="fr" />,
});
