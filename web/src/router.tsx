import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPendingComponent: () => null,
    defaultNotFoundComponent: () => (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <section className="max-w-md text-center">
          <p className="bg-muted inline-flex rounded px-2 py-1 font-mono text-xs font-semibold">
            404
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">
            Page not found
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            This documentation page does not exist.
          </p>
        </section>
      </main>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
