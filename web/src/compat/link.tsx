import { Link as RouterLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type LinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
};

export default function Link({ href, ...props }: LinkProps) {
  if (/^https?:\/\//.test(href) || href.startsWith("#")) {
    return <a href={href} {...props} />;
  }

  return <RouterLink to={href} {...props} />;
}
