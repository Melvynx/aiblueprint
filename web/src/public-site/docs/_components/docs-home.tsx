import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Boxes,
  Check,
  Copy,
  GitBranch,
  Layers3,
  type LucideIcon,
  PanelsTopLeft,
  Rocket,
  Search,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getDocsTree } from "../doc-manager";
import { getChrome, getLocaleFromPathname, withLocale } from "../locale";
import { openDocsSearch } from "./docs-search";

export const INSTALL_COMMAND = "npx aiblueprint-cli@latest agents setup";

const FOLDER_ICONS: Record<string, LucideIcon> = {
  "getting-started": Rocket,
  "core-workflow": GitBranch,
  advanced: Layers3,
  skills: Sparkles,
  commands: Terminal,
  concepts: Boxes,
  "landing-page": PanelsTopLeft,
};

function InstallCommand() {
  const copy = getChrome(getLocaleFromPathname(usePathname()));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-[#0c1017]/90 py-2 pr-2 pl-4 font-mono text-[13px] shadow-lg shadow-black/30 sm:text-sm">
      <span aria-hidden="true" className="text-primary select-none">$</span>
      <code className="min-w-0 flex-1 truncate text-[#e1e9f5]">{INSTALL_COMMAND}</code>
      <button
        type="button"
        aria-label={copied ? copy.copiedCode : copy.copyCode}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(INSTALL_COMMAND);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
        className="grid size-8 shrink-0 place-items-center rounded-xl text-[#a6b2c5] transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        {copied ? <Check aria-hidden="true" className="size-4 text-primary" /> : <Copy aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}

export function HomeHero({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description: string;
}) {
  const locale = getLocaleFromPathname(usePathname());
  const copy = getChrome(locale);

  return (
    <section className="not-typography relative isolate flex flex-col items-start gap-6 pt-4 pb-4 sm:pt-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[28rem] w-[min(44rem,100vw)] -translate-x-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)] blur-2xl"
      />
      {kicker && (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[11px] tracking-[0.08em] text-[#a6b2c5] uppercase">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px] shadow-primary" />
          {kicker}
        </span>
      )}
      <h1 className="max-w-3xl text-[2.5rem] leading-[1.05] font-medium tracking-[-0.04em] text-balance text-[#f7f8f8] sm:text-6xl">
        {title}
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-pretty text-[#8a8f98]">
        {description}
      </p>
      <InstallCommand />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Link
          href={withLocale("/getting-started/installation", locale)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-[#08090a] no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.getStarted}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <Link
          href={withLocale("/skills", locale)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-[#f7f8f8] no-underline transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Sparkles aria-hidden="true" className="size-4 text-primary" />
          {copy.browseSkills}
        </Link>
        <button
          type="button"
          onClick={openDocsSearch}
          className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#8a8f98] transition-colors hover:text-[#f7f8f8] focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Search aria-hidden="true" className="size-4" />
          {copy.search}
          <kbd className="rounded-md border border-white/10 px-1.5 font-mono text-[10px] leading-5 text-white/40">/</kbd>
        </button>
      </div>
    </section>
  );
}

/** Every docs folder with its page count and first pages, generated from the tree. */
export function DocsSectionsGrid() {
  const locale = getLocaleFromPathname(usePathname());
  const copy = getChrome(locale);
  const folders = getDocsTree(locale).folders;

  return (
    <div className="not-typography mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => {
        const Icon = FOLDER_ICONS[folder.slug] ?? Boxes;
        const landing = folder.docs.find((doc) => doc.slug === folder.slug) ?? folder.docs[0];
        const pages = folder.docs.filter((doc) => doc.slug !== folder.slug);
        const preview = (pages.length ? pages : folder.docs).slice(0, 4);
        if (!landing) return null;

        return (
          <div
            key={folder.slug}
            className="group relative flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <Icon aria-hidden="true" className="size-4 text-primary" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-white/35 uppercase">
                {folder.docs.length} {folder.docs.length === 1 ? copy.page : copy.pages}
              </span>
            </div>
            <Link
              href={landing.url}
              className="text-base font-medium text-[#f7f8f8] no-underline after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
            >
              {folder.name}
            </Link>
            <ul className="relative z-10 flex flex-col gap-1.5">
              {preview.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={doc.url}
                    className={cn(
                      "flex items-center gap-2 text-[13px] text-[#8a8f98] no-underline transition-colors hover:text-primary",
                    )}
                  >
                    <span className="size-1 shrink-0 rounded-full bg-white/20" />
                    <span className="truncate">{doc.attributes.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
