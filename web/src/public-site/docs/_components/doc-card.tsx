import Link from "@/compat/link";
import {
  BookOpen,
  Code2,
  FileText,
  Key,
  Layers,
  Link2,
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
        "group border-border flex flex-col gap-3 rounded-lg border p-4 no-underline",
        "hover:border-muted-foreground/25 hover:bg-muted/40 transition-colors",
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
