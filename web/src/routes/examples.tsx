import Link from "@/compat/link";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Check, Columns2, Palette } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";

type StyleExample = {
  slug: string;
  name: string;
  label: string;
  description: string;
  mood: string;
  frame: CSSProperties;
  surface: CSSProperties;
  accent: string;
  secondaryAccent: string;
  text: string;
  muted: string;
  border: string;
  shadow: string;
  radius: number;
  font: string;
};

const styles: StyleExample[] = [
  {
    slug: "ios-app",
    name: "iOS App",
    label: "Native mobile shell",
    description:
      "Ink-and-paper mobile UI, one yellow spark, native tabs, and flat hairline cards.",
    mood: "native, tactile, focused",
    frame: { background: "#e9e7df" },
    surface: { background: "#f8f6ef" },
    accent: "#111111",
    secondaryAccent: "#FFE040",
    text: "#171717",
    muted: "#6b6a64",
    border: "#d5d1c7",
    shadow: "0 24px 70px rgba(33, 31, 24, 0.14)",
    radius: 28,
    font: "Inter, sans-serif",
  },
  {
    slug: "grid",
    name: "Grid",
    label: "Blueprint landing",
    description:
      "Square geometry, 1px borders, mono metrics, and a technical product grid.",
    mood: "structured, precise, diagrammatic",
    frame: { background: "#f6f7f8" },
    surface: { background: "#ffffff" },
    accent: "#111827",
    secondaryAccent: "#e5e7eb",
    text: "#111827",
    muted: "#6b7280",
    border: "#111827",
    shadow: "none",
    radius: 0,
    font: "Inter, sans-serif",
  },
  {
    slug: "vercel",
    name: "Vercel",
    label: "Infrastructure product",
    description:
      "Exact black canvas, quiet hairlines, dense deployment data, and editorial whitespace.",
    mood: "precise, spacious, operational",
    frame: { background: "#000000" },
    surface: { background: "#0a0a0a" },
    accent: "#ffffff",
    secondaryAccent: "#333333",
    text: "#fafafa",
    muted: "#a1a1aa",
    border: "#333333",
    shadow: "none",
    radius: 6,
    font: "Inter, sans-serif",
  },
  {
    slug: "black-grid",
    name: "Black Grid",
    label: "Austere developer tool",
    description:
      "Monochrome technical surfaces, sharp line-defined indexes, and zero decoration.",
    mood: "austere, technical, exact",
    frame: { background: "#050505" },
    surface: { background: "#000000" },
    accent: "#f5f5f5",
    secondaryAccent: "#171717",
    text: "#f5f5f5",
    muted: "#8a8a8a",
    border: "#2a2a2a",
    shadow: "none",
    radius: 0,
    font: "Inter, sans-serif",
  },
  {
    slug: "stripe",
    name: "Stripe",
    label: "Fintech dashboard",
    description:
      "Pale canvas, blurple accent, white panels, and optimistic product motion.",
    mood: "bright, polished, financial",
    frame: { background: "linear-gradient(135deg, #f6f9fc 0%, #eef4ff 100%)" },
    surface: { background: "#ffffff" },
    accent: "#635BFF",
    secondaryAccent: "#00d4a6",
    text: "#0a2540",
    muted: "#425466",
    border: "#d9e2ec",
    shadow: "0 24px 60px rgba(50, 50, 93, 0.16)",
    radius: 18,
    font: "Inter, sans-serif",
  },
  {
    slug: "linear",
    name: "Linear",
    label: "Dense app shell",
    description:
      "Near-black panes, sidebar/list/detail structure, and quiet indigo selection.",
    mood: "dense, aligned, operational",
    frame: { background: "#08090a" },
    surface: { background: "#101113" },
    accent: "#5e6ad2",
    secondaryAccent: "#1f2937",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    border: "#27272a",
    shadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
    radius: 10,
    font: "Inter, sans-serif",
  },
  {
    slug: "new-york-times",
    name: "New York Times",
    label: "Editorial layout",
    description:
      "Paper canvas, serif headlines, hairline rules, and a broadsheet rhythm.",
    mood: "editorial, crisp, authoritative",
    frame: { background: "#f7f5ef" },
    surface: { background: "#fffdf7" },
    accent: "#111111",
    secondaryAccent: "#b91c1c",
    text: "#111111",
    muted: "#525252",
    border: "#111111",
    shadow: "none",
    radius: 0,
    font: "Georgia, serif",
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    label: "Warm AI lab",
    description:
      "Cream paper, clay-coral accents, reading serif, and soft dark product panels.",
    mood: "warm, researched, calm",
    frame: { background: "#f0efe9" },
    surface: { background: "#f8f6ef" },
    accent: "#cc785c",
    secondaryAccent: "#2f2a25",
    text: "#2f2a25",
    muted: "#6f675f",
    border: "#d8d3c8",
    shadow: "0 24px 70px rgba(47, 42, 37, 0.16)",
    radius: 24,
    font: "Inter, sans-serif",
  },
  {
    slug: "gumroad",
    name: "Gumroad",
    label: "Creator commerce",
    description:
      "Loud yellow and pink fills, thick black borders, and hard offset shadows.",
    mood: "bold, playful, commercial",
    frame: { background: "#ffc900" },
    surface: { background: "#ff90e8" },
    accent: "#000000",
    secondaryAccent: "#23a094",
    text: "#000000",
    muted: "#1f1f1f",
    border: "#000000",
    shadow: "8px 8px 0 #000000",
    radius: 12,
    font: "Inter, sans-serif",
  },
  {
    slug: "raycast",
    name: "Raycast",
    label: "Glossy product",
    description:
      "Dark glossy surfaces, red glow, floating glass navigation, and premium scale.",
    mood: "glossy, premium, cinematic",
    frame: {
      background:
        "radial-gradient(circle at 20% 10%, rgba(255, 99, 99, 0.45), transparent 32%), #0a0a0a",
    },
    surface: {
      background: "rgba(20, 20, 22, 0.82)",
      backdropFilter: "blur(18px)",
    },
    accent: "#ff6363",
    secondaryAccent: "#f97316",
    text: "#ffffff",
    muted: "#c4c4c7",
    border: "rgba(255, 255, 255, 0.14)",
    shadow: "0 30px 90px rgba(255, 99, 99, 0.22)",
    radius: 28,
    font: "Inter, sans-serif",
  },
  {
    slug: "dusk",
    name: "Dusk",
    label: "Data workspace",
    description:
      "Twilight backdrop, dark floating window, blue charts, and colorful pills.",
    mood: "refined, data-rich, atmospheric",
    frame: {
      background:
        "linear-gradient(135deg, #111827 0%, #27346a 52%, #5b2b6f 100%)",
    },
    surface: { background: "#0d1117" },
    accent: "#38bdf8",
    secondaryAccent: "#3b6eff",
    text: "#f8fafc",
    muted: "#94a3b8",
    border: "rgba(148, 163, 184, 0.25)",
    shadow: "0 30px 100px rgba(0, 0, 0, 0.5)",
    radius: 22,
    font: "Inter, sans-serif",
  },
  {
    slug: "luma",
    name: "Luma",
    label: "Events and calendar",
    description:
      "Near-black event feed, soft teal aurora, photo-led cards, and crisp RSVP actions.",
    mood: "social, atmospheric, immediate",
    frame: {
      background:
        "radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.28), transparent 36%), #0a0a0b",
    },
    surface: { background: "#121214" },
    accent: "#ffffff",
    secondaryAccent: "#2f6bff",
    text: "#f7f7f7",
    muted: "#9b9ba1",
    border: "#242428",
    shadow: "0 28px 90px rgba(0, 0, 0, 0.45)",
    radius: 24,
    font: "Inter, sans-serif",
  },
  {
    slug: "testspirite",
    name: "TestSpirite",
    label: "Calm dev-tool shell",
    description:
      "Warm paper canvas, forest-green actions, grouped navigation, and quiet status cards.",
    mood: "calm, trustworthy, structured",
    frame: { background: "#f0f1ec" },
    surface: { background: "#ffffff" },
    accent: "#3d7c4e",
    secondaryAccent: "#eaf3ea",
    text: "#1a1c19",
    muted: "#8a8d84",
    border: "#e0e2da",
    shadow: "0 24px 70px rgba(43, 56, 44, 0.1)",
    radius: 18,
    font: "Inter, sans-serif",
  },
];

