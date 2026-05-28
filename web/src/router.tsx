import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPendingComponent: () => null,
    defaultPendingMinMs: 0,
    defaultNotFoundComponent: () => (
      <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground font-mono text-sm">404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            Page not found
          </h1>
          <a
            href="/"
            className="bg-primary text-primary-foreground mt-6 inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
          >
            Back to docs
          </a>
        </div>
      </main>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
