import Markdown, { type MarkdownToJSX } from "markdown-to-jsx";
import {
  DocCard,
  DocCardGrid,
  DocCardWrapper,
  DocSection,
} from "../../docs/_components/doc-card";
import { cn } from "../../lib/utils";

type ServerMdxProps = {
  source: string;
  className?: string;
};

const MdxComponents = {
  DocCard,
  DocCardGrid,
  DocCardWrapper,
  DocSection,
} satisfies MarkdownToJSX.Overrides;

export function ServerMdx(props: ServerMdxProps) {
  return (
    <div className={cn("typography", props.className)}>
      <Markdown
        options={{
          forceBlock: true,
          overrides: MdxComponents,
          wrapper: "div",
          slugify: (value) =>
            value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
        }}
      >
        {props.source}
      </Markdown>
    </div>
  );
}
