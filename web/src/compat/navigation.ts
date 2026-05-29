import { useLocation } from "@tanstack/react-router";

export function usePathname() {
  return useLocation({ select: (location) => location.pathname });
}
