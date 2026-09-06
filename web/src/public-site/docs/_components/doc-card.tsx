import Link from "@/compat/link";
import { usePathname } from "@/compat/navigation";
import { getLocaleFromPathname, withLocale } from "../locale";
import {
  BookOpen,
  Code2,
  Eye,
  FileText,
  Gauge,
  HardDrive,
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
  Target,
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
  Gauge,
  HardDrive,
  RefreshCw,
  Save,
  Target,
};

export function ProBadge() {
  return (
    <span className="rounded-full bg-primary/15 px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.14em] text-primary">
      PRO
    </span>
  );
}

type DocCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
  external?: boolean;
  pro?: boolean;
};

export function DocCard({
  href,
  icon,
  title,
  description,
  external,
  pro,
}: DocCardProps) {
  const Icon = ICONS[icon] ?? FileText;
  const locale = getLocaleFromPathname(usePathname());

  return (
    <Link
      href={withLocale(href, locale)}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 no-underline",
        "transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary",
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Icon className="text-primary size-5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground flex items-center gap-1.5 text-sm font-medium">
          {title}
          {pro ? <ProBadge /> : null}
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
