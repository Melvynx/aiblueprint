import { usePathname } from "@/compat/navigation";
import { useNavigate } from "@tanstack/react-router";
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
    <select
      aria-label={copy.language}
      value={locale}
      onChange={(event) => {
        const next = event.target.value;
        if (!isLocale(next) || next === locale) return;
        void navigate({ href: switchLocalePath(pathname, next) });
      }}
      className="h-8 rounded-md border border-white/[0.08] bg-[#08090a] px-2 text-sm font-medium text-[#8a8f98] focus-visible:outline-2 focus-visible:outline-primary"
    >
      {LOCALES.map((option) => (
        <option key={option} value={option} lang={option}>
          {LOCALE_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
