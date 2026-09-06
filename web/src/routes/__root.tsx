import { getChrome, getLocaleFromPathname } from "@public-site/docs/locale";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useLocation,
} from "@tanstack/react-router";
import appCss from "../globals.css?url";

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark');}if(localStorage.getItem('docs-code-wrap')==='1'){document.documentElement.dataset.codeWrap='1';}}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: getChrome("en").siteTitle },
      {
        name: "description",
        content: getChrome("en").siteDescription,
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootLayout,
});

function RootLayout() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const locale = getLocaleFromPathname(pathname);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans antialiased"
      >
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
