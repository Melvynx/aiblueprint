import Link from "@/compat/link";

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08090a]/80">
      <div className="flex h-16 w-full items-center justify-between px-5 lg:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <img
              src="/aiblueprint-mark.svg"
              alt=""
              width="40"
              height="40"
              className="size-10 shrink-0"
            />
            <span className="text-lg font-semibold tracking-[-0.025em] text-[#f7f8f8]">
              AIBlueprint CLI
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#8a8f98] no-underline transition-colors hover:bg-white/[0.04] hover:text-[#f7f8f8]"
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
