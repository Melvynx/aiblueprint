import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";

export function DocsHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-16 max-w-screen-2xl items-center px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <Terminal className="size-4" />
            </span>
            <span className="text-lg font-bold">AIBlueprint CLI</span>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <a
              href="https://github.com/Melvynx/aiblueprint"
              className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/aiblueprint-cli"
              className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
            >
              npm
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
