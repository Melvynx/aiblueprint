import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "../../lib/utils";
import type { DocTree } from "../doc-manager";

const TOP_LEVEL_SECTIONS = [{ name: "Introduction", href: "/" }];

export function DocsSidebar({ tree }: { tree: DocTree }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r lg:block">
      <nav className="flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-2">
          <h4 className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">
            Getting Started
          </h4>
          <ul className="flex flex-col">
            {TOP_LEVEL_SECTIONS.map(({ name, href }) => {
              const isActive = pathname === href;
              return (
                <li key={name}>
                  <Link
                    to={href}
                    className={cn(
                      "block rounded px-2 py-1 text-[13px] transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {tree.folders.map((folder) => (
          <div key={folder.slug} className="flex flex-col gap-2">
            <h4 className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">
              {folder.name}
            </h4>
            <ul className="flex flex-col">
              {folder.docs.map((doc) => {
                const isActive = doc.url === pathname;
                return (
                  <li key={doc.slug}>
                    <Link
                      to={doc.url}
                      className={cn(
                        "block rounded px-2 py-1 text-[13px] transition-colors",
                        isActive
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{doc.attributes.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
