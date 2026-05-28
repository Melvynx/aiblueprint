import Link from "@/compat/link";
import { Terminal } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { label: "Docs", href: "/" },
  {
    label: "GitHub",
    href: "https://github.com/melvynx/aiblueprint-cli",
    external: true,
  },
  {
    label: "npm",
    href: "https://www.npmjs.com/package/aiblueprint-cli",
    external: true,
  },
];

export function DocsHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <Terminal className="size-4" />
            </span>
            <span className="text-lg font-bold">AIBlueprint CLI</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors"
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
