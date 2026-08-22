import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Boxes, GitBranch, Layers3, Rocket, Terminal } from "lucide-react";
import type { DocTree } from "../doc-manager";

const TOP_LEVEL_SECTIONS = [
  { name: "Introduction", href: "/", icon: BookOpen },
  { name: "Getting Started", href: "/getting-started/installation", activePrefix: "/getting-started", icon: Rocket },
  { name: "Core Workflow", href: "/core-workflow", activePrefix: "/core-workflow", icon: GitBranch },
  { name: "Advanced", href: "/advanced", activePrefix: "/advanced", icon: Layers3 },
  { name: "Commands", href: "/commands/agents-setup", activePrefix: "/commands", icon: Terminal },
  { name: "Concepts", href: "/concepts/skills", activePrefix: "/concepts", icon: Boxes },
];

export function DocsSidebar({ tree }: { tree: DocTree }) {
  const pathname = usePathname();

  return (
    <aside className="no-scrollbar sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-white/[0.06] bg-[#08090a] lg:block">
      <nav className="flex flex-col gap-7 px-3 pt-4 pb-16">
        <div className="flex flex-col gap-0.5">
          <ul className="flex flex-col gap-0.5">
            {TOP_LEVEL_SECTIONS.map(({ name, href, activePrefix, icon: Icon }) => {
              const isActive = href === "/" ? pathname === href : pathname.startsWith(activePrefix ?? href);
              return (
                <li key={name}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none",
                      isActive
                        ? "bg-white/[0.06] font-medium text-[#f7f8f8]"
                        : "text-[#8a8f98] hover:bg-white/[0.03] hover:text-[#f7f8f8]",
                    )}
                  >
                    <Icon className={cn("size-3.5 shrink-0", isActive ? "text-[#f7f8f8]" : "text-[#8a8f98]/70")} />
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {tree.folders.map((folder) => (
          <div key={folder.slug} className="flex flex-col gap-1.5">
            <h4 className="px-2 pb-1 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
              {folder.name}
            </h4>
            <ul className="ml-2 flex flex-col gap-px border-l border-white/[0.06]">
              {folder.docs
                .filter(
                  (doc) => folder.docs.length === 1 || doc.slug !== folder.slug,
                )
                .map((doc) => {
                  const isActive = doc.url === pathname;
                  return (
                    <li key={doc.slug}>
                      <Link
                        href={doc.url}
                        className={cn(
                          "-ml-px block rounded-r-md border-l py-1 pr-2 pl-3 text-[13px] transition-colors focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none",
                          isActive
                            ? "border-[#f7f8f8] font-medium text-[#f7f8f8]"
                            : "border-transparent text-[#8a8f98] hover:border-white/25 hover:text-[#f7f8f8]",
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
