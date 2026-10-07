import { getDocsTree } from "./doc-manager";
import { type Locale, slugifyHeading } from "./locale";

export type SearchEntry = {
  id: string;
  /** Link target, including the heading anchor for section entries. */
  url: string;
  pageTitle: string;
  section: string;
  /** Set when the entry points at a heading inside the page. */
  heading?: string;
  description?: string;
  text: string;
  pro: boolean;
  normalized: {
    pageTitle: string;
    heading: string;
    keywords: string;
    description: string;
    text: string;
  };
};

export type SearchResult = {
  entry: SearchEntry;
  score: number;
  snippet: string;
};

export function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\w-]*\n?/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|?[-:| ]+\|[-:| ]*$/gm, "")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHeading(heading: string): string {
  return heading.replace(/[`*_]/g, "").trim();
}

const indexCache = new Map<Locale, SearchEntry[]>();

/** Splits every page into one page entry plus one entry per h2/h3 section. */
export function getSearchIndex(locale: Locale): SearchEntry[] {
  const cached = indexCache.get(locale);
  if (cached) return cached;

  const tree = getDocsTree(locale);
  const groups = [
    { name: "", docs: tree.rootDocs },
    ...tree.folders.map((folder) => ({ name: folder.name, docs: folder.docs })),
  ];
  const entries: SearchEntry[] = [];

  for (const group of groups) {
    for (const doc of group.docs) {
      const { title, description, keywords = [], pro = false } = doc.attributes;
      const section = group.name || title;
      const chunks = doc.content.split(/^(#{2,3})\s+(.+)$/m);
      const keywordText = normalize(keywords.join(" "));

      const intro = stripMarkdown(chunks[0] ?? "");
      entries.push({
        id: doc.url,
        url: doc.url,
        pageTitle: title,
        section,
        description,
        text: intro,
        pro,
        normalized: {
          pageTitle: normalize(title),
          heading: "",
          keywords: keywordText,
          description: normalize(description ?? ""),
          text: normalize(intro),
        },
      });

      for (let index = 1; index < chunks.length; index += 3) {
        const heading = cleanHeading(chunks[index + 1] ?? "");
        const text = stripMarkdown(chunks[index + 2] ?? "");
        if (!heading) continue;
        const anchor = slugifyHeading(heading);
        entries.push({
          id: `${doc.url}#${anchor}`,
          url: `${doc.url}#${anchor}`,
          pageTitle: title,
          section,
          heading,
          text,
          pro,
          normalized: {
            pageTitle: normalize(title),
            heading: normalize(heading),
            keywords: keywordText,
            description: "",
            text: normalize(text),
          },
        });
      }
    }
  }

  indexCache.set(locale, entries);
  return entries;
}

function scoreEntry(entry: SearchEntry, terms: string[], phrase: string): number {
  const { pageTitle, heading, keywords, description, text } = entry.normalized;
  let score = 0;

  for (const term of terms) {
    let termScore = 0;
    if (pageTitle.includes(term)) termScore += pageTitle.startsWith(term) ? 14 : 9;
    if (heading.includes(term)) termScore += heading.startsWith(term) ? 10 : 7;
    if (keywords.includes(term)) termScore += 5;
    if (description.includes(term)) termScore += 3;
    if (text.includes(term)) termScore += 1;
    if (termScore === 0) return 0;
    score += termScore;
  }

  if (terms.length > 1) {
    if (pageTitle.includes(phrase)) score += 12;
    if (heading.includes(phrase)) score += 8;
    if (text.includes(phrase)) score += 4;
  }
  if (pageTitle === phrase) score += 20;
  if (!entry.heading) score += 2;
  return score;
}

function buildSnippet(entry: SearchEntry, terms: string[]): string {
  const source = entry.text || entry.description || "";
  const normalized = normalize(source);
  const firstHit = terms
    .map((term) => normalized.indexOf(term))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0];

  if (firstHit === undefined || firstHit < 60) {
    return source.length > 160 ? `${source.slice(0, 160).trimEnd()}…` : source;
  }
  const start = source.lastIndexOf(" ", firstHit - 40) + 1;
  const excerpt = source.slice(start, start + 160).trimEnd();
  return `…${excerpt}${start + 160 < source.length ? "…" : ""}`;
}

export function searchDocs(locale: Locale, query: string, limit = 12): SearchResult[] {
  const phrase = normalize(query).trim().replace(/\s+/g, " ");
  if (!phrase) return [];
  const terms = Array.from(new Set(phrase.split(" ")));
  const perPage = new Map<string, number>();
  const results: SearchResult[] = [];

  const scored = getSearchIndex(locale)
    .map((entry) => ({ entry, score: scoreEntry(entry, terms, phrase) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { entry, score } of scored) {
    const pageKey = entry.url.split("#")[0];
    const seen = perPage.get(pageKey) ?? 0;
    if (seen >= 3) continue;
    perPage.set(pageKey, seen + 1);
    results.push({ entry, score, snippet: buildSnippet(entry, terms) });
    if (results.length >= limit) break;
  }

  return results;
}

/** Returns [start, end) ranges of every query term inside `value`. */
export function getHighlightRanges(value: string, query: string): Array<[number, number]> {
  const normalized = normalize(value);
  if (normalized.length !== value.length) return [];
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    let position = normalized.indexOf(term);
    while (position !== -1) {
      ranges.push([position, position + term.length]);
      position = normalized.indexOf(term, position + term.length);
    }
  }

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}
