import {
  getCurrentDoc,
  getNavDocs,
  getNavTree,
  getSpaceForSlug,
} from "@public-site/docs/doc-manager";
import {
  getChrome,
  type Locale,
  SITE_URL,
  withLocale,
} from "@public-site/docs/locale";

// Only the current page ships its body; navigation data stays light so the
// prerendered HTML does not embed every doc twice.
export function loadDocsPage(locale: Locale, slugParts: string[]) {
  const space = getSpaceForSlug(slugParts.join("/"));
  return {
    locale,
    tree: getNavTree(locale, space),
    doc: getCurrentDoc(slugParts, locale),
    allDocs: getNavDocs(locale, space),
  };
}

export function docsHead(
  doc: { slug: string; attributes: { title: string; description?: string } } | null,
  locale: Locale,
) {
  const copy = getChrome(locale);
  if (!doc) return {};
  const editing = doc.slug === "editing" || doc.slug.startsWith("editing/");
  const siteTitle = editing ? copy.sections.editing : copy.siteTitle;

  const bare = doc.slug ? `/${doc.slug}` : "/";
  const title =
    doc.attributes.title === siteTitle
      ? `${siteTitle} Documentation`
      : `${doc.attributes.title} - ${siteTitle}`;
  const description = doc.attributes.description ?? copy.siteDescription;
  const url = `${SITE_URL}${withLocale(bare, locale)}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: siteTitle },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:locale", content: locale === "fr" ? "fr_FR" : "en_US" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}${withLocale(bare, "en")}` },
      { rel: "alternate", hrefLang: "fr", href: `${SITE_URL}${withLocale(bare, "fr")}` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${withLocale(bare, "en")}` },
      ...(editing ? [{ rel: "icon", type: "image/png", href: "/editing-ia-logo.png" }] : []),
    ],
  };
}
