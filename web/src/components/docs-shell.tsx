import { Markdown } from "@/components/markdown";
import {
  getAdjacentDocs,
  getAllDocs,
  getTableOfContents,
  type DocPage,
} from "@/docs/doc-manager";

function Header() {
  return (
    <header className="docs-header">
      <a className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          AB
        </span>
        <span>AIBlueprint CLI</span>
      </a>
      <nav className="header-nav" aria-label="Primary">
        <a href="/">Docs</a>
        <a href="/agents">Commands</a>
        <a href="https://github.com/Melvynx/aiblueprint">GitHub</a>
      </nav>
    </header>
  );
}

function Sidebar({ currentDoc }: { currentDoc: DocPage }) {
  const docs = getAllDocs();

  return (
    <aside className="docs-sidebar">
      <nav>
        <div className="sidebar-section">
          <h2>Documentation</h2>
          <ul>
            {docs.map((doc) => (
              <li key={doc.url}>
                <a
                  className={doc.slug === currentDoc.slug ? "active" : ""}
                  href={doc.url}
                >
                  {doc.attributes.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

function Toc({ doc }: { doc: DocPage }) {
  const toc = getTableOfContents(doc.content);

  return (
    <aside className="toc">
      <h2>On this page</h2>
      <nav>
        {toc.map((item) => (
          <a
            className={`toc-depth-${item.depth}`}
            href={`#${item.id}`}
            key={item.id}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function Pager({ doc }: { doc: DocPage }) {
  const adjacent = getAdjacentDocs(doc);

  return (
    <nav className="doc-pager" aria-label="Documentation pagination">
      {adjacent.previous ? (
        <a href={adjacent.previous.url}>
          <span>Previous</span>
          {adjacent.previous.attributes.title}
        </a>
      ) : (
        <span />
      )}
      {adjacent.next ? (
        <a href={adjacent.next.url}>
          <span>Next</span>
          {adjacent.next.attributes.title}
        </a>
      ) : null}
    </nav>
  );
}

export function DocsShell({ doc }: { doc: DocPage }) {
  return (
    <div className="docs-app">
      <Header />
      <div className="docs-layout">
        <Sidebar currentDoc={doc} />
        <main className="docs-main">
          <article className="doc-page">
            <div className="doc-intro">
              <p className="eyebrow">Documentation</p>
              <h1>{doc.attributes.title}</h1>
              <p>{doc.attributes.description}</p>
            </div>
            <Markdown source={doc.content} />
            <Pager doc={doc} />
          </article>
        </main>
        <Toc doc={doc} />
      </div>
    </div>
  );
}
