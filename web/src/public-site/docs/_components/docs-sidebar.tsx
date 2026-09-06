import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Boxes,
  GitBranch,
  Layers3,
  Rocket,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ProBadge } from "./doc-card";
import type { DocTree } from "../doc-manager";
import { getChrome, getLocaleFromPathname, withLocale } from "../locale";

export function DocsSidebar({
  tree,
  mobile = false,
}: {
  tree: DocTree;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getChrome(locale);
  const sections = [
    { name: copy.sections.introduction, href: "/", icon: BookOpen },
    {
      name: copy.sections.gettingStarted,
      href: "/getting-started/installation",
      activePrefix: "/getting-started",
      icon: Rocket,
    },
    {
      name: copy.sections.coreWorkflow,
      href: "/core-workflow",
      activePrefix: "/core-workflow",
      icon: GitBranch,
    },
    {
      name: copy.sections.advanced,
      href: "/advanced",
      activePrefix: "/advanced",
      icon: Layers3,
    },
    {
      name: copy.sections.skills,
      href: "/skills",
      activePrefix: "/skills",
      icon: Sparkles,
    },
    {
      name: copy.sections.commands,
      href: "/commands/agents-setup",
      activePrefix: "/commands",
      icon: Terminal,
    },
    {
      name: copy.sections.concepts,
      href: "/concepts/shell-shortcuts",
      activePrefix: "/concepts",
      icon: Boxes,
    },
  ];

  return (
    <aside
      className={cn(
        "docs-sidebar-scroll shrink-0 overflow-y-auto bg-[#08090a]",
        mobile
          ? "max-h-[65vh] w-full"
          : "sticky top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-white/[0.06] lg:block",
      )}
    >
      <nav className="flex flex-col gap-7 px-3 pt-4 pb-16">
        <div className="flex flex-col gap-0.5">
          <ul className="flex flex-col gap-0.5">
            {sections.map(({ name, href, activePrefix, icon: Icon }) => {
              const localizedHref = withLocale(href, locale);
              const localizedPrefix = activePrefix
                ? withLocale(activePrefix, locale)
                : localizedHref;
              const isActive =
                href === "/"
                  ? pathname === localizedHref
                  : pathname.startsWith(localizedPrefix);
              return (
                <li key={name}>
                  <Link
                    href={localizedHref}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-[#8a8f98] hover:bg-primary/5 hover:text-primary",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        isActive ? "text-primary" : "text-[#8a8f98]/70",
                      )}
                    />
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
                          "-ml-px flex items-center gap-1.5 rounded-r-xl border-l py-1 pr-2 pl-3 text-[13px] transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                          isActive
                            ? "border-primary bg-primary/5 font-medium text-primary"
                            : "border-transparent text-[#8a8f98] hover:border-white/25 hover:text-primary",
                        )}
                      >
                        <span className="min-w-0 truncate">
                          {doc.attributes.title}
                        </span>
                        {doc.attributes.pro ? <ProBadge /> : null}
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
