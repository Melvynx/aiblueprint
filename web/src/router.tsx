import { getChrome, getLocaleFromPathname, withLocale } from "@public-site/docs/locale";
import { createRouter, useLocation } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultNotFound() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const locale = getLocaleFromPathname(pathname);
  const copy = getChrome(locale);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="bg-muted rounded px-2 py-1 font-mono text-sm font-semibold">
        404
      </p>
      <h1 className="text-3xl font-bold tracking-tight">{copy.pageNotFound}</h1>
      <a
        href={withLocale("/", locale)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
      >
        {copy.backToDocs}
      </a>
    </main>
  );
}

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultNotFoundComponent: DefaultNotFound,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
