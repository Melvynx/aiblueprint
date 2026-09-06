import { usePathname } from "@/compat/navigation";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  LOCALES,
  getChrome,
  getLocaleFromPathname,
  isLocale,
  switchLocalePath,
} from "../locale";

const LOCALE_LABELS = {
  en: "English",
  fr: "Français",
} as const;

export function LanguageSwitch() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getChrome(locale);
  const navigate = useNavigate();

  return (
    <label className="relative inline-flex">
      <span className="sr-only">{copy.language}</span>
      <select
        aria-label={copy.language}
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (!isLocale(next) || next === locale) return;
          void navigate({ href: switchLocalePath(pathname, next) });
        }}
        className="h-8 cursor-pointer appearance-none rounded-full border border-white/[0.08] bg-white/[0.04] py-0 pr-8 pl-3 text-sm font-medium text-[#c5c8ce] transition-colors hover:border-white/15 hover:bg-white/[0.07] hover:text-[#f7f8f8] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option} lang={option}>
            {LOCALE_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#8a8f98]"
      />
    </label>
  );
}
