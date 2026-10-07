import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, FileText, Hash, Search } from "lucide-react";
import {
  Fragment,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getChrome, getLocaleFromPathname, withLocale } from "../locale";
import {
  getHighlightRanges,
  getSearchIndex,
  type SearchResult,
  searchDocs,
} from "../search";
import { ProBadge } from "./doc-card";

const OPEN_EVENT = "docs:open-search";

const SUGGESTED_PATHS = [
  "/getting-started/installation",
  "/getting-started/quick-start",
  "/advanced/apex",
  "/skills",
  "/commands/agents-setup",
  "/concepts/security",
];

export function openDocsSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function useIsMac() {
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);
  return isMac;
}

export function SearchTrigger({
  className,
  expanded = false,
}: {
  className?: string;
  /** Show the placeholder at every width instead of collapsing to an icon on mobile. */
  expanded?: boolean;
}) {
  const copy = getChrome(getLocaleFromPathname(usePathname()));
  const isMac = useIsMac();

  return (
    <button
      type="button"
      onClick={openDocsSearch}
      aria-label={copy.search}
      className={cn(
        "group flex h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 text-sm text-[#8a8f98] transition-colors hover:border-white/15 hover:bg-white/[0.07] hover:text-[#f7f8f8] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none sm:w-56 sm:px-3",
        expanded && "w-full max-w-xs px-3",
        className,
      )}
    >
      <Search aria-hidden="true" className="size-3.5 shrink-0" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left whitespace-nowrap",
          expanded ? "inline" : "hidden sm:inline",
        )}
      >{copy.searchPlaceholder}</span>
      <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] leading-5 text-white/50 sm:inline">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

function Highlight({ value, query }: { value: string; query: string }) {
  const ranges = getHighlightRanges(value, query);
  if (!ranges.length) return <>{value}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) parts.push(value.slice(cursor, start));
    parts.push(
      <mark key={index} className="rounded-sm bg-primary/20 px-px text-[#f7f8f8]">
        {value.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  parts.push(value.slice(cursor));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}

export function DocsSearch() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getChrome(locale);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const suggestions = useMemo<SearchResult[]>(() => {
    if (!open) return [];
    const index = getSearchIndex(locale);
    return SUGGESTED_PATHS.map((path) =>
      index.find((entry) => !entry.heading && entry.url === withLocale(path, locale)),
    )
      .filter((entry) => entry !== undefined)
      .map((entry) => ({ entry, score: 0, snippet: entry.description ?? "" }));
  }, [open, locale]);

  const results = useMemo(
    () => (query.trim() ? searchDocs(locale, query) : suggestions),
    [query, locale, suggestions],
  );

  const close = useCallback(() => {
    setOpen(false);
    restoreFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    function onOpen() {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else onOpen();
      } else if (event.key === "/" && !isTyping && !open) {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    inputRef.current?.focus();
    inputRef.current?.select();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function go(result: SearchResult | undefined) {
    if (!result) return;
    setOpen(false);
    void navigate({ href: result.entry.url });
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  if (!open) return null;

  let lastSection = "";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-3 sm:px-4 sm:pt-[14vh]">
      <button
        type="button"
        aria-label={copy.searchClose}
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.search}
        className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(36rem,76vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f11] shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
          <Search aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={copy.searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="docs-search-results"
            aria-activedescendant={results[activeIndex] ? `docs-search-${activeIndex}` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-base sm:text-[15px] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-white/10 px-1.5 font-mono text-[10px] leading-5 text-white/40 transition-colors hover:text-white/70 focus-visible:outline-2 focus-visible:outline-primary"
          >
            esc
          </button>
        </div>

        <ul
          ref={listRef}
          id="docs-search-results"
          role="listbox"
          className="docs-sidebar-scroll flex-1 overflow-y-auto p-2"
        >
          {!query.trim() && (
            <li className="px-3 pt-2 pb-1.5 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
              {copy.searchSuggested}
            </li>
          )}
          {query.trim() && results.length === 0 && (
            <li className="px-3 py-12 text-center text-sm text-[#8a8f98]">
              {copy.searchNoResults} “<span className="text-[#f7f8f8]">{query}</span>”
            </li>
          )}
          {results.map((result, index) => {
            const { entry } = result;
            const showSection = query.trim() && entry.section !== lastSection;
            lastSection = entry.section;
            const isActive = index === activeIndex;
            const Icon = entry.heading ? Hash : FileText;

            return (
              <Fragment key={entry.id}>
                {showSection && (
                  <li
                    role="presentation"
                    className="px-3 pt-3 pb-1.5 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase first:pt-2"
                  >
                    {entry.section}
                  </li>
                )}
                <li
                  id={`docs-search-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={index}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => go(result)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    isActive ? "bg-primary/10" : "hover:bg-white/[0.03]",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      isActive ? "text-primary" : "text-white/30",
                    )}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#f7f8f8]">
                      {entry.heading ? (
                        <>
                          <span className="truncate text-[#8a8f98]">{entry.pageTitle}</span>
                          <span className="text-white/20">›</span>
                          <span className="truncate">
                            <Highlight value={entry.heading} query={query} />
                          </span>
                        </>
                      ) : (
                        <span className="truncate">
                          <Highlight value={entry.pageTitle} query={query} />
                        </span>
                      )}
                      {entry.pro ? <ProBadge /> : null}
                    </span>
                    {result.snippet && (
                      <span className="line-clamp-2 text-[13px] leading-snug text-[#8a8f98]">
                        <Highlight value={result.snippet} query={query} />
                      </span>
                    )}
                  </div>
                  <CornerDownLeft
                    aria-hidden="true"
                    className={cn("mt-1 size-3.5 shrink-0 text-primary", !isActive && "invisible")}
                  />
                </li>
              </Fragment>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 border-t border-white/[0.08] px-4 py-2.5 font-mono sm:flex text-[10px] text-white/40">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 px-1">↑</kbd>
            <kbd className="rounded border border-white/10 px-1">↓</kbd>
            {copy.searchNavigate}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 px-1">↵</kbd>
            {copy.searchSelect}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 px-1">esc</kbd>
            {copy.searchClose}
          </span>
        </div>
      </div>
    </div>
  );
}
