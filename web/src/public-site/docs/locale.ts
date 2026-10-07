export const LOCALES = ["en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const SITE_URL = "https://docs.aiblueprint.dev";
export const REPO_URL = "https://github.com/Melvynx/aiblueprint";

export type ChromeCopy = {
  docs: string;
  browse: string;
  previous: string;
  next: string;
  notFoundTitle: string;
  notFoundBody: string;
  onThisPage: string;
  backToDocs: string;
  pageNotFound: string;
  copy: string;
  copied: string;
  copyUnavailable: string;
  copyCode: string;
  copiedCode: string;
  lineWrap: string;
  language: string;
  search: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchSuggested: string;
  searchNavigate: string;
  searchSelect: string;
  searchClose: string;
  copyPage: string;
  copiedPage: string;
  editPage: string;
  askClaude: string;
  askClaudePrompt: string;
  backToTop: string;
  getStarted: string;
  browseSkills: string;
  page: string;
  pages: string;
  sections: {
    introduction: string;
    gettingStarted: string;
    coreWorkflow: string;
    advanced: string;
    commands: string;
    skills: string;
    concepts: string;
  };
  siteTitle: string;
  siteDescription: string;
  examplesTitle: string;
  examplesDescription: string;
  examplesKicker: string;
  examplesHeading: string;
  examplesIntro: string;
  examplesBack: string;
  examplesSkillList: string;
};

export const chrome = {
  en: {
    docs: "Docs",
    browse: "Browse documentation",
    previous: "Previous",
    next: "Next",
    notFoundTitle: "Page not found",
    notFoundBody: "This documentation page does not exist.",
    onThisPage: "On This Page",
    backToDocs: "Back to docs",
    pageNotFound: "Page not found",
    copy: "Copy",
    copied: "Copied",
    copyUnavailable: "Copy unavailable. Select the code and copy it manually.",
    copyCode: "Copy code",
    copiedCode: "Copied",
    lineWrap: "Line wrap",
    language: "Language",
    search: "Search",
    searchPlaceholder: "Search the docs…",
    searchNoResults: "No results for",
    searchSuggested: "Suggested",
    searchNavigate: "navigate",
    searchSelect: "open",
    searchClose: "close",
    copyPage: "Copy page",
    copiedPage: "Copied",
    editPage: "Edit on GitHub",
    askClaude: "Ask Claude",
    askClaudePrompt: "Read this AIBlueprint documentation page and help me with it:",
    backToTop: "Back to top",
    getStarted: "Get started",
    browseSkills: "Browse skills",
    page: "page",
    pages: "pages",
    sections: {
      introduction: "Introduction",
      gettingStarted: "Getting Started",
      coreWorkflow: "Core Workflow",
      advanced: "Advanced",
      commands: "Commands",
      skills: "Skills",
      concepts: "Concepts",
    },
    siteTitle: "AIBlueprint CLI",
    siteDescription:
      "Documentation for the AIBlueprint CLI — set up AI coding configurations with sensible defaults.",
    examplesTitle: "Style Examples - AIBlueprint CLI",
    examplesDescription:
      "Preview the visual styles bundled with the use-style skill.",
    examplesKicker: "visual systems · live picker",
    examplesHeading: "AIBlueprint UI style examples",
    examplesIntro:
      "Switch styles to preview the visual direction loaded by the bundled use-style skill before an agent starts UI work.",
    examplesBack: "use-style docs",
    examplesSkillList: "Skill list",
  },
  fr: {
    docs: "Docs",
    browse: "Parcourir la documentation",
    previous: "Précédent",
    next: "Suivant",
    notFoundTitle: "Page introuvable",
    notFoundBody: "Cette page de documentation n'existe pas.",
    onThisPage: "Sur cette page",
    backToDocs: "Retour à la doc",
    pageNotFound: "Page introuvable",
    copy: "Copier",
    copied: "Copié",
    copyUnavailable:
      "Copie indisponible. Sélectionnez le code et copiez-le manuellement.",
    copyCode: "Copier le code",
    copiedCode: "Copié",
    lineWrap: "Line wrap",
    language: "Langue",
    search: "Rechercher",
    searchPlaceholder: "Rechercher dans la doc…",
    searchNoResults: "Aucun résultat pour",
    searchSuggested: "Suggestions",
    searchNavigate: "naviguer",
    searchSelect: "ouvrir",
    searchClose: "fermer",
    copyPage: "Copier la page",
    copiedPage: "Copié",
    editPage: "Modifier sur GitHub",
    askClaude: "Demander à Claude",
    askClaudePrompt: "Lis cette page de la documentation AIBlueprint et aide-moi avec :",
    backToTop: "Retour en haut",
    getStarted: "Commencer",
    browseSkills: "Voir les skills",
    page: "page",
    pages: "pages",
    sections: {
      introduction: "Introduction",
      gettingStarted: "Démarrage",
      coreWorkflow: "Workflow principal",
      advanced: "Avancé",
      commands: "Commandes",
      skills: "Skills",
      concepts: "Concepts",
    },
    siteTitle: "AIBlueprint CLI",
    siteDescription:
      "Documentation de l'AIBlueprint CLI — configurez vos outils de coding IA avec des défauts solides.",
    examplesTitle: "Exemples de styles - AIBlueprint CLI",
    examplesDescription:
      "Prévisualisez les styles visuels fournis avec le skill use-style.",
    examplesKicker: "systèmes visuels · sélecteur live",
    examplesHeading: "Exemples de styles UI AIBlueprint",
    examplesIntro:
      "Changez de style pour prévisualiser la direction visuelle chargée par le skill use-style avant qu'un agent ne commence le travail UI.",
    examplesBack: "Doc use-style",
    examplesSkillList: "Liste des skills",
  },
} as const satisfies Record<Locale, ChromeCopy>;

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getChrome(locale: Locale): ChromeCopy {
  return chrome[locale];
}

export function getLocaleFromPathname(pathname: string): Locale {
  return pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/fr") return "/";
  if (pathname.startsWith("/fr/")) {
    const rest = pathname.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname || "/";
}

export function withLocale(href: string, locale: Locale): string {
  if (
    /^https?:\/\//.test(href) ||
    href.startsWith("#") ||
    href.startsWith("mailto:")
  ) {
    return href;
  }

  const path = href.startsWith("/") ? href : `/${href}`;
  const bare = stripLocalePrefix(path);
  if (locale === "en") return bare;
  if (bare === "/") return "/fr";
  return `/fr${bare}`;
}

export function switchLocalePath(pathname: string, next: Locale): string {
  return withLocale(stripLocalePrefix(pathname), next);
}

export function parseDocsSplat(splat: string | undefined): {
  locale: Locale;
  slugParts: string[];
} {
  const parts = splat ? splat.split("/").filter(Boolean) : [];
  if (parts[0] === "fr") {
    return { locale: "fr", slugParts: parts.slice(1) };
  }
  return { locale: "en", slugParts: parts };
}

export function slugifyHeading(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
