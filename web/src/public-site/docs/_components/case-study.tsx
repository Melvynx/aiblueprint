import { usePathname } from "@/compat/navigation";
import { cn } from "@/lib/utils";
import { Children, isValidElement, type ReactNode } from "react";
import { getLocaleFromPathname } from "../locale";

const LABELS = {
  en: { views: "views", shares: "shares", saves: "saves", winner: "Winner", median: "median", watch: "Watch on Instagram" },
  fr: { views: "vues", shares: "partages", saves: "saves", winner: "Gagnant", median: "médiane", watch: "Voir sur Instagram" },
} as const;

function useCaseStudyLocale() {
  const locale = getLocaleFromPathname(usePathname()) === "fr" ? "fr" : "en";
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US");
  const ratio = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 1 });
  return { labels: LABELS[locale], number: (value: number) => number.format(value), ratio: (value: number) => ratio.format(value) };
}

const isTrue = (value?: string | boolean) => value === true || value === "true";

type ReelProps = {
  src: string;
  poster: string;
  label: string;
  hook: string;
  views: string;
  shares: string;
  saves: string;
  href?: string;
  winner?: string | boolean;
  median?: string;
};

/** One reel of a hook test: the opening seconds as a muted loop, then its numbers. */
export function Reel({ src, poster, label, hook, views, shares, saves, href, winner, median }: ReelProps) {
  const { labels, number, ratio } = useCaseStudyLocale();
  const isWinner = isTrue(winner);
  const viewCount = Number(views);

  return (
    <figure
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-white/[0.02]",
        isWinner ? "border-primary/60 ring-2 ring-primary/30" : "border-white/[0.08]",
      )}
    >
      {isWinner && (
        <span className="absolute top-2 left-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          {labels.winner}
        </span>
      )}
      <video
        src={src}
        poster={poster}
        className="aspect-[9/16] w-full bg-black object-cover"
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="metadata"
      />
      <figcaption className="flex flex-1 flex-col gap-2 p-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{label}</span>
        <span className="text-[13px] leading-snug text-foreground">« {hook} »</span>
        <div className="mt-auto flex flex-col gap-0.5 pt-1">
          <span className={cn("text-xl font-semibold tabular-nums", isWinner ? "text-primary" : "text-foreground")}>
            {number(viewCount)} <span className="text-xs font-normal text-muted-foreground">{labels.views}</span>
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {number(Number(shares))} {labels.shares} · {number(Number(saves))} {labels.saves}
          </span>
          {median && (
            <span className="text-xs text-muted-foreground tabular-nums">
              x{ratio(viewCount / Number(median))} {labels.median}
            </span>
          )}
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-primary">
              {labels.watch} ↗
            </a>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

export function ReelGrid({ children }: { children: ReactNode }) {
  return <div className="not-typography my-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

type ProofStepProps = {
  step: string;
  title: string;
  note: string;
  images: string;
  winner?: string | boolean;
};

/** One step of the Instagram proof: its screenshots (comma separated) and what they show. */
export function ProofStep({ step, title, note, images, winner }: ProofStepProps) {
  const { labels } = useCaseStudyLocale();
  const isWinner = isTrue(winner);
  const sources = images.split(",").map((image) => image.trim());

  return (
    <figure className={cn("flex flex-col gap-3", sources.length > 1 && "col-span-2")}>
      <div className={cn("grid gap-3", sources.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {sources.map((source) => (
          <div
            key={source}
            className={cn(
              "relative overflow-hidden rounded-2xl border",
              isWinner ? "border-primary/60 ring-2 ring-primary/30" : "border-white/[0.08]",
            )}
          >
            {isWinner && (
              <span className="absolute top-2 left-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {labels.winner}
              </span>
            )}
            <img src={source} alt="" loading="lazy" className="aspect-[9/16] w-full object-cover" />
          </div>
        ))}
      </div>
      <figcaption className="flex flex-col gap-1">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{step}</span>
        <span className={cn("text-sm font-semibold", isWinner ? "text-primary" : "text-foreground")}>{title}</span>
        <span className="text-xs leading-snug text-muted-foreground">{note}</span>
      </figcaption>
    </figure>
  );
}

export function ProofStrip({ children }: { children: ReactNode }) {
  return <div className="not-typography my-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

type BarProps = { label: string; value: string; winner?: string | boolean };

/** Data holder read by ViewsBars; renders nothing on its own. */
export function Bar(_props: BarProps) {
  return null;
}

/** Horizontal bars of views, with the account median drawn as a dashed line. */
export function ViewsBars({ median, children }: { median: string; children: ReactNode }) {
  const { labels, number } = useCaseStudyLocale();
  const bars = Children.toArray(children)
    .filter(isValidElement<BarProps>)
    .map((child) => ({ ...child.props, count: Number(child.props.value) }));
  const medianCount = Number(median);
  const max = Math.max(medianCount, ...bars.map((bar) => bar.count)) * 1.08;
  const medianLeft = `${(medianCount / max) * 100}%`;

  return (
    <figure className="not-typography my-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        {bars.map((bar) => {
          const isWinner = isTrue(bar.winner);
          return (
            <div key={bar.label} className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">{bar.label}</span>
              <div className="relative h-7">
                <div
                  className={cn("h-full rounded-md", isWinner ? "bg-primary" : "bg-white/20")}
                  style={{ width: `max(${(bar.count / max) * 100}%, 4px)` }}
                />
                <span
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 pl-2 text-xs font-medium tabular-nums",
                    isWinner ? "text-primary-foreground" : "text-foreground",
                  )}
                  style={isWinner ? { left: 0 } : { left: `${(bar.count / max) * 100}%` }}
                >
                  {number(bar.count)}
                </span>
                <div className="absolute inset-y-[-6px] z-10 border-l-2 border-dashed border-amber-300/80" style={{ left: medianLeft }} />
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 grid grid-cols-[3.5rem_1fr] gap-3 text-xs text-muted-foreground">
        <span />
        <span className="relative h-4">
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: medianLeft }}>
            {labels.median} ≈ {number(medianCount)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
