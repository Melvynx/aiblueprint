import {
  DocCard,
  DocCardGrid,
  DocCardWrapper,
  DocSection,
} from "@/components/docs/doc-card";
import { slugifyHeading } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import Markdown, { type MarkdownToJSX } from "markdown-to-jsx";

type ServerMdxProps = {
  source: string;
  className?: string;
};

const MdxComponents = {
  DocCard,
  DocCardGrid,
  DocSection,
  DocCardWrapper,
} satisfies MarkdownToJSX.Overrides;

export function ServerMdx(props: ServerMdxProps) {
  return (
    <div className={cn("typography", props.className)}>
      <Markdown
        options={{
          forceBlock: true,
          overrides: MdxComponents,
          wrapper: "div",
          slugify: slugifyHeading,
        }}
      >
        {props.source}
      </Markdown>
    </div>
  );
}
