import { cn } from "@/lib/utils";
import * as React from "react";

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    for (const id of itemIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => {
      for (const id of itemIds) {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      }
    };
  }, [itemIds]);

  return activeId;
}

export type TocItem = {
  title: string;
  url: string;
  depth: number;
};

export function DocsTableOfContents({
  toc,
  className,
}: {
  toc: TocItem[];
  className?: string;
}) {
  const itemIds = React.useMemo(
    () => toc.map((item) => item.url.replace("#", "")),
    [toc],
  );
  const activeHeading = useActiveItem(itemIds);

  if (!toc.length) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        On This Page
      </h4>
      <nav className="flex flex-col gap-2">
        {toc.map((item) => (
          <a
            key={item.url}
            href={item.url}
            className={cn(
              "text-muted-foreground hover:text-foreground block text-sm no-underline transition-colors",
              item.url === `#${activeHeading}` && "text-foreground font-medium",
              item.depth === 3 && "pl-4",
              item.depth === 4 && "pl-6",
            )}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  );
}
