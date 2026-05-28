import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArchiveRestore,
  Bot,
  Boxes,
  Code2,
  Command,
  FileText,
  KeyRound,
  Link2,
  Settings,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const ICONS: Record<string, LucideIcon> = {
  ArchiveRestore,
  Bot,
  Boxes,
  Code2,
  Command,
  FileText,
  KeyRound,
  Link2,
  Settings,
  Sparkles,
  Terminal,
};

type DocCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
  external?: boolean;
};

export function DocCard({
  href,
  icon,
  title,
  description,
  external,
}: DocCardProps) {
  const Icon = ICONS[icon] ?? FileText;
  const className = cn(
    "group border-border flex flex-col gap-3 rounded-lg border p-4 no-underline",
    "hover:border-muted-foreground/25 hover:bg-muted/40 transition-colors",
  );

  const content = (
    <>
      <Icon className="text-muted-foreground size-5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium">
          {title}
          {external && <span className="text-muted-foreground ml-1">↗</span>}
        </span>
        <span className="text-muted-foreground text-[13px] leading-snug">
          {description}
        </span>
      </div>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}

export function DocCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function DocSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

export function DocCardWrapper({ children }: { children: ReactNode }) {
  return <div className="not-typography mt-6 flex flex-col gap-8">{children}</div>;
}
