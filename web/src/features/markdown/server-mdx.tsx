import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import {
  DocCard,
  DocCardGrid,
  DocCardWrapper,
  DocSection,
} from "@public-site/docs/_components/doc-card";
import { LandingReferenceGrid } from "@public-site/docs/_components/landing-reference-grid";
import { YouTubeEmbed } from "@public-site/docs/_components/youtube-embed";
import { useCodeWrap } from "@public-site/docs/code-wrap";
import {
  getChrome,
  getLocaleFromPathname,
  slugifyHeading,
  withLocale,
} from "@public-site/docs/locale";
import { Check, Copy, Terminal, WrapText } from "lucide-react";
import Markdown, { type MarkdownToJSX } from "markdown-to-jsx";
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

type CodeBlockProps = ComponentPropsWithoutRef<"pre">;

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [isWrapped, setWrapped] = useCodeWrap();
  const code = Children.toArray(children).find((child) => isValidElement<{ className?: string }>(child));
  const language = isValidElement<{ className?: string }>(code)
    ? code.props.className?.match(/(?:lang|language)-([\w-]+)/)?.[1] ?? "text"
    : "text";
  const copy = getChrome(getLocaleFromPathname(usePathname()));
  const label = ["bash", "sh", "shell", "zsh"].includes(language) ? "Terminal" : language.toUpperCase();

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeRef.current?.textContent ?? "");
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="not-typography my-6 min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0c1017]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-white/[0.03] px-4 py-2">
        <span className="flex items-center gap-2 font-mono text-xs text-[#a6b2c5]">
          <Terminal aria-hidden="true" className="size-3.5 text-primary" />
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-pressed={isWrapped}
            aria-label={copy.lineWrap}
            onClick={() => setWrapped(!isWrapped)}
            className={cn(
              "grid size-7 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isWrapped
                ? "bg-primary/10 text-primary"
                : "text-[#a6b2c5] hover:bg-primary/10 hover:text-primary",
            )}
          >
            <WrapText aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={copyStatus === "copied" ? copy.copiedCode : copy.copyCode}
            onClick={copyCode}
            className="grid size-7 place-items-center rounded-md text-[#a6b2c5] transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copyStatus === "copied" ? <Check aria-hidden="true" className="size-3.5 text-primary" /> : <Copy aria-hidden="true" className="size-3.5" />}
          </button>
        </div>
      </div>
      <pre
        {...props}
        ref={codeRef}
        className={cn(
          "docs-code-scroll m-0 max-w-full overflow-x-auto p-4 font-mono text-[13px] leading-7 whitespace-pre text-[#e1e9f5] [&_code]:bg-transparent [&_code]:p-0 [&_code]:font-[inherit] [&_code]:text-inherit",
          className,
        )}
      >
        {children}
      </pre>
      {copyStatus === "error" && (
        <p role="status" className="px-4 pb-3 text-xs text-[#a6b2c5]">
          {copy.copyUnavailable}
        </p>
      )}
    </div>
  );
}

type ServerMdxProps = {
  source: string;
  className?: string;
};

function DocsMarkdownLink({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const locale = getLocaleFromPathname(usePathname());
  if (!href) {
    return <a {...props}>{children}</a>;
  }

  return (
    <Link href={withLocale(href, locale)} {...props}>
      {children}
    </Link>
  );
}

const MdxComponent = {
  a: DocsMarkdownLink,
  pre: CodeBlock,
  DocCard,
  DocCardGrid,
  DocSection,
  DocCardWrapper,
  LandingReferenceGrid,
  YouTubeEmbed,
} satisfies MarkdownToJSX.Overrides;

export const ServerMdx = (props: ServerMdxProps) => {
  return (
    <div className={cn("typography", props.className)}>
      <Markdown
        options={{
          forceBlock: true,
          overrides: MdxComponent,
          wrapper: "div",
          slugify: slugifyHeading,
        }}
      >
        {props.source}
      </Markdown>
    </div>
  );
};
