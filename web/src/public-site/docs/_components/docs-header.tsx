import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import {
  getChrome,
  getLocaleFromPathname,
  withLocale,
} from "../locale";
import { LanguageSwitch } from "./language-switch";

export function DocsHeader() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getChrome(locale);

  const navLinks = [
    { label: copy.docs, href: withLocale("/", locale) },
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
            href={withLocale("/", locale)}
            className="flex items-center gap-2 sm:gap-3 no-underline"
          >
            <img
              src="/aiblueprint-logo.png"
              alt=""
              width="40"
              height="40"
              className="size-10 shrink-0 object-contain"
            />
            <span className="text-sm sm:text-lg font-semibold tracking-[-0.025em] text-[#f7f8f8]">
              AIBlueprint CLI
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitch />
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium text-[#8a8f98] no-underline transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
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
