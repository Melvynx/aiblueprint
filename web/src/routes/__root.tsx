import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import appCss from "../globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "AIBlueprint CLI Documentation",
      },
      {
        name: "description",
        content:
          "Command reference and setup guides for the AIBlueprint CLI.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='black'/%3E%3Cpath d='M9 10h14v9H13l-4 4V10z' fill='none' stroke='white' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E",
      },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-dvh font-sans antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
