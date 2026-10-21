import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import { getChrome, getLocaleFromPathname, isEditingPath, withLocale } from "../locale";
import { SearchTrigger } from "./docs-search";
import { LanguageSwitch } from "./language-switch";

export function DocsHeader() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getChrome(locale);
  const editing = isEditingPath(pathname);
  const spaces = [
    { label: copy.siteTitle, href: "/", active: !editing },
    { label: copy.sections.editing, href: "/editing", active: editing },
  ];

  const navLinks = [
    {
      label: "GitHub",
      href: "https://github.com/Melvynx/aiblueprint",
      external: true,
    },
    {
      label: "npm",
      href: "https://www.npmjs.com/package/aiblueprint-cli",
      external: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08090a]/80">
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={withLocale(editing ? "/editing" : "/", locale)}
            className="flex items-center gap-2 no-underline"
          >
            <img
              src={editing ? "/editing-ia-logo.png" : "/aiblueprint-logo.png"}
              alt=""
              width="20"
              height="20"
              className="size-5 shrink-0 rounded-md object-contain"
            />
            <span className="text-sm sm:text-lg font-semibold tracking-[-0.025em] text-[#f7f8f8]">
              {editing ? copy.sections.editing : copy.siteTitle}
            </span>
          </Link>
          <nav aria-label="Docs" className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5 md:flex">
            {spaces.map((space) => (
              <Link
                key={space.href}
                href={withLocale(space.href, locale)}
                aria-current={space.active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium no-underline transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                  space.active
                    ? "bg-primary/15 text-primary"
                    : "text-[#8a8f98] hover:text-[#f7f8f8]",
                )}
              >
                {space.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <SearchTrigger />
          <LanguageSwitch />
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hidden rounded-full px-2 py-1.5 text-sm font-medium text-[#8a8f98] no-underline transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:inline-flex sm:px-3"
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
