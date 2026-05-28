import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import type { DocTree } from "../doc-manager";

const TOP_LEVEL_SECTIONS = [{ name: "Overview", href: "/" }];

export function DocsSidebar({ tree }: { tree: DocTree }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r lg:block">
      <nav className="flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col">
            {TOP_LEVEL_SECTIONS.map(({ name, href }) => {
              const isActive = pathname === href;
              return (
                <li key={name}>
                  <Link
                    href={href}
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
              {folder.docs
                .filter((doc) => doc.slug !== folder.slug)
                .map((doc) => {
                  const isActive = doc.url === pathname;
                  return (
                    <li key={doc.slug}>
                      <Link
                        href={doc.url}
                        className={cn(
                          "block rounded px-2 py-1 text-[13px] transition-colors",
                          isActive
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {doc.attributes.title}
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
