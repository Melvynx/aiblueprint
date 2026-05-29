import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultNotFoundComponent: () => (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="bg-muted rounded px-2 py-1 font-mono text-sm font-semibold">
          404
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <a
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
        >
          Back to docs
        </a>
      </main>
    ),
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
