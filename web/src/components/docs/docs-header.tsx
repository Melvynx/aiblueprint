import { Link } from "@tanstack/react-router";
import { BookOpen, Github } from "lucide-react";

export function DocsHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <Link to="/docs" className="flex items-center gap-2 no-underline">
          <span className="bg-foreground text-background flex size-8 items-center justify-center rounded-md">
            <BookOpen className="size-4" />
          </span>
          <span className="text-lg font-bold tracking-normal">
            AIBlueprint CLI
          </span>
        </Link>

        <a
          href="https://github.com/Melvynx/aiblueprint-cli"
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors"
        >
          <Github className="size-4" />
          GitHub
        </a>
      </div>
    </header>
  );
}