export const Route = createFileRoute("/examples")({
  head: () => ({
    meta: [
      { title: "Style Examples - AIBlueprint CLI" },
      {
        name: "description",
        content: "Preview the visual styles bundled with the use-style skill.",
      },
    ],
  }),
  component: ExamplesRoute,
});

function ExamplesRoute() {
  const [selectedSlug, setSelectedSlug] = useState(styles[0].slug);
  const selected = useMemo(
    () => styles.find((style) => style.slug === selectedSlug) ?? styles[0],
    [selectedSlug],
  );

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,#ffffff_0%,#f4f4f6_48%,#ececf0_100%)] text-[#171717]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_24px_80px_rgba(24,24,27,0.08)] backdrop-blur-xl md:flex-row md:items-end md:justify-between sm:p-7">
          <div className="flex max-w-3xl flex-col gap-3">
            <Link
              href="/concepts/use-style"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-[#d9d9dd] bg-white px-3 py-2 text-sm font-medium text-[#3f3f46] no-underline transition-colors hover:bg-[#f1f1f3]"
            >
              <ArrowLeft className="size-4" />
              use-style docs
            </Link>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-[#111827] text-white">
                <Palette className="size-5" />
              </span>
              <div>
                <p className="font-mono text-xs font-semibold tracking-wider text-[#71717a] uppercase">
                  {styles.length} visual systems · live picker
                </p>
                <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                  AIBlueprint UI style examples
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#52525b]">
              Switch styles to preview the visual direction loaded by the
              bundled use-style skill before an agent starts UI work.
            </p>
          </div>
          <a
            href="/concepts/skills"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[#111827] px-4 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:bg-[#27272a]"
          >
            <Columns2 className="size-4" />
            Skill list
          </a>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="grid gap-2 rounded-2xl border border-white/80 bg-white/70 p-2 shadow-[0_20px_60px_rgba(24,24,27,0.06)] backdrop-blur-xl">
              {styles.map((style) => {
                const isSelected = style.slug === selected.slug;
                return (
                  <button
                    key={style.slug}
                    type="button"
                    onClick={() => setSelectedSlug(style.slug)}
                    className={cn(
                      "flex min-h-20 w-full items-start gap-3 rounded-xl border bg-white p-3 text-left transition-all",
                      isSelected
                        ? "border-[#111827] shadow-[0_8px_24px_rgba(24,24,27,0.1)]"
                        : "border-transparent hover:-translate-y-0.5 hover:border-[#d9d9dd]",
                    )}
                  >
                    <span
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border"
                      style={{
                        background: isSelected ? style.accent : "#ffffff",
                        borderColor: isSelected ? style.accent : "#d9d9dd",
                        color: isSelected ? "#ffffff" : "#71717a",
                      }}
                    >
                      {isSelected ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#18181b]">
                        {style.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#71717a]">
                        {style.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0">
            <div
              className="min-h-[680px] overflow-hidden border p-4 shadow-[0_28px_90px_rgba(24,24,27,0.1)] sm:p-8"
              style={{
                ...selected.frame,
                borderColor: selected.border,
                borderRadius: selected.radius + 8,
              }}
            >
              <StyleScene style={selected} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Style", selected.slug],
                ["Mood", selected.mood],
                ["Accent", selected.accent],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-[#d9d9dd] bg-white p-4"
                >
                  <p className="font-mono text-[11px] font-semibold tracking-wider text-[#71717a] uppercase">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#18181b]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StyleScene({ style }: { style: StyleExample }) {
  const isEditorial = style.slug === "new-york-times";
  const isAppShell = [
    "ios-app",
    "linear",
    "dusk",
    "luma",
    "testspirite",
  ].includes(style.slug);
  const isBrutal = style.slug === "gumroad";

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden border",
      )}
      style={{
        ...style.surface,
        borderColor: style.border,
        borderRadius: style.radius,
        boxShadow: style.shadow,
        color: style.text,
        fontFamily: style.font,
      }}
    >
      <>
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: style.border }}
        >
          <div className="flex items-center gap-3">
            <span
              className="grid size-9 place-items-center border text-sm font-bold"
              style={{
                background: style.accent,
                borderColor: style.border,
                borderRadius: Math.max(0, style.radius - 8),
                color:
                  style.slug === "stripe"
                    ? "#ffffff"
                    : style.surface.background?.toString().includes("#0")
                      ? "#ffffff"
                      : "#ffffff",
              }}
            >
              AI
            </span>
            <div>
              <p className="text-sm font-semibold">AIBlueprint</p>
              <p className="text-xs" style={{ color: style.muted }}>
                {style.label}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {["Agents", "Skills", "Config"].map((item) => (
              <span
                key={item}
                className="border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: style.border,
                  borderRadius: Math.max(0, style.radius - 10),
                  color: style.muted,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {isEditorial ? (
          <EditorialPreview style={style} />
        ) : isAppShell ? (
          <AppShellPreview style={style} />
        ) : (
          <MarketingPreview style={style} isBrutal={isBrutal} />
        )}
      </>
    </div>
  );
}

function MarketingPreview({
  style,
  isBrutal,
}: {
  style: StyleExample;
  isBrutal: boolean;
}) {
  return (
    <div className="grid flex-1 gap-6 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
      <div className="flex flex-col justify-center gap-6">
        <p
          className="w-fit border px-3 py-1 font-mono text-xs font-semibold tracking-wider uppercase"
          style={{
            background: isBrutal ? style.secondaryAccent : "transparent",
            borderColor: style.border,
            borderRadius: Math.max(0, style.radius - 10),
            color: isBrutal ? style.text : style.accent,
          }}
        >
          {style.slug}
        </p>
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-bold tracking-normal sm:text-6xl">
            Build agent-ready UI without losing the visual direction.
          </h2>
          <p
            className="max-w-xl text-base leading-7"
            style={{ color: style.muted }}
          >
            {style.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span
            className="inline-flex h-11 items-center border px-5 text-sm font-semibold"
            style={{
              background: style.accent,
              borderColor: style.border,
              borderRadius: Math.max(0, style.radius - 8),
              color: style.slug === "gumroad" ? "#ffffff" : "#ffffff",
              boxShadow: isBrutal ? "4px 4px 0 #000000" : "none",
            }}
          >
            Apply style
          </span>
          <span
            className="inline-flex h-11 items-center border px-5 text-sm font-semibold"
            style={{
              background: "transparent",
              borderColor: style.border,
              borderRadius: Math.max(0, style.radius - 8),
              color: style.text,
            }}
          >
            View spec
          </span>
        </div>
      </div>
      <div
        className="grid min-h-[320px] gap-3 border p-4"
        style={{
          borderColor: style.border,
          borderRadius: Math.max(0, style.radius - 4),
          background:
            style.slug === "raycast"
              ? "rgba(255,255,255,0.08)"
              : style.secondaryAccent,
        }}
      >
        {["Typography", "Color", "Layout"].map((item, index) => (
          <div
            key={item}
            className="flex items-center justify-between border px-4 py-3"
            style={{
              background: style.surface.background,
              borderColor: style.border,
              borderRadius: Math.max(0, style.radius - 8),
              boxShadow: isBrutal ? "4px 4px 0 #000000" : "none",
            }}
          >
            <div>
              <p className="text-sm font-semibold">{item}</p>
              <p className="text-xs" style={{ color: style.muted }}>
                locked to {style.slug}
              </p>
            </div>
            <span
              className="h-2 w-24"
              style={{
                background:
                  index === 0
                    ? style.accent
                    : index === 1
                      ? style.secondaryAccent
                      : style.border,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AppShellPreview({ style }: { style: StyleExample }) {
  return (
    <div className="grid flex-1 md:grid-cols-[190px_1fr]">
      <div className="border-r p-4" style={{ borderColor: style.border }}>
        <div className="grid gap-2">
          {["Inbox", "Roadmap", "Automations", "Settings"].map(
            (item, index) => (
              <div
                key={item}
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  background: index === 1 ? style.accent : "transparent",
                  color: index === 1 ? "#ffffff" : style.muted,
                }}
              >
                {item}
              </div>
            ),
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_1.1fr]">
        <div className="border-r p-4" style={{ borderColor: style.border }}>
          <p className="mb-3 text-sm font-semibold">Active tasks</p>
          <div className="grid gap-2">
            {["Sync free skills", "Write docs page", "Ship examples"].map(
              (item, index) => (
                <div
                  key={item}
                  className="border p-3"
                  style={{
                    background:
                      index === 0 ? style.secondaryAccent : "transparent",
                    borderColor: style.border,
                    borderRadius: 8,
                  }}
                >
                  <p className="text-sm font-medium">{item}</p>
                  <p className="mt-1 text-xs" style={{ color: style.muted }}>
                    UI style system
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold">Style analytics</p>
          <div className="mt-5 flex h-52 items-end gap-3">
            {[42, 88, 64, 118, 76, 132].map((height, index) => (
              <div
                key={height}
                className="flex-1 rounded-t-md"
                style={{
                  height,
                  background:
                    index === 4 ? style.accent : style.secondaryAccent,
                }}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Grid", "Flows", "Dashboard"].map((item, index) => (
              <span
                key={item}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background:
                    index === 0 ? style.accent : style.secondaryAccent,
                  color: index === 0 ? "#ffffff" : style.text,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorialPreview({ style }: { style: StyleExample }) {
  return (
    <div className="flex flex-1 flex-col p-5 sm:p-8">
      <p className="border-b pb-3 text-center text-4xl font-black tracking-normal sm:text-6xl">
        AIBlueprint Times
      </p>
      <div
        className="grid flex-1 gap-6 border-b py-6 lg:grid-cols-[1.2fr_0.8fr]"
        style={{ borderColor: style.border }}
      >
        <article>
          <p
            className="font-mono text-xs font-bold tracking-wider uppercase"
            style={{ color: style.secondaryAccent }}
          >
            Design desk
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">
            A named visual system changes the result before code is written
          </h2>
          <p
            className="mt-4 columns-1 text-sm leading-7 sm:columns-2"
            style={{ color: style.muted }}
          >
            {style.description} The skill gives the agent a concrete editorial
            grammar: type scale, rules, spacing, contrast, and composition.
          </p>
        </article>
        <div className="grid gap-4">
          {["Opinion", "Systems", "Reference"].map((item) => (
            <div
              key={item}
              className="border-t pt-3"
              style={{ borderColor: style.border }}
            >
              <p
                className="font-mono text-xs uppercase"
                style={{ color: style.secondaryAccent }}
              >
                {item}
              </p>
              <p className="mt-2 text-xl font-bold">
                Style specs reduce generic output.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
