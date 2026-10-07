import { cn } from "@/lib/utils";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Inline-markdown styles for blocks rendered outside `.typography`. */
const proseInline =
  "text-[15px] leading-relaxed text-[#c5c8ce] [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded-md [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-[#f7f8f8] [&_strong]:text-[#f7f8f8] [&_p+p]:mt-3";

const CALLOUTS = {
  note: { icon: Info, className: "border-primary/25 bg-primary/[0.06]", iconClassName: "text-primary" },
  tip: { icon: Lightbulb, className: "border-emerald-400/25 bg-emerald-400/[0.06]", iconClassName: "text-emerald-300" },
  warning: { icon: TriangleAlert, className: "border-amber-400/25 bg-amber-400/[0.06]", iconClassName: "text-amber-300" },
} as const;

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof CALLOUTS;
  title?: string;
  children: ReactNode;
}) {
  const variant = CALLOUTS[type] ?? CALLOUTS.note;
  const Icon = variant.icon;

  return (
    <aside
      role="note"
      className={cn("not-typography my-6 flex gap-3 rounded-2xl border p-4", variant.className)}
    >
      <Icon aria-hidden="true" className={cn("mt-1 size-4 shrink-0", variant.iconClassName)} />
      <div className={cn("min-w-0 flex-1", proseInline)}>
        {title && <p className="mb-1 font-medium text-[#f7f8f8]">{title}</p>}
        {children}
      </div>
    </aside>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="not-typography docs-steps my-8">{children}</ol>;
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="docs-step">
      <p className="text-[15px] font-medium text-[#f7f8f8]">{title}</p>
      {children && <div className={cn("mt-1", proseInline)}>{children}</div>}
    </li>
  );
}

type HeadingProps = ComponentPropsWithoutRef<"h2">;

function createAnchoredHeading(Tag: "h2" | "h3" | "h4") {
  return function AnchoredHeading({ id, children, className, ...props }: HeadingProps) {
    return (
      <Tag id={id} className={cn("group/heading", className)} {...props}>
        {children}
        {id && (
          <span className="not-typography">
            <a
              href={`#${id}`}
              aria-hidden="true"
              tabIndex={-1}
              className="ml-2 text-[0.8em] text-white/25 no-underline opacity-0 transition-opacity group-hover/heading:opacity-100 hover:text-primary"
            >
              #
            </a>
          </span>
        )}
      </Tag>
    );
  };
}

export const H2 = createAnchoredHeading("h2");
export const H3 = createAnchoredHeading("h3");
export const H4 = createAnchoredHeading("h4");
