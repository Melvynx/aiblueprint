import {
  getAllDocs,
  getCurrentDoc,
  getDocsTree,
} from "@public-site/docs/doc-manager";
import {
  getChrome,
  type Locale,
  withLocale,
} from "@public-site/docs/locale";

export function loadDocsPage(locale: Locale, slugParts: string[]) {
  return {
    locale,
    tree: getDocsTree(locale),
    doc: getCurrentDoc(slugParts, locale),
    allDocs: getAllDocs(locale),
  };
}

export function docsHead(
  doc: { slug: string; attributes: { title: string; description?: string } } | null,
  locale: Locale,
) {
  const copy = getChrome(locale);
  if (!doc) return {};

  const bare = doc.slug ? `/${doc.slug}` : "/";
  return {
    meta: [
      { title: `${doc.attributes.title} - ${copy.siteTitle}` },
      ...(doc.attributes.description
        ? [{ name: "description", content: doc.attributes.description }]
        : []),
    ],
    links: [
      { rel: "alternate", hrefLang: "en", href: withLocale(bare, "en") },
      { rel: "alternate", hrefLang: "fr", href: withLocale(bare, "fr") },
      { rel: "alternate", hrefLang: "x-default", href: withLocale(bare, "en") },
    ],
  };
}
