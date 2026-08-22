import Link from "@/compat/link";
import {
  BookOpen,
  Code2,
  Eye,
  FileText,
  Key,
  Layers,
  Link2,
  Palette,
  type LucideIcon,
  Play,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Play,
  Code2,
  Settings,
  Workflow,
  BookOpen,
  Key,
  Users,
  Sparkles,
  FileText,
  Terminal,
  Shield,
  Zap,
  Layers,
  Link2,
  Palette,
  Eye,
  RefreshCw,
  Save,
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

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 no-underline",
        "transition-colors hover:border-white/20 hover:bg-white/[0.04]",
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
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
      <h3 className="font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function DocCardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-typography mt-6 flex flex-col gap-8">{children}</div>
  );
}
