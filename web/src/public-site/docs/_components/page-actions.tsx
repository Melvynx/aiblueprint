import { usePathname } from "@/compat/navigation";
import { Check, Copy, PencilLine, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { DocType } from "../doc-manager";
import { getChrome, getLocaleFromPathname, REPO_URL, SITE_URL } from "../locale";

const actionClass =
  "inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 text-xs font-medium text-[#8a8f98] no-underline transition-colors hover:border-white/15 hover:text-[#f7f8f8] focus-visible:outline-2 focus-visible:outline-primary";

export function PageActions({ doc }: { doc: DocType }) {
  const copy = getChrome(getLocaleFromPathname(usePathname()));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const markdown = [
    `# ${doc.attributes.title}`,
    doc.attributes.description,
    doc.content.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(
    `${copy.askClaudePrompt} ${SITE_URL}${doc.url}`,
  )}`;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className={actionClass}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5 text-primary" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        {copied ? copy.copiedPage : copy.copyPage}
      </button>
      <a
        href={claudeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={copy.askClaude}
        className={actionClass}
      >
        <Sparkles aria-hidden="true" className="size-3.5" />
        <span className="hidden sm:inline">{copy.askClaude}</span>
      </a>
      <a
        href={`${REPO_URL}/edit/main/${doc.sourcePath}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={copy.editPage}
        title={copy.editPage}
        className={actionClass}
      >
        <PencilLine aria-hidden="true" className="size-3.5" />
      </a>
    </div>
  );
}
