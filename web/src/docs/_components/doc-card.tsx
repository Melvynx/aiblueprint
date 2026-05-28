import { Link } from "@tanstack/react-router";
import {
  Archive,
  BookOpen,
  Code2,
  FolderSync,
  KeyRound,
  Layers3,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Archive,
  BookOpen,
  Code2,
  FolderSync,
  KeyRound,
  Layers3,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
};

type DocCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
};

export function DocCard({ href, icon, title, description }: DocCardProps) {
  const Icon = ICONS[icon] ?? BookOpen;

  return (
    <Link
      to={href}
      className={cn(
        "group border-border flex flex-col gap-3 rounded-lg border p-4 no-underline",
        "hover:border-muted-foreground/25 hover:bg-muted/40 transition-colors",
      )}
    >
      <Icon className="text-muted-foreground size-5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium">{title}</span>
        <span className="text-muted-foreground text-[13px] leading-snug">
          {description}
        </span>
      </div>
    </Link>
  );
}

export function DocCardGrid({ children }: { children: React.ReactNode }) {
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
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

export function DocCardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-typography mt-6 flex flex-col gap-8">{children}</div>
  );
}
